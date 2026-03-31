import { FLOOR_Y } from "../game/constants";
import FighterSprite from "./FighterSprite";

export default function Fighter({ fighter, side, isWinner }) {
  const flip = side === "left" ? 1 : -1;
  const shirtName = fighter.name;

  // Determine which sprite PNG to show (with fallback to idle)
  const sp = fighter.sprites || {};
  const has = (key) => !!sp[key];

  let spriteKey = "idle";
  if (isWinner)                                       spriteKey = "win";
  else if (fighter.hurtTimer > 0)                     spriteKey = has("hurt") ? "hurt" : "idle";
  else if (fighter.crouching)                         spriteKey = has("crouch") ? "crouch" : "idle";
  else if (fighter.attack === "punch")                spriteKey = "punch";
  else if (fighter.attack === "kick" || fighter.attack === "shot") spriteKey = "kick";

  return (
    <div
      className="fighter"
      style={{
        left: fighter.x,
        bottom: FLOOR_Y + fighter.y,
        transform: `scaleX(${flip})`,
        filter: fighter.hurtTimer
          ? "drop-shadow(0 0 18px rgba(255,50,50,.95)) drop-shadow(0 14px 28px rgba(0,0,0,.6))"
          : "drop-shadow(0 14px 28px rgba(0,0,0,.55))",
        transition: "filter 0.05s, bottom 0.05s, left 0.05s",
      }}
    >
      {fighter.sprites ? (
        <img
          src={fighter.sprites[spriteKey] || fighter.sprites.idle}
          alt={fighter.name}
          className={`fighterSprite${isWinner ? " fighterSprite--win" : ""}`}
          draggable="false"
        />
      ) : (
        <FighterSprite
          fighter={fighter}
          attack={fighter.attack}
          crouching={fighter.crouching}
          blocking={fighter.blocking}
          hurtTimer={fighter.hurtTimer}
        />
      )}
      {/* counter-flip text so it's always readable */}
      <div
        className="shirtText"
        style={{ transform: `translateX(-50%) scaleX(${flip})` }}
      >
        {shirtName}
      </div>
    </div>
  );
}

