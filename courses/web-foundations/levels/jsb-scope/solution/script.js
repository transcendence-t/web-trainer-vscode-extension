
function pageLabels(title, preview) {
  let label = 'Archive-' + title;
  let banner = label;
  if (preview) {
    const label = 'Preview-' + title;
    banner = label;
  }
  return banner + ' / ' + label;
}
