import { Link, useLocation } from 'react-router-dom';
import './SiteNav.css';

// The one navbar every page uses: brand · (page title) · Blocks · extras · Light/Dark · Get started.
//
// props.colorMode  → from useColorMode(): { mode, toggle }
// props.title      → optional text in the middle (e.g. the business name on /try)
// props.overlay    → true on the landing hero: white text over the photo
// props.children   → extra buttons for this page, shown before Light/Dark
export default function SiteNav(props) {
  const location = useLocation();
  const onTry = location.pathname.indexOf('/try') === 0;
  const onBlocks = location.pathname.indexOf('/blocks') === 0;
  const mode = props.colorMode.mode;

  return (
    <nav className={'nav' + (props.overlay ? ' is-overlay' : '')}>
      <div className="nav-inner">
        <Link to="/" className="nav-brand">shipit.</Link>
        {props.title ? <span className="nav-title">{props.title}</span> : <span className="nav-title" />}
        <span className="nav-right">
          <Link to="/blocks" className={'nav-link' + (onBlocks ? ' is-current' : '')}>Blocks</Link>
          {props.children}
          <button className="nav-link" onClick={props.colorMode.toggle} aria-label={'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' mode'}>
            {mode === 'dark' ? 'Light' : 'Dark'}
          </button>
          {onTry ? null : <Link to="/try" className="nav-cta">Get started</Link>}
        </span>
      </div>
    </nav>
  );
}
