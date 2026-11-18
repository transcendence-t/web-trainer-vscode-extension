const tour = document.querySelector('#tour');
const meeting = document.querySelector('#meeting-point');
const meetingPoints = {
  ceramics: '10:00 在陶艺馆门口集合。',
  clocks: '14:00 在钟表馆咨询台集合。',
  prints: '16:00 在版画馆大厅集合。',
};

tour.addEventListener('change', () => {
  meeting.textContent = meetingPoints[tour.value] ?? '请先选择导览场次。';
});
