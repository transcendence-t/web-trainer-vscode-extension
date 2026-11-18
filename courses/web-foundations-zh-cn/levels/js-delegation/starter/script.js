const songList = document.querySelector('#song-list');
const selectedSong = document.querySelector('#selected-song');
const addSong = document.querySelector('#add-song');
const extraSong = document.querySelector('#extra-song');

addSong.addEventListener('click', () => {
  songList.append(extraSong.content.cloneNode(true));
  addSong.disabled = true;
});

// 上面已经实现新增曲目。接下来让列表处理曲目按钮的点击。
