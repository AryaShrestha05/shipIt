// A made-up bakery used by tests and the /dev page, shaped exactly like what
// the photo reader (Feature 5) will produce.
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
};

module.exports = { SAMPLE_BUSINESS: SAMPLE_BUSINESS };
