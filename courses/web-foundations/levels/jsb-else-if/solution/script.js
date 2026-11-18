
function seatStatus(seatsLeft) {
  if (seatsLeft === 0) {
    return 'is full';
  } else if (seatsLeft <= 3) {
    return 'is almost full';
  } else {
    return 'can be registered';
  }
}
