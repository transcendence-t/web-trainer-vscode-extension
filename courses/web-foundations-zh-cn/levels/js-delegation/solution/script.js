const songList = document.querySelector('#song-list');
const selectedSong = document.querySelector('#selected-song');
const addSong = document.querySelector('#add-song');
const extraSong = document.querySelector('#extra-song');

addSong.addEventListener('click', () => {
  songList.append(extraSong.content.cloneNode(true));
  addSong.disabled = true;
});

songList.addEventListener('click', (event) => {
  const song = event.target.closest('button[data-title]');
  if (song) {
    selectedSong.textContent = song.dataset.title;
  }
});
