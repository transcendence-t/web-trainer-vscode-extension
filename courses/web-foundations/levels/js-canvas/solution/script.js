const canvas = document.querySelector('#badge');
const pen = canvas.getContext('2d');

// 读取某点的 RGBA，便于练习时验证绘制位置和清除结果。
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
