export function createPlanetaryMode() {
  let engineRef = null;

  return {
    id: "planetary",

    init(engine) {
      engineRef = engine;
      engine.scale.set("linear");
    },

    update(dt) {
      // advance orbits here
    },

    render(ctx) {
      // draw sun, orbits, planets
    },

    teardown() {
      engineRef = null;
    }
  };
}
