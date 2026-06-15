/* @ds-bundle: {"format":3,"namespace":"BARSEngineDesignSystem_af69ba","components":[{"name":"CultivationCard","sourcePath":"components/cards/CultivationCard.jsx"},{"name":"CardArtWindow","sourcePath":"components/cards/CultivationCard.jsx"},{"name":"CardWell","sourcePath":"components/cards/CultivationCard.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ChromeLabel","sourcePath":"components/core/ChromeLabel.jsx"},{"name":"ElementSigil","sourcePath":"components/core/ElementSigil.jsx"},{"name":"MoveIcon","sourcePath":"components/core/MoveIcon.jsx"},{"name":"VibulonStat","sourcePath":"components/core/VibulonStat.jsx"}],"sourceHashes":{"components/cards/CultivationCard.jsx":"19ebd09cbd7a","components/core/Badge.jsx":"92e53f2289d0","components/core/Button.jsx":"758fe8afed79","components/core/ChromeLabel.jsx":"6616eff794ad","components/core/ElementSigil.jsx":"4e28d86ffbc5","components/core/MoveIcon.jsx":"2055f6a58b39","components/core/VibulonStat.jsx":"3a5396497a71","ui_kits/bars-engine/app.jsx":"3101589f5190"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BARSEngineDesignSystem_af69ba = window.BARSEngineDesignSystem_af69ba || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/CultivationCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * CultivationCard — THE BARS Engine card primitive.
 *
 * Three-channel visual encoding:
 *   • element  → color   (frame border, glow, gem, gradient)   data-element
 *   • altitude → border/glow intensity (dissatisfied/neutral/satisfied)  data-altitude
 *   • stage    → density (seed/growing/composted) — drives art window height
 *
 * All game aesthetic lives in CSS (.bars-card and friends from tokens/cards.css).
 * Children pass straight through into the content layer. Compose interior with
 * the helper subcomponents below, or hand-roll your own.
 */

const STAGE = {
  seed: {
    artHeight: '32%',
    artOpacity: 1,
    composted: false
  },
  growing: {
    artHeight: '52%',
    artOpacity: 1,
    composted: false
  },
  composted: {
    artHeight: '30%',
    artOpacity: 0.2,
    composted: true
  }
};
function CultivationCard({
  element = 'earth',
  altitude = 'neutral',
  stage = 'growing',
  interactive = false,
  selected = false,
  disabled = false,
  loading = false,
  ritual = false,
  animated = false,
  floating = false,
  className = '',
  style,
  children,
  ...rest
}) {
  const classes = ['bars-card', interactive && 'bars-card--interactive', selected && 'bars-card--selected', disabled && 'bars-card--disabled', loading && 'bars-card--loading', ritual && 'bars-card--ritual', stage === 'composted' && 'bars-card--composted', animated && 'bars-card-enter', floating && 'bars-card-float', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-element": element,
    "data-altitude": altitude,
    "data-stage": stage,
    className: classes,
    tabIndex: interactive && !disabled ? 0 : undefined,
    role: interactive ? 'button' : undefined,
    style: style
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "bars-card__gradient",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bars-card__glow",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bars-card__body"
  }, children));
}

/** Art window — square pixel-art crop framed by the element border. Height follows stage. */
function CardArtWindow({
  src,
  alt = '',
  stage = 'growing',
  height,
  style,
  children,
  ...rest
}) {
  const h = height || (STAGE[stage] || STAGE.growing).artHeight;
  const op = (STAGE[stage] || STAGE.growing).artOpacity;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "bars-art-window",
    style: {
      height: h,
      borderTopLeftRadius: 'var(--bars-radius-lg)',
      borderTopRightRadius: 'var(--bars-radius-lg)',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      opacity: op
    }
  }) : children);
}

/** Inset description well — the recessed text panel inside a card. */
function CardWell({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--bars-surface-inset)',
      borderRadius: 'var(--bars-radius-md)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
      padding: 'var(--bars-space-3)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { CultivationCard, CardArtWindow, CardWell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/CultivationCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — small status / taxonomy marker.
 *
 * Variants:
 *   • element  → element-tinted chip (frame outline + gem text). Binds [data-element].
 *   • altitude → the alchemy state (dissatisfied / neutral / satisfied) with a gem dot.
 *   • solid    → filled liminal accent (counts, "new").
 *   • muted    → quiet neutral chip.
 *
 * Mono uppercase label; small and dense by default.
 */
function Badge({
  children,
  variant = 'muted',
  element,
  altitude,
  style,
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 9px',
    borderRadius: 'var(--bars-radius-full)',
    fontFamily: 'var(--bars-font-mono)',
    fontSize: 'var(--bars-text-2xs)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--bars-tracking-wide)',
    lineHeight: 1.4,
    whiteSpace: 'nowrap'
  };
  const altMap = {
    dissatisfied: {
      label: 'Dissatisfied',
      opacity: 0.3
    },
    neutral: {
      label: 'Neutral',
      opacity: 0.7
    },
    satisfied: {
      label: 'Satisfied',
      opacity: 1
    }
  };
  const variants = {
    element: {
      background: 'color-mix(in srgb, var(--bars-element-frame) 16%, transparent)',
      color: 'var(--bars-element-gem)',
      boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bars-element-frame) 60%, transparent)'
    },
    altitude: {
      background: 'var(--bars-surface-inset)',
      color: 'var(--bars-text-secondary)',
      boxShadow: 'inset 0 0 0 1px var(--bars-line)'
    },
    solid: {
      background: 'var(--bars-liminal)',
      color: '#fff',
      boxShadow: 'var(--bars-shadow-inset-top)'
    },
    muted: {
      background: 'var(--bars-surface-inset)',
      color: 'var(--bars-text-muted)',
      boxShadow: 'inset 0 0 0 1px var(--bars-line)'
    }
  };
  const elementAttr = element ? {
    'data-element': element
  } : {};
  const isAlt = variant === 'altitude' && altitude;
  const altInfo = isAlt ? altMap[altitude] : null;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, elementAttr, rest), isAlt && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: 'var(--bars-element-gem)',
      opacity: altInfo.opacity,
      boxShadow: altitude === 'satisfied' ? '0 0 6px 1px var(--bars-element-glow)' : 'none',
      flexShrink: 0
    }
  }), children ?? (isAlt ? altInfo.label : null));
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — BARS Engine action primitive.
 *
 * Three intents map to the covenant's color law:
 *   • primary   → liminal purple (#7c3aed). Purple is RESERVED for action — never an element.
 *   • secondary → element-framed outline (inherits the surrounding [data-element], default earth).
 *   • ghost     → quiet text button on dark chrome.
 *
 * Press shrinks (scale .97); hover lifts the glow. Labels in display sans, tight tracking.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  element,
  disabled = false,
  sigil,
  fullWidth = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '6px 12px',
      fontSize: 'var(--bars-text-xs)',
      radius: 'var(--bars-radius-md)'
    },
    md: {
      padding: '10px 18px',
      fontSize: 'var(--bars-text-sm)',
      radius: 'var(--bars-radius-md)'
    },
    lg: {
      padding: '14px 26px',
      fontSize: 'var(--bars-text-base)',
      radius: 'var(--bars-radius-lg)'
    }
  };
  const s = sizes[size] || sizes.md;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : undefined,
    padding: s.padding,
    fontSize: s.fontSize,
    borderRadius: s.radius,
    fontFamily: 'var(--bars-font-display)',
    fontWeight: 'var(--bars-weight-semibold)',
    letterSpacing: 'var(--bars-tracking-tight)',
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    border: 'none',
    transition: 'transform var(--bars-dur-fast) var(--bars-ease-out), box-shadow var(--bars-dur-base) ease-out, background-color var(--bars-dur-base) ease-out',
    pointerEvents: disabled ? 'none' : undefined,
    WebkitTapHighlightColor: 'transparent'
  };
  const variants = {
    primary: {
      background: 'var(--bars-liminal)',
      color: '#fff',
      boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 60%, #000), 0 0 0px 0 var(--bars-liminal-glow)'
    },
    secondary: {
      background: 'color-mix(in srgb, var(--bars-element-frame) 12%, transparent)',
      color: 'var(--bars-text-primary)',
      boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-element-frame) 80%, transparent)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--bars-text-secondary)',
      boxShadow: 'inset 0 0 0 1px var(--bars-line)'
    }
  };
  const onDown = e => {
    if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
  };
  const onUp = e => {
    e.currentTarget.style.transform = 'scale(1)';
  };
  const onEnter = e => {
    if (disabled) return;
    if (variant === 'primary') e.currentTarget.style.boxShadow = 'var(--bars-shadow-inset-top), 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 60%, #000), 0 0 16px 1px color-mix(in srgb, var(--bars-liminal-glow) 55%, transparent)';else if (variant === 'secondary') e.currentTarget.style.boxShadow = 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px var(--bars-element-frame), 0 0 14px 0 color-mix(in srgb, var(--bars-element-glow) 35%, transparent)';else e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
  };
  const onLeave = e => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = variants[variant].boxShadow;
    if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
  };
  const elementAttr = element ? {
    'data-element': element
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseDown: onDown,
    onMouseUp: onUp,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, elementAttr, rest), sigil && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.15em',
      lineHeight: 1,
      opacity: 0.9
    }
  }, sigil), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/ChromeLabel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ChromeLabel — the signature BARS micro-label.
 * Mono, UPPERCASE, letter-spaced wide, small. Used everywhere as the OS chrome
 * voice: "VIBULON", "FIELD ACTIVE", nation names, section eyebrows.
 *
 * Optionally tints to an element or to the liminal/active accent.
 */
function ChromeLabel({
  children,
  tone = 'muted',
  element,
  dot = false,
  style,
  ...rest
}) {
  const toneColor = {
    muted: 'var(--bars-text-muted)',
    secondary: 'var(--bars-text-secondary)',
    element: 'var(--bars-element-gem)',
    liminal: 'var(--bars-liminal-glow)'
  }[tone] || 'var(--bars-text-muted)';
  const elementAttr = element ? {
    'data-element': element
  } : {};
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--bars-font-mono)',
      fontSize: 'var(--bars-text-2xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--bars-tracking-widest)',
      color: toneColor,
      lineHeight: 1,
      ...style
    }
  }, elementAttr, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      background: 'var(--bars-element-gem)',
      boxShadow: '0 0 6px 1px var(--bars-element-glow)',
      flexShrink: 0
    }
  }), children);
}
Object.assign(__ds_scope, { ChromeLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ChromeLabel.jsx", error: String((e && e.message) || e) }); }

// components/core/ElementSigil.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIGILS = {
  fire: '火',
  water: '水',
  wood: '木',
  metal: '金',
  earth: '土'
};
const NATION = {
  fire: 'Pyrakanth',
  water: 'Lamenth',
  wood: 'Virelune',
  metal: 'Argyra',
  earth: 'Meridia'
};

/**
 * ElementSigil — a Wuxing sigil (火水木金土) rendered in its element color,
 * optionally inside a glowing gem disc. The canonical identity mark for the
 * five nations. Use bare for inline accents, or `framed` for a node/badge.
 */
function ElementSigil({
  element = 'earth',
  size = 'md',
  framed = false,
  glow = true,
  style,
  ...rest
}) {
  const px = {
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64
  }[size] || 24;
  const sigil = SIGILS[element] || '◇';
  const glyph = /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-body)',
      fontSize: framed ? px * 0.5 : px,
      lineHeight: 1,
      color: 'var(--bars-element-gem)',
      textShadow: glow ? '0 0 10px color-mix(in srgb, var(--bars-element-glow) 55%, transparent)' : 'none',
      userSelect: 'none'
    }
  }, sigil);
  if (!framed) {
    return /*#__PURE__*/React.createElement("span", _extends({
      "data-element": element,
      title: NATION[element],
      style: {
        display: 'inline-flex',
        ...style
      }
    }, rest), glyph);
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    "data-element": element,
    title: NATION[element],
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: px,
      height: px,
      borderRadius: '50%',
      background: 'color-mix(in srgb, var(--bars-element-frame) 18%, var(--bars-surface-inset))',
      boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-element-frame) 70%, transparent)' + (glow ? ', 0 0 12px 0 color-mix(in srgb, var(--bars-element-glow) 35%, transparent)' : ''),
      flexShrink: 0,
      ...style
    }
  }, rest), glyph);
}
Object.assign(__ds_scope, { ElementSigil });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ElementSigil.jsx", error: String((e && e.message) || e) }); }

// components/core/MoveIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * MoveIcon — the four personal-throughput moves (Register 5 / Frame-Chrome).
 * Wake Up · Clean Up · Grow Up · Show Up. The source ships these as 24×24
 * monochrome line PNGs; they are embedded here as data URIs so the component
 * is fully portable. White line art by default — tint with `color` (applied
 * as a mask) or leave white for chrome.
 */
const MOVE_SRC = {
  'wake-up': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAYUlEQVR4Ae3BsRHCQBAEwdlcJv+INpfDwaBUCD3Io76bbbstLGo7PKlhUVjQdjhQw4Jwoe1wQg0Xwgdthwtq+CCcaDssUsOJ8Ebb4UtqeCMctB1+pIaD8KLtcJMatm37Mw/20SAJzvQB8AAAAABJRU5ErkJggg==',
  'clean-up': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAYUlEQVR4Ae3BwRGCUBQEwdlcJv+INpfnxQNFgaAc/d0sy2Nho+3wkBo2wk7b4Udq2AkH2g5fUsOBcKLtcJMaToQP2g4X1PBBuNB2OKGGC+GGtsOOGm4IN7Ud3tSwLMsfeQH20SAJk351ZQAAAABJRU5ErkJggg==',
  'grow-up': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAVUlEQVR4Ae3BsRGAMAwEwZPHpXz/FX0vwoEiBggYO9MurTWCn2wnRVKw2E6KpGCZbGA7eTG5sZ1sNDhAUlAGhw0OsJ2U4CfbyQdJwTLYQFJIClprjy5AdhgTwpSMagAAAABJRU5ErkJggg==',
  'show-up': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAkUlEQVR4Ae3BsW3DMAAEwGdm4f4T3S4fFyoIQYJl2UWA+C5f/xSaE2hOoLkKzQE0B9C8Cs0Omh00d6FZoFmgeReaDZoNmidGLkKzM+cceeInN805Ry4YOYDmpjnnyGLkIjSLOefIJ6F5QPOA5lPQbNBs0LwLzQLNAs1daHbQ7KB5FZoDaA6guQrNCTQn0Hz9Ob9gqYJmfS/GrwAAAABJRU5ErkJggg=='
};
const MOVE_LABEL = {
  'wake-up': 'Wake Up',
  'clean-up': 'Clean Up',
  'grow-up': 'Grow Up',
  'show-up': 'Show Up'
};
function MoveIcon({
  move,
  size = 20,
  color,
  style,
  title,
  ...rest
}) {
  const src = MOVE_SRC[move];
  const label = title || MOVE_LABEL[move] || move;
  if (!src) return null;

  // White PNG by default; when a color is given, use it as a CSS mask so the
  // glyph takes any element/liminal tint.
  if (color) {
    return /*#__PURE__*/React.createElement("span", _extends({
      role: "img",
      "aria-label": label,
      title: label,
      style: {
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style
      }
    }, rest));
  }
  return /*#__PURE__*/React.createElement("img", _extends({
    src: src,
    width: size,
    height: size,
    alt: label,
    title: label,
    style: {
      display: 'inline-block',
      imageRendering: 'auto',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { MoveIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/MoveIcon.jsx", error: String((e && e.message) || e) }); }

// components/core/VibulonStat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * VibulonStat — the realm's currency readout. Vibeulons (♦) are the energy
 * generated by metabolizing emotional charge. Tabular mono numerals, a gem-
 * colored diamond, and a mono caption above. The signature wallet block.
 */
function VibulonStat({
  value = 0,
  label = 'Vibulon',
  align = 'right',
  size = 'md',
  delta,
  style,
  ...rest
}) {
  const px = {
    sm: 'var(--bars-text-base)',
    md: 'var(--bars-text-lg)',
    lg: 'var(--bars-text-2xl)'
  }[size] || 'var(--bars-text-lg)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'right' ? 'flex-end' : 'flex-start',
      gap: '2px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: 'var(--bars-text-2xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--bars-tracking-widest)',
      color: 'var(--bars-text-muted)',
      lineHeight: 1
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: '5px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 'var(--bars-weight-bold)',
      fontSize: px,
      color: 'var(--bars-element-gem)',
      lineHeight: 1
    }
  }, Number(value).toLocaleString()), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--bars-element-gem)',
      fontSize: `calc(${px} * 0.7)`,
      textShadow: '0 0 8px color-mix(in srgb, var(--bars-element-glow) 50%, transparent)'
    }
  }, "\u2666"), typeof delta === 'number' && delta !== 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: 'var(--bars-text-2xs)',
      color: delta > 0 ? 'var(--bars-wood-gem)' : 'var(--bars-fire-gem)',
      lineHeight: 1
    }
  }, delta > 0 ? '+' : '', delta)));
}
Object.assign(__ds_scope, { VibulonStat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/VibulonStat.jsx", error: String((e && e.message) || e) }); }

// ui_kits/bars-engine/app.jsx
try { (() => {
/* BARS Engine UI Kit — app data + screens.
 * Recreates the real mobile app: identity card, daily alchemy check-in (4 steps),
 * the four-move compass, active quest board, and a quest detail.
 * Uses the design-system components from window.BARSEngineDesignSystem_af69ba.
 */
const DS = window.BARSEngineDesignSystem_af69ba;
const {
  CultivationCard,
  CardArtWindow,
  CardWell,
  Button,
  Badge,
  ChromeLabel,
  ElementSigil,
  MoveIcon,
  VibulonStat
} = DS;
const {
  useState
} = React;
const ART = '../../assets/card-art/';

// ── Player ──────────────────────────────────────────────────────────────────
const PLAYER = {
  name: 'Wren Calloway',
  nation: 'Pyrakanth',
  element: 'fire',
  archetype: 'The Bold Heart',
  archetypeKey: 'bold-heart',
  art: ART + 'pyrakanth-bold-heart.png',
  vibulon: 1428
};

// ── Quests (active board) ─────────────────────────────────────────────────────
const QUESTS = [{
  id: 'q1',
  element: 'fire',
  altitude: 'neutral',
  stage: 'growing',
  nation: 'Pyrakanth',
  arche: 'Decisive Storm',
  art: ART + 'pyrakanth-decisive-storm.png',
  title: 'Name the thing you keep avoiding',
  move: 'wake-up',
  moveLabel: 'Wake Up',
  reward: 12,
  body: 'A charge has been circling for days. Face it directly — say out loud what it actually is, without softening.'
}, {
  id: 'q2',
  element: 'water',
  altitude: 'satisfied',
  stage: 'growing',
  nation: 'Lamenth',
  arche: 'Still Point',
  art: ART + 'lamenth-still-point.png',
  title: 'Sit with the grief before fixing it',
  move: 'clean-up',
  moveLabel: 'Clean Up',
  reward: 18,
  body: 'You metabolized the charge. Stay in the stillness one more breath — let the energy move through, not around.'
}, {
  id: 'q3',
  element: 'wood',
  altitude: 'dissatisfied',
  stage: 'seed',
  nation: 'Virelune',
  arche: 'Joyful Connector',
  art: ART + 'virelune-joyful-connector.png',
  title: 'Reach out to the person you drifted from',
  move: 'show-up',
  moveLabel: 'Show Up',
  reward: 24,
  body: 'Raw, unprocessed. A relationship went quiet. The quest is one message — small, honest, sent today.'
}];

// ── Check-in flow data (mirrors DailyCheckInQuest) ────────────────────────────
const CHANNELS = [{
  key: 'anger',
  label: 'Anger',
  element: 'fire',
  el: 'Fire (火)'
}, {
  key: 'joy',
  label: 'Joy',
  element: 'wood',
  el: 'Wood (木)'
}, {
  key: 'neutrality',
  label: 'Neutrality',
  element: 'earth',
  el: 'Earth (土)'
}, {
  key: 'sadness',
  label: 'Sadness',
  element: 'water',
  el: 'Water (水)'
}, {
  key: 'fear',
  label: 'Fear',
  element: 'metal',
  el: 'Metal (金)'
}];
const ALTITUDES = [{
  key: 'dissatisfied',
  label: 'Dissatisfied',
  hint: {
    anger: 'frustration',
    joy: 'restlessness',
    neutrality: 'apathy',
    sadness: 'grief',
    fear: 'anxiety'
  }
}, {
  key: 'neutral',
  label: 'Neutral',
  hint: {
    anger: 'clarity',
    joy: 'appreciation',
    neutrality: 'presence',
    sadness: 'acceptance',
    fear: 'orientation'
  }
}, {
  key: 'satisfied',
  label: 'Satisfied',
  hint: {
    anger: 'bravery',
    joy: 'bliss',
    neutrality: 'peace',
    sadness: 'poignance',
    fear: 'excitement'
  }
}];
const MOVES = [{
  key: 'transcend',
  label: 'Transcend ↑',
  tag: 'rise within',
  el: 'wood',
  desc: 'Stay in this energy — deepen your relationship with it until it transforms.'
}, {
  key: 'generate',
  label: 'Generate →↑',
  tag: '生 shēng',
  el: 'fire',
  desc: 'Nourish the next element — horizontal and rising. Let the charge feed forward.'
}, {
  key: 'control',
  label: 'Control →↓',
  tag: '克 kè',
  el: 'water',
  desc: 'Master through the overcoming cycle — a high-cost precision move.'
}];

// ── shared bits ───────────────────────────────────────────────────────────────
const title = size => ({
  fontFamily: 'var(--bars-font-display)',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--bars-text-primary)',
  fontSize: size,
  margin: 0,
  lineHeight: 1.15
});
const prose = {
  fontFamily: 'var(--bars-font-body)',
  color: 'var(--bars-text-secondary)',
  fontSize: '13px',
  lineHeight: 1.55,
  margin: 0
};
const stepLabel = {
  fontFamily: 'var(--bars-font-mono)',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: 'var(--bars-text-muted)'
};

// ── Identity card ──────────────────────────────────────────────────────────────
function IdentityCard({
  charged,
  onCheckIn
}) {
  return /*#__PURE__*/React.createElement(CultivationCard, {
    element: PLAYER.element,
    altitude: charged ? 'satisfied' : 'dissatisfied',
    stage: "growing",
    floating: charged
  }, /*#__PURE__*/React.createElement(CardArtWindow, {
    src: PLAYER.art,
    stage: "growing"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--bars-space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement(ElementSigil, {
    element: PLAYER.element,
    size: "lg",
    framed: true,
    glow: charged
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(ChromeLabel, {
    tone: charged ? 'element' : 'muted',
    style: {
      opacity: charged ? 1 : 0.5
    }
  }, PLAYER.nation), /*#__PURE__*/React.createElement("h1", {
    style: {
      ...title('20px'),
      marginTop: '4px'
    }
  }, PLAYER.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--bars-text-muted)',
      marginTop: '3px'
    }
  }, PLAYER.archetype)), /*#__PURE__*/React.createElement("span", {
    "data-element": PLAYER.element
  }, /*#__PURE__*/React.createElement(VibulonStat, {
    value: PLAYER.vibulon
  }))), charged ? /*#__PURE__*/React.createElement(ChromeLabel, {
    tone: "element",
    element: PLAYER.element,
    dot: true
  }, "Field active \xB7 anger \xB7 satisfied") : /*#__PURE__*/React.createElement("button", {
    onClick: onCheckIn,
    style: {
      width: '100%',
      padding: '9px',
      borderRadius: 'var(--bars-radius-md)',
      cursor: 'pointer',
      background: 'transparent',
      border: '1px dashed var(--bars-line-dashed)',
      color: 'var(--bars-text-secondary)',
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      transition: 'all var(--bars-dur-base)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = 'var(--bars-text-muted)';
      e.currentTarget.style.color = 'var(--bars-text-primary)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--bars-line-dashed)';
      e.currentTarget.style.color = 'var(--bars-text-secondary)';
    }
  }, "Check in to awaken your field")));
}

// ── Four-move compass ───────────────────────────────────────────────────────────
function MoveCompass() {
  const moves = [{
    m: 'wake-up',
    l: 'Wake',
    n: 7
  }, {
    m: 'clean-up',
    l: 'Clean',
    n: 4
  }, {
    m: 'grow-up',
    l: 'Grow',
    n: 2
  }, {
    m: 'show-up',
    l: 'Show',
    n: 9
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ChromeLabel, {
    style: {
      marginBottom: '10px',
      display: 'block'
    }
  }, "The four moves"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: '8px'
    }
  }, moves.map(({
    m,
    l,
    n
  }) => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      padding: '12px 6px',
      borderRadius: 'var(--bars-radius-md)',
      background: 'var(--bars-surface-card)',
      boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)'
    }
  }, /*#__PURE__*/React.createElement(MoveIcon, {
    move: m,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--bars-text-secondary)'
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontVariantNumeric: 'tabular-nums',
      fontSize: '13px',
      fontWeight: 700,
      color: 'var(--bars-text-primary)'
    }
  }, n)))));
}

// ── Quest card (board item) ──────────────────────────────────────────────────────
function QuestCard({
  q,
  onOpen
}) {
  return /*#__PURE__*/React.createElement(CultivationCard, {
    element: q.element,
    altitude: q.altitude,
    stage: q.stage,
    interactive: true,
    onClick: () => onOpen(q)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      padding: 'var(--bars-space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bars-art-window",
    style: {
      width: '76px',
      height: '76px',
      borderRadius: 'var(--bars-radius-md)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: q.art,
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement(MoveIcon, {
    move: q.move,
    size: 14,
    color: "var(--bars-element-gem)"
  }), /*#__PURE__*/React.createElement(ChromeLabel, {
    tone: "element"
  }, q.moveLabel)), /*#__PURE__*/React.createElement("h3", {
    style: {
      ...title('15px'),
      textWrap: 'pretty'
    }
  }, q.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '2px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "altitude",
    altitude: q.altitude
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '10px',
      color: 'var(--bars-element-gem)',
      marginLeft: 'auto'
    }
  }, "+", q.reward, " \u2666")))));
}

// ── Dashboard screen ──────────────────────────────────────────────────────────
function Dashboard({
  charged,
  onCheckIn,
  onOpenQuest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }
  }, /*#__PURE__*/React.createElement(IdentityCard, {
    charged: charged,
    onCheckIn: onCheckIn
  }), /*#__PURE__*/React.createElement(MoveCompass, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: '12px'
    }
  }, /*#__PURE__*/React.createElement(ChromeLabel, null, "Active quests"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '10px',
      color: 'var(--bars-text-muted)'
    }
  }, QUESTS.length, " on the road")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }
  }, QUESTS.map(q => /*#__PURE__*/React.createElement(QuestCard, {
    key: q.id,
    q: q,
    onOpen: onOpenQuest
  })))));
}

// ── Quest detail screen ─────────────────────────────────────────────────────────
function QuestDetail({
  q,
  onBack,
  onComplete
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      alignSelf: 'flex-start',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--bars-text-muted)',
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      padding: 0
    }
  }, "\u2190 The road"), /*#__PURE__*/React.createElement(CultivationCard, {
    element: q.element,
    altitude: q.altitude,
    stage: "growing"
  }, /*#__PURE__*/React.createElement(CardArtWindow, {
    src: q.art,
    stage: "growing"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--bars-space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement(MoveIcon, {
    move: q.move,
    size: 16,
    color: "var(--bars-element-gem)"
  }), /*#__PURE__*/React.createElement(ChromeLabel, {
    tone: "element",
    dot: true
  }, q.nation, " \xB7 ", q.moveLabel)), /*#__PURE__*/React.createElement("h2", {
    style: title('22px')
  }, q.title), /*#__PURE__*/React.createElement(CardWell, null, /*#__PURE__*/React.createElement("p", {
    style: prose
  }, q.body)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "altitude",
    altitude: q.altitude
  }), /*#__PURE__*/React.createElement(Badge, {
    variant: "element",
    element: q.element
  }, q.arche), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '12px',
      color: 'var(--bars-element-gem)',
      marginLeft: 'auto',
      fontWeight: 700
    }
  }, "+", q.reward, " \u2666")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    onClick: onComplete
  }, "Show up \u2014 complete the quest"))));
}

// ── Ritual completion overlay ───────────────────────────────────────────────────
function RitualOverlay({
  q,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(5,4,3,0.86)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(CultivationCard, {
    element: q.element,
    altitude: "satisfied",
    stage: "growing",
    ritual: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--bars-space-6)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '14px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(ElementSigil, {
    element: q.element,
    size: "xl",
    framed: true
  }), /*#__PURE__*/React.createElement(ChromeLabel, {
    tone: "element",
    element: q.element,
    dot: true
  }, "Quest complete"), /*#__PURE__*/React.createElement("h2", {
    style: title('22px')
  }, "A yellow brick is paved"), /*#__PURE__*/React.createElement("p", {
    style: {
      ...prose,
      textAlign: 'center'
    }
  }, "You metabolized the charge into action. The road is one stretch longer."), /*#__PURE__*/React.createElement("span", {
    "data-element": q.element
  }, /*#__PURE__*/React.createElement(VibulonStat, {
    value: q.reward,
    label: "Vibulon minted",
    delta: q.reward,
    align: "left",
    size: "lg"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    element: q.element,
    onClick: onClose
  }, "Return to the road")))));
}

// ── Daily Alchemy Check-in flow ───────────────────────────────────────────────
function CheckIn({
  onClose,
  onComplete
}) {
  const [step, setStep] = useState(0); // 0 stuckness, 1 channel, 2 altitude, 3 move
  const [stuck, setStuck] = useState(5);
  const [channel, setChannel] = useState(null);
  const [altitude, setAltitude] = useState(null);
  const [move, setMove] = useState(null);
  const activeEl = channel ? channel.element : 'earth';
  const Shell = ({
    n,
    heading,
    sub,
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: stepLabel
  }, "Step ", n, " of 4"), /*#__PURE__*/React.createElement("h3", {
    style: {
      ...title('18px'),
      marginTop: '6px'
    }
  }, heading), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      ...prose,
      marginTop: '4px'
    }
  }, sub)), children);
  const optionBtn = (selected, el) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--bars-radius-md)',
    cursor: 'pointer',
    textAlign: 'left',
    background: selected ? 'color-mix(in srgb, var(--bars-element-frame) 16%, transparent)' : 'var(--bars-surface-inset)',
    boxShadow: selected ? 'inset 0 0 0 1.5px var(--bars-element-frame)' : 'inset 0 0 0 1px var(--bars-line)',
    color: 'var(--bars-text-primary)',
    fontFamily: 'var(--bars-font-body)',
    fontSize: '14px',
    transition: 'all var(--bars-dur-base)'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(5,4,3,0.9)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 40
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    "data-element": activeEl,
    style: {
      width: '100%',
      background: 'var(--bars-surface-elevated)',
      borderTopLeftRadius: 'var(--bars-radius-2xl)',
      borderTopRightRadius: 'var(--bars-radius-2xl)',
      boxShadow: 'var(--bars-shadow-elevated)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      maxHeight: '88%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(ChromeLabel, null, "Daily Alchemy Check-in"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--bars-text-muted)',
      cursor: 'pointer',
      fontSize: '14px'
    }
  }, "\u2715")), step === 0 && /*#__PURE__*/React.createElement(Shell, {
    n: 1,
    heading: "Where are you right now?",
    sub: "0 = totally stuck \xB7 10 = full flow"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '11px',
      color: 'var(--bars-text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Stuck"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '26px',
      fontWeight: 700,
      color: 'var(--bars-text-primary)'
    }
  }, stuck), /*#__PURE__*/React.createElement("span", null, "Flow")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: 10,
    value: stuck,
    onChange: e => setStuck(+e.target.value),
    style: {
      width: '100%',
      accentColor: 'var(--bars-wood-glow)'
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    onClick: () => setStep(1)
  }, "Next \u2192")), step === 1 && /*#__PURE__*/React.createElement(Shell, {
    n: 2,
    heading: "Which emotion is active?"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, CHANNELS.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.key,
    "data-element": c.element,
    style: optionBtn(false),
    onClick: () => {
      setChannel(c);
      setStep(2);
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = 'inset 0 0 0 1.5px var(--bars-element-frame)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = 'inset 0 0 0 1px var(--bars-line)';
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement(ElementSigil, {
    element: c.element,
    size: "sm"
  }), " ", c.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-mono)',
      fontSize: '11px',
      color: 'var(--bars-text-muted)'
    }
  }, c.el))))), step === 2 && /*#__PURE__*/React.createElement(Shell, {
    n: 3,
    heading: "How far through it are you?",
    sub: `${channel.label} channel`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    "data-element": activeEl
  }, ALTITUDES.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.key,
    style: optionBtn(false),
    onClick: () => {
      setAltitude(a);
      setStep(3);
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'var(--bars-element-gem)',
      opacity: a.key === 'dissatisfied' ? 0.3 : a.key === 'neutral' ? 0.7 : 1,
      boxShadow: a.key === 'satisfied' ? '0 0 6px 1px var(--bars-element-glow)' : 'none'
    }
  }), a.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--bars-font-body)',
      fontStyle: 'italic',
      fontSize: '12px',
      color: 'var(--bars-text-muted)'
    }
  }, a.hint[channel.key]))))), step === 3 && /*#__PURE__*/React.createElement(Shell, {
    n: 4,
    heading: "Choose your move type",
    sub: `${channel.label} · ${altitude.hint[channel.key]}`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, MOVES.map(m => {
    const sel = move && move.key === m.key;
    return /*#__PURE__*/React.createElement("button", {
      key: m.key,
      "data-element": m.el,
      style: {
        ...optionBtn(sel),
        display: 'block'
      },
      onClick: () => setMove(m)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        color: 'var(--bars-text-primary)'
      }
    }, m.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--bars-font-mono)',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--bars-text-muted)'
      }
    }, m.tag)), /*#__PURE__*/React.createElement("p", {
      style: {
        ...prose,
        fontSize: '12px',
        marginTop: '6px'
      }
    }, m.desc));
  })), /*#__PURE__*/React.createElement("span", {
    "data-element": activeEl
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    disabled: !move,
    onClick: onComplete
  }, "Enter the scene \u2192")))));
}
window.BARSKit = {
  Dashboard,
  QuestDetail,
  CheckIn,
  RitualOverlay,
  PLAYER
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/bars-engine/app.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CultivationCard = __ds_scope.CultivationCard;

__ds_ns.CardArtWindow = __ds_scope.CardArtWindow;

__ds_ns.CardWell = __ds_scope.CardWell;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ChromeLabel = __ds_scope.ChromeLabel;

__ds_ns.ElementSigil = __ds_scope.ElementSigil;

__ds_ns.MoveIcon = __ds_scope.MoveIcon;

__ds_ns.VibulonStat = __ds_scope.VibulonStat;

})();
