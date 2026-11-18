const canvas = document.querySelector('#badge');
const pen = canvas.getContext('2d');

// reads the RGBA of a certain point to facilitate verification of the drawing position and clearing results during practice.
function samplePixel(x, y) {
  return [...pen.getImageData(x, y, 1, 1).data];
}

// binds events to the draw and clear buttons.
