export const Icon = ({ name, size = 16, style }) => {
  const s = { width: size, height: size, display: 'block', ...style };
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'plan':   return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="8" {...p}/><path d="M12 4v4M12 16v4M4 12h4M16 12h4" {...p}/></svg>;
    case 'code':   return <svg viewBox="0 0 24 24" style={s}><path d="M8 6l-6 6 6 6M16 6l6 6-6 6M14 4l-4 16" {...p}/></svg>;
    case 'verify': return <svg viewBox="0 0 24 24" style={s}><path d="M4 12l4 4 12-12" {...p}/><path d="M4 20h16" {...p}/></svg>;
    case 'critic': return <svg viewBox="0 0 24 24" style={s}><circle cx="11" cy="11" r="6" {...p}/><path d="M15.5 15.5L21 21" {...p}/></svg>;
    case 'ship':   return <svg viewBox="0 0 24 24" style={s}><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" {...p}/><path d="M9 12l2 2 4-4" {...p}/></svg>;
    case 'git':    return <svg viewBox="0 0 24 24" style={s}><circle cx="6" cy="6" r="2" {...p}/><circle cx="6" cy="18" r="2" {...p}/><circle cx="18" cy="14" r="2" {...p}/><path d="M6 8v8M6 14c0-4 5-4 10-4" {...p}/></svg>;
    case 'pr':     return <svg viewBox="0 0 24 24" style={s}><circle cx="6" cy="6" r="2" {...p}/><circle cx="6" cy="18" r="2" {...p}/><circle cx="18" cy="18" r="2" {...p}/><path d="M6 8v8M18 6v10" {...p}/><path d="M13 3h3a2 2 0 012 2v1" {...p}/><path d="M16 2l-3 1 3 1" {...p}/></svg>;
    case 'play':   return <svg viewBox="0 0 24 24" style={s}><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>;
    case 'pause':  return <svg viewBox="0 0 24 24" style={s}><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>;
    case 'reset':  return <svg viewBox="0 0 24 24" style={s}><path d="M4 4v6h6" {...p}/><path d="M20 12a8 8 0 11-3-6.2L20 8" {...p}/></svg>;
    case 'spark':  return <svg viewBox="0 0 24 24" style={s}><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" {...p}/></svg>;
    case 'clock':  return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="8" {...p}/><path d="M12 8v4l3 2" {...p}/></svg>;
    case 'check':  return <svg viewBox="0 0 24 24" style={s}><path d="M4 12l5 5L20 6" {...p}/></svg>;
    case 'x':      return <svg viewBox="0 0 24 24" style={s}><path d="M6 6l12 12M18 6L6 18" {...p}/></svg>;
    case 'chevron':return <svg viewBox="0 0 24 24" style={s}><path d="M9 6l6 6-6 6" {...p}/></svg>;
    case 'arrow':  return <svg viewBox="0 0 24 24" style={s}><path d="M5 12h14M13 6l6 6-6 6" {...p}/></svg>;
    case 'dot':    return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
    case 'file':   return <svg viewBox="0 0 24 24" style={s}><path d="M6 3h9l4 4v14H6z" {...p}/><path d="M15 3v4h4" {...p}/></svg>;
    case 'folder': return <svg viewBox="0 0 24 24" style={s}><path d="M3 7l3-3h5l2 3h8v13H3z" {...p}/></svg>;
    case 'bolt':   return <svg viewBox="0 0 24 24" style={s}><path d="M13 2L4 14h6l-2 8 10-14h-6l1-6z" {...p}/></svg>;
    case 'sliders':return <svg viewBox="0 0 24 24" style={s}><path d="M4 6h16M4 12h16M4 18h16" {...p}/><circle cx="9" cy="6" r="2" fill="var(--bg-1)" {...p}/><circle cx="16" cy="12" r="2" fill="var(--bg-1)" {...p}/><circle cx="7" cy="18" r="2" fill="var(--bg-1)" {...p}/></svg>;
    default: return null;
  }
};
