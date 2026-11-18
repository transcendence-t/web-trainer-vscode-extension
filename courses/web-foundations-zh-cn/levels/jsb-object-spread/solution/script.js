function checkSettings(defaults, overrides) {
  const merged = mergeSettings(defaults, overrides);
  return { defaults, merged };
}

function mergeSettings(defaults, overrides) {
  return { ...defaults, ...overrides };
}
