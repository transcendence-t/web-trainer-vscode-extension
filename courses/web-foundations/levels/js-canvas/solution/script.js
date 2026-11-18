const canvas = document.querySelector('#badge');
const pen = canvas.getContext('2d');

// reads the RGBA of a certain point to facilitate verification of the drawing position and clearing results during practice.
function samplePixel(x, y) {
  return [...pen.getImageData(x, y, 1, 1).data];
}

document.querySelector('#draw').addEventListener('click', () => {
  pen.fillStyle = '#125a46';
  pen.fillRect(16, 12, 32, 24);
});
document.querySelector('#clear').addEventListener('click', () => {
  pen.clearRect(0, 0, canvas.width, canvas.height);
});
