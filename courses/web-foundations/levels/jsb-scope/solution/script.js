
function pageLabels(title, preview) {
  let label = '归档-' + title;
  let banner = label;
  if (preview) {
    const label = '预览-' + title;
    banner = label;
  }
  return banner + ' / ' + label;
}
