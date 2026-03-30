import { barColor } from "../game/utils";

export default function HealthBar({ label, hp, reverse = false, shotsLeft }) {
  return (
    <div className={`hpwrap ${reverse ? "reverse" : ""}`}>
      <div className="hplabel">
        <span>{label}</span>
        <span>STŘELY: {shotsLeft}/3</span>
      </div>
      <div className="bar">
        <div
          className="fill"
          style={{
            width: `${Math.max(0, hp)}%`,
            background: barColor(hp),
            marginLeft: reverse ? "auto" : 0,
          }}
        />
      </div>
    </div>
  );
}
