function fillCrate(volumes, limit) {
  let total = 0;
  for (const volume of volumes) {
    if (volume < 0) continue;
    if (total + volume > limit) break;
    total += volume;
  }
  return total;
}
