import { THEMES } from '../blocks/catalog';
import { sceneMarkup } from '../blocks/scenes';
import '../blocks/scenes.css';
import './ThemePicker.css';

// A grid of looks to choose from, using the /blocks gallery's themes and
// hero artwork. Used on the landing page and as step 2 of /try.
// props: value (picked theme id), onPick(themeId)
export default function ThemePicker(props) {
  return (
    <div className="tp-grid" role="radiogroup" aria-label="Pick a look">
      {THEMES.map(function (theme) {
        const picked = theme.id === props.value;
        return (
          <button
            key={theme.id}
            className={'tp-card' + (picked ? ' is-picked' : '')}
            role="radio"
            aria-checked={picked}
            onClick={function () { props.onPick(theme.id); }}
          >
            <ThemeArt theme={theme} />
            <span className="tp-name">
              {theme.name}
              <span className={'tp-tier tp-' + theme.tier}>{theme.tier}</span>
            </span>
            <span className="tp-desc">{theme.id === 'canvas' ? 'Your own colors, read from your photo. A clean start for any business.' : theme.description}</span>
            <span className="tp-dots" aria-hidden="true">
              {theme.colors.map(function (color) {
                return <i key={color} style={{ background: color }} />;
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// The tile art: the theme's animated scene if it has one, otherwise its
// colors with a big "Aa".
function ThemeArt(props) {
  const theme = props.theme;
  const markup = sceneMarkup(theme.id);
  if (markup) {
    // The scene is fixed decorative markup from scenes.js, never user input.
    return <span className="tp-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />;
  }
  const words = { noir: 'Aa.', zest: 'HEY!', bloom: 'Bloom', canvas: 'Aa' };
  return (
    <span className="tp-art tp-art-type" aria-hidden="true" style={{ background: theme.colors[0], color: theme.colors[2] }}>
      {words[theme.id] || 'Aa'}
    </span>
  );
}
