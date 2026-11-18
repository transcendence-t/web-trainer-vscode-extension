const fixtures = {
  main: { notices: [
    { title: 'collection experience', room: 'Photography Studio' },
    { title: '<Review> Purchase List', room: 'Equipment Library' },
  ] },
  empty: { notices: [] },
};

function localUrl(kind) {
  if (kind === 'error') return 'data:application/json,%7B';
  return 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fixtures[kind]));
}

function simulateWait() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

// Write the loading and retry logic of the page.
