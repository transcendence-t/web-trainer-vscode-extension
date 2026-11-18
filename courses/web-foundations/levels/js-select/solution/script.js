const tour = document.querySelector('#tour');
const meeting = document.querySelector('#meeting-point');
const meetingPoints = {
  ceramics: '10:00 Meet at the entrance of the Ceramic Art Museum.',
  clocks: '14:00 Meet at the information desk of the Clock Museum.',
  prints: '16:00 Gather in the lobby of the Printmaking Gallery.',
};

tour.addEventListener('change', () => {
  meeting.textContent = meetingPoints[tour.value] ?? 'Please select the tour session first.';
});
