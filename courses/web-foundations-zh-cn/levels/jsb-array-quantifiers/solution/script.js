function attendance(states) {
  return { any: states.some((value) => value), all: states.every((value) => value) };
}
