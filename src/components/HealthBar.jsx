import { useEffect, useRef, useState } from "react";
import { barColor } from "../game/utils";

export default function HealthBar({ label, hp, reverse = false, shotsLeft }) {
  const [drainHp, setDrainHp] = useState(hp);
  const drainTimer = useRef(null);

  useEffect(() => {
    if (hp < drainHp) {
      clearTimeout(drainTimer.current);
      drainTimer.current = setTimeout(() => setDrainHp(hp), 380);
    } else {
      clearTimeout(drainTimer.current);
      setDrainHp(hp);
    }
    return () => clearTimeout(drainTimer.current);
  }, [hp]);

  const isLow = hp <= 25;

  return (
    <div className={`hpwrap${reverse ? " reverse" : ""}`}>
      <div className="hplabel">
        <span>{label}</span>
        <div className="shots-display">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={`shot-pip${i < shotsLeft ? " shot-pip--on" : ""}`}
            />
          ))}
        </div>
      </div>
      <div className={`bar${isLow ? " bar--low" : ""}`}>
        <div
          className="fill--drain"
          style={{ width: `${Math.max(0, drainHp)}%` }}
        />
        <div
          className="fill--main"
          style={{
            width: `${Math.max(0, hp)}%`,
            background: barColor(hp),
          }}
        />
      </div>
    </div>
  );
}
