/**
 * FighterSprite – SVG assembled sprite
 *
 * Structure (all coordinates in viewBox 0 0 160 300, fighter faces RIGHT):
 *   back-leg → back-arm → torso → front-leg → front-arm → neck → head
 *
 * Poses: idle | punch | kick | shot | crouch | hurt | block
 * Rotations stored per-limb. Parent Fighter.jsx does scaleX(-1) for right player.
 */

// degrees for each pose
const POSES = {
  //                     armF   armB   legF  legB
  idle:   { armF:  28, armB: -28, legF:   0, legB:   0 },
  punch:  { armF: -78, armB:  22, legF:   5, legB:   0 },
  kick:   { armF:  22, armB: -18, legF: -70, legB:  14 },
  shot:   { armF: -52, armB:  18, legF:   0, legB:   0 },
  crouch: { armF:  18, armB: -36, legF:  54, legB:  26 },
  hurt:   { armF:  50, armB: -24, legF:  -6, legB:  -6 },
  block:  { armF: -30, armB: -50, legF:   8, legB:   4 },
};

function tr(rot, ox, oy) {
  return {
    transformOrigin: `${ox}px ${oy}px`,
    transform: `rotate(${rot}deg)`,
    transition: "transform 0.11s ease-out",
  };
}

export default function FighterSprite({ fighter, attack, crouching, blocking, hurtTimer }) {
  let poseKey = "idle";
  if (hurtTimer > 0)             poseKey = "hurt";
  else if (blocking)             poseKey = "block";
  else if (crouching)            poseKey = "crouch";
  else if (attack === "punch")   poseKey = "punch";
  else if (attack === "kick")    poseKey = "kick";
  else if (attack === "shot")    poseKey = "shot";

  const p = POSES[poseKey];
  const c = fighter.color;
  const uid = fighter.id;

  // dark variant of fighter color for back-limbs
  const dim = `${c}80`; // 50% opacity via hex alpha

  // whole-body crouch scale
  const bodyStyle =
    poseKey === "crouch"
      ? { transform: "scaleY(0.78) translateY(18px)", transformOrigin: "80px 292px", transition: "transform 0.1s" }
      : { transition: "transform 0.1s" };

  const hurtStyle =
    poseKey === "hurt"
      ? { transform: "rotate(-10deg) translateX(-10px)", transformOrigin: "80px 150px", transition: "transform 0.08s" }
      : {};

  return (
    <svg
      viewBox="0 0 160 300"
      width="160"
      height="300"
      overflow="visible"
      style={{ ...bodyStyle, ...hurtStyle, display: "block" }}
    >
      <defs>
        {/* Circle clip for the head portrait */}
        <clipPath id={`hc-${uid}`}>
          <circle cx="80" cy="52" r="44" />
        </clipPath>

        {/* Subtle body gradient */}
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={c} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* ── BACK LEG ── */}
      <g style={tr(p.legB, 84, 222)}>
        <rect x="72" y="222" width="24" height="68" rx="11" fill={dim} />
        {/* shoe */}
        <ellipse cx="82" cy="292" rx="20" ry="8" fill="#0d0d18" opacity="0.7" />
      </g>

      {/* ── BACK ARM ── */}
      <g style={tr(p.armB, 48, 124)}>
        <rect x="4"  y="116" width="52" height="16" rx="7" fill={dim} />
        <circle cx="8" cy="124" r="12" fill={dim} />
      </g>

      {/* ── TORSO ── */}
      {/* Main body */}
      <path d="M46 122 L114 122 L109 222 L51 222 Z" fill={`url(#bg-${uid})`} />
      {/* Right-side shadow */}
      <path d="M80 122 L114 122 L109 222 L80 222 Z" fill="rgba(0,0,0,0.22)" />
      {/* Belt */}
      <rect x="50" y="200" width="60" height="10" rx="5" fill="rgba(0,0,0,0.5)" />
      {/* Chest V detail */}
      <path d="M62 136 L80 150 L98 136" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" strokeLinecap="round" />
      {/* Shoulder pads */}
      <ellipse cx="46"  cy="126" rx="12" ry="8" fill={c} />
      <ellipse cx="114" cy="126" rx="12" ry="8" fill={c} />

      {/* ── FRONT LEG ── */}
      <g style={tr(p.legF, 64, 222)}>
        <rect x="52" y="222" width="24" height="68" rx="11" fill={c} />
        {/* knee cap */}
        <circle cx="64" cy="256" r="9" fill={c} />
        <circle cx="64" cy="256" r="5" fill="rgba(0,0,0,0.22)" />
        {/* shoe */}
        <ellipse cx="62" cy="292" rx="22" ry="8" fill="#13131f" />
      </g>

      {/* ── FRONT ARM ── */}
      <g style={tr(p.armF, 112, 124)}>
        <rect x="106" y="116" width="52" height="16" rx="7" fill={c} />
        {/* fist */}
        <circle cx="156" cy="124" r="13" fill={c} />
        <circle cx="156" cy="124" r="8"  fill="rgba(0,0,0,0.24)" />
        {/* knuckle lines */}
        <line x1="150" y1="118" x2="150" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1="155" y1="117" x2="155" y2="131" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1="160" y1="118" x2="160" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      </g>

      {/* ── NECK ── */}
      <rect x="68" y="92" width="24" height="32" rx="9" fill="#c4a07a" />

      {/* ── HEAD ── */}
      {fighter.img ? (
        <>
          {/* dark backing circle */}
          <circle cx="80" cy="52" r="46" fill="#0c0c14" />
          {/* portrait photo clipped to circle */}
          <image
            href={fighter.img}
            x="22"
            y="0"
            width="116"
            height="116"
            clipPath={`url(#hc-${uid})`}
            preserveAspectRatio="xMidYMin slice"
          />
        </>
      ) : (
        // Karl – drawn AI head
        <>
          <circle cx="80" cy="52" r="46" fill="#1a0832" />
          <circle cx="80" cy="52" r="43" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="6 3" />
          <text x="80" y="44" textAnchor="middle" fontSize="28" fill="#a855f7">⚡</text>
          <text x="80" y="65" textAnchor="middle" fontSize="10" fontWeight="900" fill="#a855f7" letterSpacing="3">AI</text>
        </>
      )}
      {/* head ring – fighter color */}
      <circle cx="80" cy="52" r="46" fill="none" stroke={c} strokeWidth="2.5" opacity="0.7" />
    </svg>
  );
}
