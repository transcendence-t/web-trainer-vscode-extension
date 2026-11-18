function askDesk(isAvailable) {
  if (isAvailable) return Promise.resolve('window 2');
  return Promise.reject(new Error('No service window is available right now'));
}

// Bind asynchronous operations to buttons.
