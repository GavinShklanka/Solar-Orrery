// Universal Scale System - from Planck length to Observable Universe to Multiverse

export const SCALE_LEVELS = {
  QUANTUM: {
    id: 'quantum',
    name: 'Quantum Realm',
    size: 1e-35, // Planck length in meters
    description: 'Subatomic particles, quantum foam, wormholes',
    features: ['Quantum Tunneling', 'Wave-Particle Duality', 'Uncertainty Principle', 'Wormholes']
  },
  SUBATOMIC: {
    id: 'subatomic',
    name: 'Subatomic',
    size: 1e-15, // Femtometer
    description: 'Quarks, electrons, atomic nuclei',
    features: ['Strong Force', 'Weak Force', 'Electromagnetic Force']
  },
  ATOMIC: {
    id: 'atomic',
    name: 'Atomic',
    size: 1e-10, // Angstrom
    description: 'Atoms and molecules',
    features: ['Chemical Bonds', 'Electron Orbitals']
  },
  MOLECULAR: {
    id: 'molecular',
    name: 'Molecular',
    size: 1e-9, // Nanometer
    description: 'DNA, proteins, viruses',
    features: ['Life Building Blocks']
  },
  CELLULAR: {
    id: 'cellular',
    name: 'Cellular',
    size: 1e-5, // Micrometer
    description: 'Cells, bacteria',
    features: ['Living Organisms']
  },
  HUMAN: {
    id: 'human',
    name: 'Human Scale',
    size: 1, // Meter
    description: 'Everyday objects, people',
    features: ['Observable Reality']
  },
  PLANETARY: {
    id: 'planetary',
    name: 'Planetary',
    size: 1e7, // 10,000 km
    description: 'Planets, moons, asteroids',
    features: ['Solar Systems', 'Orbital Mechanics']
  },
  STELLAR: {
    id: 'stellar',
    name: 'Stellar',
    size: 1e9, // Million km
    description: 'Stars, star systems',
    features: ['Stellar Evolution', 'Nuclear Fusion']
  },
  GALACTIC: {
    id: 'galactic',
    name: 'Galactic',
    size: 1e21, // 100,000 light years
    description: 'Galaxies, galaxy clusters',
    features: ['Dark Matter', 'Supermassive Black Holes']
  },
  COSMIC: {
    id: 'cosmic',
    name: 'Observable Universe',
    size: 8.8e26, // 93 billion light years
    description: 'All observable matter and energy',
    features: ['Cosmic Web', 'Universe Expansion', 'Dark Energy']
  },
  MULTIVERSE: {
    id: 'multiverse',
    name: 'Multiverse (Theoretical)',
    size: Infinity,
    description: 'Infinite parallel universes',
    features: ['Many-Worlds', 'Bubble Universes', 'Higher Dimensions']
  }
};

// Convert scale level to numeric index
export function getScaleIndex(scaleId) {
  const scales = Object.values(SCALE_LEVELS);
  return scales.findIndex(s => s.id === scaleId);
}

// Get scale level from index
export function getScaleFromIndex(index) {
  const scales = Object.values(SCALE_LEVELS);
  return scales[Math.max(0, Math.min(scales.length - 1, Math.floor(index)))];
}

// Smooth interpolation between scales
export function interpolateScale(fromIndex, toIndex, t) {
  const current = fromIndex + (toIndex - fromIndex) * t;
  return getScaleFromIndex(current);
}

// Calculate zoom level for camera based on scale
export function getCameraDistance(scaleLevel) {
  const distances = {
    quantum: 0.001,
    subatomic: 0.01,
    atomic: 0.1,
    molecular: 1,
    cellular: 10,
    human: 100,
    planetary: 600,
    stellar: 400,
    galactic: 2000,
    cosmic: 3000,
    multiverse: 5000
  };
  
  return distances[scaleLevel.id] || 1000;
}

export class ScaleController {
  constructor() {
    this.currentIndex = 6; // Start at planetary
    this.targetIndex = 6;
    this.transitionSpeed = 2;
  }
  
  setScale(scaleId) {
    this.targetIndex = getScaleIndex(scaleId);
  }
  
  update(dt) {
    // Smooth transition
    if (Math.abs(this.currentIndex - this.targetIndex) > 0.01) {
      const diff = this.targetIndex - this.currentIndex;
      this.currentIndex += diff * this.transitionSpeed * dt;
    } else {
      this.currentIndex = this.targetIndex;
    }
    
    return getScaleFromIndex(this.currentIndex);
  }
  
  getCurrentScale() {
    return getScaleFromIndex(this.currentIndex);
  }
  
  zoomIn() {
    this.targetIndex = Math.max(0, this.targetIndex - 1);
  }
  
  zoomOut() {
    const maxIndex = Object.values(SCALE_LEVELS).length - 1;
    this.targetIndex = Math.min(maxIndex, this.targetIndex + 1);
  }
}