
import fs from "fs";

let files = fs.readdirSync("docs/wireframes");
let wireframes = {};
let imports = [];
let exports = [];
for (let file of files) {
  if (!file.endsWith(".wireframe.json")) {
    continue;
  }

  let filename_slug = file.replace(/\.wireframe\.json$/, "");
  exports.push(`  ${filename_slug},`);
  imports.push(`import ${filename_slug} from "./wireframes/${file}";`);

  wireframes[filename_slug] = JSON.parse(fs.readFileSync(`docs/wireframes/${file}`, "utf-8"));
}


let previewHTML = "";
for (let [filename, wireframe] of Object.entries(wireframes)) {
  previewHTML += `
  <h2 id="${filename}_link">${filename.replaceAll("_", ".")} <a href="#${filename}_link">#</a></h2>
  <div class="preview" id="${filename}">
    <img src="screenshots/tn_${filename}.avif" alt="${filename}">
  </div>`;
}

fs.writeFileSync("docs/allwireframes.js", `export default ${JSON.stringify(wireframes, null, 2)};`);

let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wireframe Preview</title>
  <script type="module" src="main.js"></script>
  <link rel="stylesheet" href="styles.css">
  </head>
  <body>
  <header>
    <h1>Wireframe Preview</h1>
    <select id="wireframe-selector">
      <option value="upstream">Default style</option>
      <option value="borders-only">Borders Only</option>
    </select>
  </header>
  ${previewHTML}
  </body>
</html>
`;

fs.writeFileSync("docs/index.html", html);
