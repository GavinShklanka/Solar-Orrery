// All distances in AU (Astronomical Units, 1 AU = Earth-Sun distance)
// All sizes in Earth radii (Earth = 1)
// Orbital periods in Earth days

export const solarSystemData = {
  sun: {
    name: "Sun",
    radius: 109, // Earth radii (actual)
    color: 0xFDB813,
    emissive: 0xFDB813,
    emissiveIntensity: 1,
    type: "star"
  },
  
  planets: [
    {
      name: "Mercury",
      radius: 0.383,
      color: 0x8C7853,
      distance: 0.39, // AU
      orbitalPeriod: 88,
      rotationPeriod: 58.6,
      axialTilt: 0.034,
      facts: [
        "Closest planet to the Sun",
        "No atmosphere",
        "Temperature: -173°C to 427°C"
      ]
    },
    {
      name: "Venus",
      radius: 0.949,
      color: 0xFFC649,
      distance: 0.72,
      orbitalPeriod: 225,
      rotationPeriod: -243, // Retrograde rotation
      axialTilt: 177.4,
      facts: [
        "Hottest planet (462°C)",
        "Thick CO2 atmosphere",
        "Rotates backwards"
      ]
    },
    {
      name: "Earth",
      radius: 1.0,
      color: 0x4A90E2,
      distance: 1.0,
      orbitalPeriod: 365.25,
      rotationPeriod: 1,
      axialTilt: 23.44,
      hasAtmosphere: true,
      hasMoon: true,
      habitableZone: true,
      facts: [
        "Only known planet with life",
        "71% water coverage",
        "Axial tilt creates seasons"
      ]
    },
    {
      name: "Mars",
      radius: 0.532,
      color: 0xCD5C5C,
      distance: 1.52,
      orbitalPeriod: 687,
      rotationPeriod: 1.03,
      axialTilt: 25.19,
      facts: [
        "The Red Planet",
        "Has polar ice caps",
        "Potential for past life"
      ]
    },
    {
      name: "Jupiter",
      radius: 11.21,
      color: 0xC88B3A,
      distance: 5.2,
      orbitalPeriod: 4333,
      rotationPeriod: 0.41,
      axialTilt: 3.13,
      facts: [
        "Largest planet",
        "Great Red Spot storm",
        "79 known moons"
      ]
    },
    {
      name: "Saturn",
      radius: 9.45,
      color: 0xFAD5A5,
      distance: 9.54,
      orbitalPeriod: 10759,
      rotationPeriod: 0.45,
      axialTilt: 26.73,
      hasRings: true,
      facts: [
        "Famous ring system",
        "Least dense planet",
        "82 known moons"
      ]
    },
    {
      name: "Uranus",
      radius: 4.01,
      color: 0x4FD0E7,
      distance: 19.19,
      orbitalPeriod: 30687,
      rotationPeriod: -0.72,
      axialTilt: 97.77, // Rotates on its side!
      facts: [
        "Rotates on its side",
        "Coldest planet (-224°C)",
        "Faint ring system"
      ]
    },
    {
      name: "Neptune",
      radius: 3.88,
      color: 0x4169E1,
      distance: 30.07,
      orbitalPeriod: 60190,
      rotationPeriod: 0.67,
      axialTilt: 28.32,
      facts: [
        "Fastest winds (2100 km/h)",
        "Farthest planet",
        "14 known moons"
      ]
    }
  ],
  
  // Habitable zone boundaries (in AU)
  habitableZone: {
    inner: 0.95,
    outer: 1.37,
    color: 0x00FF00,
    opacity: 0.15
  },
  
  // Moon data
  moon: {
    name: "Moon",
    radius: 0.273, // Earth radii
    color: 0xC0C0C0,
    distance: 0.00257, // AU from Earth
    orbitalPeriod: 27.3, // days
    facts: [
      "Stabilizes Earth's tilt",
      "Creates tides",
      "Same face always visible"
    ]
  }
};

// Visual scale factors for better viewing
// These make planets visible while showing relative differences
export const scaleConfig = {
  planetary: {
    // Scale orbital distances (compress them for viewing)
    distanceScale: 40, // Increased so planets don't orbit inside the sun!
    
    // Planet size scaling - logarithmic for visibility
    // Small planets get boosted more, large planets less
    sizeScale: 2.5, // Slightly smaller planets for better proportion
    
    // Sun is HUGE in reality, so we shrink it dramatically
    sunSizeScale: 0.08, // Even smaller sun to fit planets outside
    
    // Minimum visible size for tiny planets
    minPlanetSize: 1.2,
    
    // Maximum planet size (don't let Jupiter dominate)
    maxPlanetSize: 8
  },
  stellar: {
    distanceScale: 1,
    sizeScale: 1,
    sunSizeScale: 1
  },
  cosmic: {
    distanceScale: 0.001,
    sizeScale: 0.001,
    sunSizeScale: 0.001
  }
};

// Helper function to calculate visually pleasing planet size
export function getVisualSize(actualRadius) {
  const config = scaleConfig.planetary;
  
  // Logarithmic scaling: small differences are exaggerated, large ones compressed
  const logScale = Math.log(actualRadius + 1) * config.sizeScale;
  
  // Clamp between min and max
  return Math.max(
    config.minPlanetSize,
    Math.min(config.maxPlanetSize, logScale)
  );
}