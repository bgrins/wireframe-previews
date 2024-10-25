
const SVG_NS = "http://www.w3.org/2000/svg";
/**
* Converts a color encoded as a uint32_t (Gecko's nscolor format)
* to an rgb string.
*
* @param {Number} nscolor
*   An RGB color encoded in nscolor format.
* @return {String}
*   A string of the form "rgb(r, g, b)".
*/
function nscolorToRGB(nscolor) {
  let r = nscolor & 0xff;
  let g = (nscolor >> 8) & 0xff;
  let b = (nscolor >> 16) & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}

function getSVG(wireframe) {
  let svg = document.createElementNS(SVG_NS, "svg");

  // 1028x683?

  // Currently guessing width & height from rects on the object, it would be better to
  // save these on the wireframe object itself.
  let width = wireframe.rects.reduce(
    (max, rect) => Math.max(max, rect.x + rect.width),
    0
  );
  let height = wireframe.rects.reduce(
    (max, rect) => Math.max(max, rect.y + rect.height),
    0
  );
  svg.setAttributeNS(null, "viewBox", `0 0 ${width} ${height}`);
  svg.style.backgroundColor = nscolorToRGB(wireframe.canvasBackground);
  return svg;
}

export const BordersOnly =  {
  getWireframeElement(wireframe) {
    let svg = getSVG(wireframe);
    const DEFAULT_FILL = "color-mix(in srgb, gray 20%, transparent)";
    svg.style.backgroundColor = nscolorToRGB(wireframe.canvasBackground);

    for (let rectObj of wireframe.rects) {
      // For now we'll skip rects that have an unknown classification, since
      // it's not clear how we should treat them.
      if (rectObj.type == "unknown") {
        continue;
      }

      let rectEl = document.createElementNS(SVG_NS, "rect");
      rectEl.setAttribute("x", rectObj.x);
      rectEl.setAttribute("y", rectObj.y);
      rectEl.setAttribute("width", rectObj.width);
      rectEl.setAttribute("height", rectObj.height);

      let stroke;
      switch (rectObj.type) {
        case "background": {
          stroke = nscolorToRGB(rectObj.color);
          break;
        }
        case "image": {
          stroke = rectObj.color
            ? nscolorToRGB(rectObj.color)
            : DEFAULT_FILL;
          break;
        }
        case "text": {
          stroke = DEFAULT_FILL;
          break;
        }
      }

      rectEl.setAttribute("fill", "transparent");
      rectEl.setAttribute("stroke", stroke);
      rectEl.setAttribute("stroke-width", 2);

      svg.appendChild(rectEl);
    }
    return svg;
  }
}


export const Upstream =  {

  nscolorToRGB(nscolor) {
    let r = nscolor & 0xff;
    let g = (nscolor >> 8) & 0xff;
    let b = (nscolor >> 16) & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
  },
  /**
   * Converts a color encoded as a uint32_t (Gecko's nscolor format)
   * to an rgb string.
   *
   * @param {Object} wireframe
   *   See Bug 1731714 and dom/webidl/Document.webidl for the Wireframe dictionary
   * @param {Document} document
   *   A Document to crate SVG elements.
   * @return {SVGElement}
   *   The rendered wireframe
   */
  getWireframeElement(wireframe, document) {
    const SVG_NS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(SVG_NS, "svg");

    // Currently guessing width & height from rects on the object, it would be better to
    // save these on the wireframe object itself.
    let width = wireframe.rects.reduce(
      (max, rect) => Math.max(max, rect.x + rect.width),
      0
    );
    let height = wireframe.rects.reduce(
      (max, rect) => Math.max(max, rect.y + rect.height),
      0
    );

    svg.setAttributeNS(null, "viewBox", `0 0 ${width} ${height}`);
    svg.style.backgroundColor = this.nscolorToRGB(wireframe.canvasBackground);

    const DEFAULT_FILL = "color-mix(in srgb, gray 20%, transparent)";

    for (let rectObj of wireframe.rects) {
      // For now we'll skip rects that have an unknown classification, since
      // it's not clear how we should treat them.
      if (rectObj.type == "unknown") {
        continue;
      }

      let rectEl = document.createElementNS(SVG_NS, "rect");
      rectEl.setAttribute("x", rectObj.x);
      rectEl.setAttribute("y", rectObj.y);
      rectEl.setAttribute("width", rectObj.width);
      rectEl.setAttribute("height", rectObj.height);

      let fill;
      switch (rectObj.type) {
        case "background": {
          fill = this.nscolorToRGB(rectObj.color);
          break;
        }
        case "image": {
          fill = rectObj.color
            ? this.nscolorToRGB(rectObj.color)
            : DEFAULT_FILL;
          break;
        }
        case "text": {
          fill = DEFAULT_FILL;
          break;
        }
      }

      rectEl.setAttribute("fill", fill);

      svg.appendChild(rectEl);
    }
    return svg;
  },
};
