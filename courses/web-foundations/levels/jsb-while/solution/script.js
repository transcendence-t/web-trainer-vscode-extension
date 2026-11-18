
function archiveDays(initial, target) {
  let archived = initial;
  let days = 0;
  while (archived < target) {
    archived += 3;
    days += 1;
  }
  return days;
}
