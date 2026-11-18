
function pageLabels(title, preview) {
  let label = '归档-' + title;
  let banner = label;
  if (preview) {
    // 在块内声明临时标签，再将它赋给 banner。
  }
  return banner + ' / ' + label;
}
