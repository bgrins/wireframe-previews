import {
  Builder,
  Browser,
  Capabilities,
} from "selenium-webdriver";
import * as firefox from "selenium-webdriver/firefox.js";
import fs from "fs";
import process from "process";

let overwriteExisting = process.argv.includes("--overwrite-existing");
let clearAll = process.argv.includes("--clear-all");

if (clearAll) {
  fs.readdirSync("docs/screenshots").forEach((file) => {
    fs.unlinkSync(`docs/screenshots/${file}`);
  });
  fs.readdirSync("docs/wireframes").forEach((file) => {
    fs.unlinkSync(`docs/wireframes/${file}`);
  });
}

let urls = fs.readFileSync("cloudflare-radar_top-100-domains_20241025.csv", "utf-8").split("\r\n").slice(1).map((line) => {
  let category = line?.split(",")?.[2];
  if (!category || category.includes("Content Servers") || category.includes("Advertisements")) {
    return;
  }

  let url = `https://${line.split(",")[1]}`;

  if (url in {
    "https://amazonaws.com": 1,
    "https://root-servers.net": 1,
    "https://googlevideo.com": 1,
    "https://windows.net": 1,
    "https://microsoftonline.com": 1,
    "https://windowsupdate.com": 1,
    "https://tiktokv.com": 1,
    "https://fbcdn.net": 1,
    "https://app-measurement.com": 1,
  }) {
    return;
  }

  return url;
}).filter(Boolean);

console.log(`${urls.length} domains`, urls);

(async function () {
  let options = new firefox.Options()
    // .addExtensions("/path/to/firebug.xpi")
    .setPreference("devtools.debugger.remote-enabled", true)
    .setPreference("devtools.chrome.enabled", true)
    .setPreference("devtools.debugger.prompt-connection", false)
    .setPreference("browser.history.collectWireframes", true)
    .addArguments("--width=1028")
    .addArguments("--height=768")
    .enableBidi();

  options.setBinary(
    "/Applications/Firefox Nightly.app/Contents/MacOS/firefox"
  );

  let capabilities = Capabilities.firefox();

  let driver = await new Builder()
    .withCapabilities(capabilities)
    .forBrowser(Browser.FIREFOX)
    .setFirefoxOptions(options)
    .build();
  try {
    await driver.setContext("chrome");
    let version = await driver.executeAsyncScript(function () {
      let callback = arguments[arguments.length - 1];
      callback(Services.appinfo.version);
    });
    console.log(`Firefox version ${version}`);

    for (let url of urls) {

      let filename_slug = url.replace(/^https\:\/\//, "").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      console.log(`Navigating to ${url}`);
      if (!overwriteExisting) {
        if (fs.existsSync(`docs/wireframes/${filename_slug}.wireframe.json`) && fs.existsSync(`docs/screenshots/${filename_slug}.png`)) {
          console.log(`Skipping ${url}`);
          continue;
        }
      }

      await driver.setContext("content");
      await driver.get(
        url
      );
      // Could consider waiting for requests to settle etc instead
      await new Promise(resolve => setTimeout(resolve, 2000));

      let screenshot = await driver.takeScreenshot({});
      fs.writeFileSync(`docs/screenshots/${filename_slug}.png`, screenshot, "base64");
      console.log(`   Saved screenshot`);

      await driver.setContext("chrome");
      let start = performance.now();
      let wireframe = await driver.executeAsyncScript(async () => {
        let callback = arguments[arguments.length - 1];

        const { TabStateFlusher } = ChromeUtils.importESModule(
          "resource:///modules/sessionstore/TabStateFlusher.sys.mjs"
        );
        const { PageWireframes } = ChromeUtils.importESModule(
          "resource:///modules/sessionstore/PageWireframes.sys.mjs"
        );

        async function getWireframeForTab(tab) {
          await TabStateFlusher.flush(tab.linkedBrowser);
          let wireframeElement = PageWireframes.getWireframeState(tab);
          return wireframeElement;
        }

        let wireframe = await getWireframeForTab(gBrowser.selectedTab);
        console.log(wireframe, gBrowser.selectedTab);
        callback(wireframe);
      });
      console.log(`   Collected wireframe in ${Math.round(performance.now() - start)}ms`);
      fs.writeFileSync(`docs/wireframes/${filename_slug}.wireframe.json`, JSON.stringify(wireframe, null, 2));
      console.log(`   Saved wireframe`);

    }
  } catch (e) {
    console.log("caught error", e);
  } finally {
    console.log("Complete");
    await driver.quit();
  }
})();
