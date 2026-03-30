export function cloneFighter(fighter, x, facing, controls, maxHp, maxShots) {
  return {
    ...fighter,
    x,
    y: 0,
    vy: 0,
    facing,
    hp: maxHp,
    crouching: false,
    blocking: false,
    attack: null,
    attackTimer: 0,
    hurtTimer: 0,
    combo: [],
    shotsLeft: maxShots,
    teeth: 0,
    controls,
  };
}

export function distance(a, b) {
  return Math.abs(a.x + 60 - (b.x + 60));
}

export function barColor(value) {
  if (value > 55) return "linear-gradient(90deg,#22c55e,#84cc16)";
  if (value > 25) return "linear-gradient(90deg,#f59e0b,#f97316)";
  return "linear-gradient(90deg,#ef4444,#991b1b)";
}

export function makeFx(x, y, type, dir, color = null) {
  const count = type === "blood" ? 8 : type === "tooth" ? 3 : type === "firework" ? 36 : 10;
  const list = [];

  for (let i = 0; i < count; i += 1) {
    const angle = type === "firework" ? (Math.PI * 2 * i) / count : 0;
    list.push({
      id: `${type}-${Date.now()}-${i}-${Math.random()}`,
      x,
      y,
      vx:
        type === "firework"
          ? Math.cos(angle) * (2 + Math.random() * 5)
          : (Math.random() * 5 + 2) * (Math.random() > 0.2 ? dir : -dir),
      vy: type === "firework" ? Math.sin(angle) * (2 + Math.random() * 5) : -(Math.random() * 6 + 2),
      life: type === "spark" ? 18 : type === "firework" ? 40 : 32,
      size: type === "blood" ? Math.random() * 7 + 4 : Math.random() * 12 + 6,
      type,
      rot: Math.random() * 360,
      spin: (Math.random() - 0.5) * 18,
      color,
    });
  }

  return list;
}
