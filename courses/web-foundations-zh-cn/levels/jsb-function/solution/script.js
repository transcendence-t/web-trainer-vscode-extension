
function drinkVolume(cups, mlPerCup) {
  return cups * mlPerCup;
}

function prepareVolume(cups, mlPerCup, spareMl) {
  const servingVolume = drinkVolume(cups, mlPerCup);
  return servingVolume + spareMl;
}
