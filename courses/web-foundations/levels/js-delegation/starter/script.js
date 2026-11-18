const songList = document.querySelector('#song-list');
const selectedSong = document.querySelector('#selected-song');
const addSong = document.querySelector('#add-song');
const extraSong = document.querySelector('#extra-song');

addSong.addEventListener('click', () => {
  songList.append(extraSong.content.cloneNode(true));
  addSong.disabled = true;
});

// has added new tracks above. Next let the list handle track button clicks.
