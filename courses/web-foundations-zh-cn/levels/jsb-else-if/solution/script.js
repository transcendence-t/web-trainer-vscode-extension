
function seatStatus(seatsLeft) {
  if (seatsLeft === 0) {
    return '额满';
  } else if (seatsLeft <= 3) {
    return '即将满员';
  } else {
    return '可报名';
  }
}
