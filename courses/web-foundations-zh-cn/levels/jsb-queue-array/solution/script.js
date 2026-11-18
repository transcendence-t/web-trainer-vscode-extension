function rotateLast(queue) {
  if (queue.length) queue.unshift(queue.pop());
  return queue;
}
