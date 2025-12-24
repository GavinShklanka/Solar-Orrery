export function createTime() {
  let speed = 1;
  let paused = false;

  return {
    update(dt) {
      return paused ? 0 : dt * speed;
    },
    setSpeed(value) {
      speed = value;
    },
    pause() {
      paused = true;
    },
    play() {
      paused = false;
    }
  };
}
