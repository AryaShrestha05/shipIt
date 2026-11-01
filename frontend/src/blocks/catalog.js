import original from './catalog.json';

// Presentation data for /blocks only. This does not change the builder's catalog.
export const THEMES = [
  { id: 'canvas', name: 'Canvas', tier: 'free', description: 'Your fonts. Your colors. One flexible starting point for any business.', effect: 'Choose fonts & colors → generate templates', colors: ['#f4ece1', '#2e1f14', '#b4532a'] },
  { id: 'noir', name: 'Noir', tier: 'pro', description: 'An after-dark statement with flowing light. For bars and bold portfolios.', effect: 'Aurora glow · spotlight', colors: ['#0b0b12', '#f4efff', '#aa8bfa'] },
  { id: 'bloom', name: 'Bloom', tier: 'pro', description: 'Sculptural shapes and botanical elegance. For florists, beauty and bridal.', effect: 'Floating shapes · soft depth', colors: ['#fff2f4', '#283f32', '#3e6149'] },
  { id: 'zest', name: 'Zest', tier: 'pro', description: 'Oversized type, punchy cards, real personality. For food and playful brands.', effect: 'Kinetic type · tilted cards', colors: ['#fff6ce', '#35251c', '#b8311c'] },
  { id: 'blueprint', name: 'Blueprint', tier: 'free', description: 'An architectural drawing brought to life. For architects, engineers and makers.', effect: 'Drafting grid · moving scanline', colors: ['#102d50', '#e1f1ff', '#8ad9ff'], fresh: true },
  { id: 'ripple', name: 'Ripple', tier: 'free', description: 'A moving coastal landscape with a rising sun. For retreats and outdoor escapes.', effect: 'Layered waves · sunset scene', colors: ['#f4efdf', '#214b49', '#bd572f'], fresh: true },
  { id: 'orbit', name: 'Orbit', tier: 'pro', description: 'A dimensional world of spinning rings and luminous glass. For digital studios and tech brands.', effect: '3D orbital sculpture · star field', colors: ['#0c1026', '#ececff', '#b2a1ff'], fresh: true },
  { id: 'forma', name: 'Forma', tier: 'pro', description: 'A sculptural product showroom with a floating 3D object. For interiors, products and design shops.', effect: 'Rotating 3D cube · display plinth', colors: ['#ece9e2', '#252a25', '#536547'], fresh: true },
];

export const BLOCKS = original.sections;
