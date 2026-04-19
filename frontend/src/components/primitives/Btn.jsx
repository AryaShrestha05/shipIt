import { useState } from 'react';
import { Icon } from '../Icon';

export const Btn = ({
  children, onClick, variant = 'ghost', icon, disabled,
  size = 'md', style, as, to, href, ...rest
}) => {
  const [hover, setHover] = useState(false);
  const sizes = {
    sm: { pad: '5px 10px', fs: 12, h: 26 },
    md: { pad: '7px 13px', fs: 13, h: 32 },
    lg: { pad: '10px 18px', fs: 14, h: 40 },
  }[size];
  const variants = {
    primary: {
      bg: hover ? 'oklch(0.90 0.18 165)' : 'var(--acc)',
      fg: 'oklch(0.16 0.02 165)',
      bd: 'var(--acc)',
    },
    secondary: {
      bg: hover ? 'var(--bg-3)' : 'var(--bg-2)',
      fg: 'var(--fg-0)',
      bd: 'var(--line)',
    },
    ghost: {
      bg: hover ? 'var(--bg-2)' : 'transparent',
      fg: 'var(--fg-1)',
      bd: 'var(--line-soft)',
    },
    solid: {
      bg: hover ? 'var(--bg-3)' : 'var(--bg-2)',
      fg: 'var(--fg-0)',
      bd: 'var(--line)',
    },
  }[variant];

  const commonProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: sizes.pad, height: sizes.h,
      fontSize: sizes.fs, fontFamily: 'var(--sans)', fontWeight: 500,
      color: variants.fg, background: variants.bg,
      border: `1px solid ${variants.bd}`, borderRadius: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background 120ms, transform 80ms',
      letterSpacing: '-0.005em',
      textDecoration: 'none',
      ...style,
    },
  };

  const content = (
    <>
      {icon && <Icon name={icon} size={sizes.fs + 2} />}
      {children}
    </>
  );

  if (as === 'a') {
    return <a href={href ?? to} {...commonProps} {...rest}>{content}</a>;
  }
  if (as && typeof as !== 'string') {
    const Component = as;
    return <Component to={to} {...commonProps} {...rest}>{content}</Component>;
  }
  return <button onClick={onClick} disabled={disabled} {...commonProps} {...rest}>{content}</button>;
};
