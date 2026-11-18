const stamp = document.querySelector('.dispatch-stamp');
const play = document.querySelector('#play-stamp');

play.addEventListener('click', () => {
  const [animation] = stamp.getAnimations();
  if (!animation) return;
  animation.currentTime = 0;
  animation.play();
});
