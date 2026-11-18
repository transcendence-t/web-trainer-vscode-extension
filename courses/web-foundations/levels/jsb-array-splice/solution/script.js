function swapDevice(devices, index, replacement) {
  if (index >= 0 && index < devices.length) devices.splice(index, 1, replacement);
  return devices;
}
