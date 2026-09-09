import type { Cocktail } from "@/data/cocktails";

/**
 * Top-down cocktail silhouettes. Drawn, not photographed: a rim ring, the
 * liquid surface, ice or foam, and one garnish catching the lamp.
 */
export function GlassArt({ glass }: { glass: Cocktail["glass"] }) {
  const common = (
    <defs>
      <radialGradient id={`g-${glass}-sour`} cx="38%" cy="32%">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="0.7" stopColor="#f3e6c8" />
        <stop offset="1" stopColor="#dcc79a" />
      </radialGradient>
      <radialGradient id={`g-${glass}-amber`} cx="38%" cy="32%">
        <stop offset="0" stopColor="#e0a24f" />
        <stop offset="0.65" stopColor="#b5641f" />
        <stop offset="1" stopColor="#6e3411" />
      </radialGradient>
      <radialGradient id={`g-${glass}-red`} cx="38%" cy="32%">
        <stop offset="0" stopColor="#d1502f" />
        <stop offset="0.65" stopColor="#a6301f" />
        <stop offset="1" stopColor="#5d1a10" />
      </radialGradient>
    </defs>
  );

  if (glass === "coupe") {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        {common}
        <ellipse cx="63" cy="65" rx="52" ry="50" fill="#0d0a08" opacity="0.55" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#f2e8d8" strokeOpacity="0.4" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="47" fill={`url(#g-coupe-sour)`} />
        <path d="M13 54A47 47 0 0 1 40 17" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        {/* egg-white foam edge and three drops of bitters */}
        <circle cx="60" cy="60" r="39" fill="#fffdf7" opacity="0.85" />
        <g fill="#a6301f" opacity="0.9">
          <circle cx="47" cy="50" r="3.2" />
          <circle cx="62" cy="44" r="2.4" />
          <circle cx="70" cy="60" r="3.6" />
        </g>
        <path d="M78 34c10-7 21-5 25 2-8 6-18 6-25-2z" fill="#4c6b47" />
      </svg>
    );
  }

  if (glass === "rocks") {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        {common}
        <rect x="15" y="15" width="94" height="94" rx="16" fill="#0d0a08" opacity="0.5" />
        <rect x="11" y="11" width="94" height="94" rx="16" fill="none" stroke="#f2e8d8" strokeOpacity="0.4" strokeWidth="2.5" />
        <circle cx="58" cy="58" r="41" fill={`url(#g-rocks-amber)`} />
        {/* one big cube, catching the lamp */}
        <g transform="rotate(-12 58 58)">
          <rect x="36" y="36" width="44" height="44" rx="4" fill="#fff" opacity="0.3" />
          <rect x="36" y="36" width="44" height="44" rx="4" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" />
          <path d="M40 44h36M44 40v36" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.2" />
        </g>
        <path d="M17 48A41 41 0 0 1 40 20" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <path d="M78 26c6 10 3 19-5 22-1-9 1-16 5-22z" fill="#e3b457" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      {common}
      <circle cx="63" cy="63" r="45" fill="#0d0a08" opacity="0.5" />
      <circle cx="60" cy="60" r="45" fill="none" stroke="#f2e8d8" strokeOpacity="0.4" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="39" fill={`url(#g-highball-red)`} />
      <g fill="#fff" opacity="0.45">
        <circle cx="48" cy="46" r="2.6" />
        <circle cx="68" cy="55" r="1.8" />
        <circle cx="56" cy="70" r="3" />
        <circle cx="72" cy="72" r="1.6" />
      </g>
      <path d="M19 50A39 39 0 0 1 40 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M40 88c-11-3-13-16-4-21 4 9 6 15 4 21z" fill="#d7dc7a" stroke="#9aa346" strokeWidth="1.2" />
    </svg>
  );
}
