const devices = [
  { name: '测距仪', code: 'L03' },
  { name: '角度尺', code: 'R16' },
];
const template = document.querySelector('#card-template');
const cards = document.querySelector('#cards');
document.querySelector('#build').addEventListener('click', () => {
  cards.replaceChildren();
  for (const device of devices) {
    const item = template.content.cloneNode(true);
    item.querySelector('.model').textContent = device.name;
    item.querySelector('.code').textContent = device.code;
    cards.append(item);
  }
});
