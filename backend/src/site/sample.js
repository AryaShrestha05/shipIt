// Made-up businesses used by tests and the /dev page, shaped exactly like
// what the photo reader (Feature 5) will produce.

const SAMPLE_BUSINESS = {
  name: "Rosie's Bakery",
  tagline: 'Bread and pastries, baked at dawn by the same family since 1987.',
  vibe: 'warm',
  palette: { bg: '#f4ece1', ink: '#2e1f14', accent: '#b4532a' },
  items: [
    { name: 'Butter Croissant', price: '$4', note: 'Laminated over three days' },
    { name: 'Country Sourdough', price: '$9', note: 'Wild yeast, 36-hour ferment' },
    { name: 'Cardamom Bun', price: '$5', note: 'Swedish-style, pearl sugar' },
    { name: 'Pain au Chocolat', price: '$5', note: 'Two bars of dark chocolate' },
    { name: 'Seasonal Galette', price: '$7', note: 'Whatever the market gave us' },
    { name: 'Brown Butter Cookie', price: '$3', note: 'Flaky salt on top' },
  ],
  hours: 'Tue–Sun · 7am – 3pm',
  address: '214 Main Street, Poughkeepsie, NY',
  copy: {
    heroEyebrow: 'Fresh every morning',
    heroCta: "See today's bakes",
    ctaLabel: 'Order ahead',
    itemsNav: 'Menu',
    itemsEyebrow: 'The counter',
    itemsTitle: "What we're baking",
    itemsSub: 'Made in the morning. Gone by the afternoon.',
    highlightLabel: 'Out of the oven',
    highlightNote: 'Come early — the croissants go first.',
    quote: 'We start before sunrise so the whole street smells like butter by seven.',
    visitTitle: 'Visit the bakery',
    closingTitle: 'Come hungry.',
    footerNote: "Baked by hand, sold until it's gone.",
  },
};

const SAMPLE_SALON = {
  name: 'Studio Nova',
  tagline: 'Color, cuts and care in a calm, light-filled space.',
  vibe: 'minimal',
  palette: { bg: '#eef0ee', ink: '#1d2421', accent: '#5f7a6a' },
  items: [
    { name: 'Signature Cut', price: '$65', note: 'Consultation, wash and style' },
    { name: 'Balayage', price: '$180', note: 'Hand-painted, natural grow-out' },
    { name: 'Gloss Treatment', price: '$45', note: 'Shine and tone refresh' },
    { name: 'Blowout', price: '$40', note: 'Smooth, bouncy, lasts days' },
  ],
  hours: 'Wed–Sun · 10am – 7pm',
  address: '88 Raymond Ave, Poughkeepsie, NY',
  copy: {
    heroEyebrow: 'By appointment',
    heroCta: 'See services',
    ctaLabel: 'Book a visit',
    itemsNav: 'Services',
    itemsEyebrow: 'The chair',
    itemsTitle: 'Our services',
    itemsSub: 'Every appointment starts with a conversation.',
    highlightLabel: 'Now booking',
    highlightNote: 'Weekend spots fill up fast — book early.',
    quote: 'Great hair should feel like you, just more rested.',
    visitTitle: 'Visit the studio',
    closingTitle: 'Your chair is waiting.',
    footerNote: 'Thank you for trusting us with your hair.',
  },
};

module.exports = {
  SAMPLE_BUSINESS: SAMPLE_BUSINESS,
  SAMPLE_SALON: SAMPLE_SALON,
};
