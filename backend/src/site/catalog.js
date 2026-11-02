// The list of building blocks people can see on the /blocks page.
// tier: 'free' for everyone, 'pro' for paying customers later. For now every
// block is usable — the tier is only shown as a badge.

const CATALOG = {
  themes: [
    { id: 'hearth', name: 'Hearth', tier: 'free', description: 'Warm cream paper and a high-contrast serif. Bakeries, cafés, restaurants.' },
    { id: 'atelier', name: 'Atelier', tier: 'free', description: 'Light, minimal and structural with tight bold type. Boutiques, salons, studios.' },
    { id: 'noir', name: 'Noir', tier: 'pro', description: 'Near-black with giant uppercase serif. Barbers, bars, portfolios.' },
    // From the /blocks gallery (frontend/src/blocks/catalog.js).
    { id: 'canvas', name: 'Canvas', tier: 'free', description: 'Your fonts. Your colors. One flexible starting point for any business.' },
    { id: 'bloom', name: 'Bloom', tier: 'pro', description: 'Sculptural shapes and botanical elegance. For florists, beauty and bridal.' },
    { id: 'zest', name: 'Zest', tier: 'pro', description: 'Oversized type, punchy cards, real personality. For food and playful brands.' },
    { id: 'blueprint', name: 'Blueprint', tier: 'free', description: 'An architectural drawing brought to life. For architects, engineers and makers.' },
    { id: 'ripple', name: 'Ripple', tier: 'free', description: 'A moving coastal landscape with a rising sun. For retreats and outdoor escapes.' },
    { id: 'orbit', name: 'Orbit', tier: 'pro', description: 'Spinning rings and luminous glass. For digital studios and tech brands.' },
    { id: 'forma', name: 'Forma', tier: 'pro', description: 'A sculptural showroom with a floating 3D object. For interiors, products and design shops.' },
  ],
  sections: [
    { id: 'hero-split', type: 'hero', name: 'Split hero', tier: 'free', description: 'Big name on the left, a tilted hours card on the right.' },
    { id: 'hero-giant', type: 'hero', name: 'Giant title', tier: 'free', description: 'The business name as large as the screen allows.' },
    { id: 'hero-centered', type: 'hero', name: 'Aurora hero', tier: 'pro', description: 'Centered title over slowly drifting color light.' },
    { id: 'marquee', type: 'marquee', name: 'Marquee', tier: 'free', description: 'Every item name scrolling past in an endless band.' },
    { id: 'highlight-ticket', type: 'highlight', name: 'Ticket strip', tier: 'free', description: 'A slim card with a live pulse dot and today’s hours.' },
    { id: 'highlight-band', type: 'highlight', name: 'Color band', tier: 'pro', description: 'A full-width band in the brand color with one bold line.' },
    { id: 'items-cards', type: 'items', name: 'Card grid', tier: 'free', description: 'Offerings as cards with a glow that follows the cursor.' },
    { id: 'items-list', type: 'items', name: 'Numbered list', tier: 'free', description: 'An editorial price list with a sweep on hover.' },
    { id: 'items-tilt', type: 'items', name: 'Sticker cards', tier: 'pro', description: 'Playful tilted cards that lean toward the cursor in 3D.' },
    { id: 'story-quote', type: 'story', name: 'Big quote', tier: 'free', description: 'One sentence about you, coming into focus word by word.' },
    { id: 'story-split', type: 'story', name: 'Split story', tier: 'free', description: 'A label on the left, a large statement on the right.' },
    { id: 'visit-card', type: 'visit', name: 'Visit card', tier: 'free', description: 'Hours and address in one framed card.' },
    { id: 'visit-columns', type: 'visit', name: 'Visit columns', tier: 'free', description: 'A huge "visit us" title beside two glowing boxes.' },
    { id: 'cta-band', type: 'cta', name: 'Closing line', tier: 'free', description: 'A last huge line whose letters rise in, then one button.' },
    { id: 'cta-split', type: 'cta', name: 'Closing card', tier: 'pro', description: 'A framed closing card with a statement and a button.' },
  ],
};

module.exports = { CATALOG: CATALOG };
