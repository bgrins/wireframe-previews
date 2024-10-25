
import allwireframes from "./allwireframes.js";
import { Upstream, BordersOnly } from "./pagewireframes.js";

console.log(allwireframes);
let select = document.getElementById("wireframe-selector");

function getActiveWireframe(wireframe) {
  let wireframeType = select.value;
  let svg;
  if (wireframeType == "upstream") {
    svg = Upstream.getWireframeElement(wireframe, document);
  } else {
    svg = BordersOnly.getWireframeElement(wireframe, document);
  }
  return svg;
}
function render() {

  for (let [filename, wireframe] of Object.entries(allwireframes)) {
    let svg = getActiveWireframe(wireframe);
    let oldSvg = document.getElementById(filename).querySelector("svg");
    if (oldSvg) {
      document.getElementById(filename).replaceChild(svg, oldSvg);
    } else {
      document.getElementById(filename).appendChild(svg);
    }
  }
}
select.addEventListener("change", render);
render();
