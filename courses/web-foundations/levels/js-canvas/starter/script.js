const canvas = document.querySelector('#badge');
const pen = canvas.getContext('2d');

// 读取某点的 RGBA，便于练习时验证绘制位置和清除结果。
function samplePixel(x, y) {
  return [...pen.getImageData(x, y, 1, 1).data];
}

// 给绘制与清除按钮绑定事件。
