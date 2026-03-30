import { useEffect, useMemo, useRef, useState } from "react";
import ArenaBackground from "./components/ArenaBackground";
import Fighter from "./components/Fighter";
import HealthBar from "./components/HealthBar";

import { FIGHTERS } from "./data/fighters";
import { CONTROLS_INFO, FIREWORK_COLORS, MAX_HP, MAX_SHOTS, P1_KEYS, P2_KEYS, ROUND_TIME, STAGE_H, STAGE_W, JUMP_FORCE, BASE_MOVE, GRAVITY, FLOOR_Y } from "./game/constants";
import { unlockAudio, playHitSound, playVictorySound, startBgMusic, pauseBgMusic, resumeBgMusic } from "./game/audio";
import { cloneFighter, distance, makeFx } from "./game/utils";

export default function App() {
  const [phase, setPhase] = useState("select");
  const [p1Choice, setP1Choice] = useState(FIGHTERS[0]);
  const [p2Choice, setP2Choice] = useState(FIGHTERS[2]);
  const [players, setPlayers] = useState(() => ({
    p1: cloneFighter(FIGHTERS[0], 140, 1, P1_KEYS, MAX_HP, MAX_SHOTS),
    p2: cloneFighter(FIGHTERS[2], 920, -1, P2_KEYS, MAX_HP, MAX_SHOTS),
  }));
  const [projectiles, setProjectiles] = useState([]);
  const [fx, setFx] = useState([]);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [winner, setWinner] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [dmgNums, setDmgNums] = useState([]);
  const [announce, setAnnounce] = useState(null);
  const musicStartedRef = useRef(false);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const pressedRef = useRef({});
  const playersRef = useRef(null);
  const winnerRef = useRef("");
  const arenaRef = useRef(null);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function tryStartMusic() {
    if (!musicStartedRef.current) {
      musicStartedRef.current = true;
      startBgMusic();
    }
  }

  function toggleMusic() {
    setIsMusicOn((prev) => {
      if (prev) {
        pauseBgMusic();
      } else {
        tryStartMusic();
        resumeBgMusic();
      }
      return !prev;
    });
  }

  function triggerShake(heavy = false) {
    const el = arenaRef.current;
    if (!el) return;
    el.classList.remove("arena-shake", "arena-shake--heavy");
    void el.offsetWidth;
    el.classList.add(heavy ? "arena-shake--heavy" : "arena-shake");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  function handleSelectAreaClick() {
    tryStartMusic();
  }

  function cycleP1(dir) {
    setP1Choice((prev) => FIGHTERS[(FIGHTERS.findIndex((f) => f.id === prev.id) + dir + FIGHTERS.length) % FIGHTERS.length]);
  }

  function cycleP2(dir) {
    setP2Choice((prev) => FIGHTERS[(FIGHTERS.findIndex((f) => f.id === prev.id) + dir + FIGHTERS.length) % FIGHTERS.length]);
  }

  function getCard3dStyle(offset, accentColor) {
    if (offset === 0) {
      return {
        transform: "translateX(-50%) scale(1)",
        opacity: 1,
        zIndex: 3,
        borderColor: accentColor,
        boxShadow: `0 0 32px ${accentColor}55`,
        pointerEvents: "none",
      };
    }
    if (Math.abs(offset) === 1) {
      const sign = Math.sign(offset);
      return {
        transform: `translateX(calc(-50% + ${sign * 108}px)) rotateY(${sign * 42}deg) scale(0.72)`,
        opacity: 0.48,
        zIndex: 2,
        cursor: "pointer",
        borderColor: "#1e1e20",
      };
    }
    return {
      transform: "translateX(-50%) scale(0.3)",
      opacity: 0,
      zIndex: 1,
      pointerEvents: "none",
    };
  }

  const teethLabel = useMemo(
    () => `P1 vyražené zuby: ${players.p1.teeth} | P2 vyražené zuby: ${players.p2.teeth}`,
    [players.p1.teeth, players.p2.teeth]
  );

  // keep ref in sync so AI can read latest state without closure issues
  // keep refs in sync with state for use inside closures
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { winnerRef.current = winner; }, [winner]);

  useEffect(() => {
    const onDown = (event) => {
      pressedRef.current[event.key] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "a", "d", "w", "s", "f", "g", "h", "j", "k", "l"].includes(event.key)) {
        event.preventDefault();
      }
      tryStartMusic();
      if (phase !== "fight" || event.repeat) return;
      unlockAudio();
      act(event.key);
    };

    const onUp = (event) => {
      pressedRef.current[event.key] = false;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "select") return undefined;
    const handler = (e) => {
      if (e.repeat) return;
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setP1Choice((prev) => FIGHTERS[(FIGHTERS.findIndex((f) => f.id === prev.id) - 1 + FIGHTERS.length) % FIGHTERS.length]);
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setP1Choice((prev) => FIGHTERS[(FIGHTERS.findIndex((f) => f.id === prev.id) + 1) % FIGHTERS.length]);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setP2Choice((prev) => FIGHTERS[(FIGHTERS.findIndex((f) => f.id === prev.id) - 1 + FIGHTERS.length) % FIGHTERS.length]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setP2Choice((prev) => FIGHTERS[(FIGHTERS.findIndex((f) => f.id === prev.id) + 1) % FIGHTERS.length]);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        startFight();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, p1Choice, p2Choice]);

  useEffect(() => {
    if (phase !== "fight") return undefined;
    timerRef.current = setInterval(() => {
      setTimer((current) => {
        if (current <= 1) {
          finishByHp();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fight") return undefined;
    const loop = () => {
      setPlayers((prev) => tickPlayers(prev, pressedRef.current));
      setProjectiles((prev) => tickProjectiles(prev, playersRef.current));
      setFx((prev) =>
        prev
          .map((item) => ({
            ...item,
            x: item.x + item.vx,
            y: item.y + item.vy,
            vy: item.vy + 0.3,
            life: item.life - 1,
            rot: item.rot + item.spin,
          }))
          .filter((item) => item.life > 0 && item.y < STAGE_H)
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  function startFight() {
    unlockAudio();
    setPlayers({
      p1: cloneFighter(p1Choice, 140, 1, P1_KEYS, MAX_HP, MAX_SHOTS),
      p2: cloneFighter(p2Choice, 920, -1, P2_KEYS, MAX_HP, MAX_SHOTS),
    });
    setProjectiles([]);
    setFx([]);
    setDmgNums([]);
    setWinner("");
    setTimer(ROUND_TIME);
    setPhase("fight");
    setAnnounce("FIGHT!");
    setTimeout(() => setAnnounce(null), 1200);
  }

  function backToSelect() {
    clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    setPhase("select");
  }

  function tickPlayers(prev, keys) {
    const p1 = { ...prev.p1 };
    const p2 = { ...prev.p2 };

    p1.facing = p1.x < p2.x ? 1 : -1;
    p2.facing = p2.x > p1.x ? -1 : 1;

    [p1, p2].forEach((fighter) => {
      fighter.crouching = !!keys[fighter.controls.crouch] && fighter.y === 0;
      fighter.blocking = fighter.crouching;

      if (!fighter.attack && !fighter.crouching) {
        if (keys[fighter.controls.left]) fighter.x -= BASE_MOVE * fighter.stats.speed;
        if (keys[fighter.controls.right]) fighter.x += BASE_MOVE * fighter.stats.speed;
      }

      if (fighter.y > 0 || fighter.vy > 0) {
        fighter.y += fighter.vy;
        fighter.vy -= GRAVITY;
        if (fighter.y <= 0) {
          fighter.y = 0;
          fighter.vy = 0;
        }
      }

      fighter.x = Math.max(20, Math.min(STAGE_W - 140, fighter.x));
      if (fighter.attackTimer > 0) fighter.attackTimer -= 1;
      else fighter.attack = null;

      if (fighter.hurtTimer > 0) fighter.hurtTimer -= 1;
      fighter.combo = fighter.combo.filter((move) => Date.now() - move.t < 900);
    });

    return { p1, p2 };
  }

  function damageTarget(attackerKey, moveType, amount, headshot = false) {
    playHitSound(moveType === "kick" ? "kick" : "punch");
    triggerShake(moveType === "kick" || moveType === "combo");

    const snap = playersRef.current;
    if (snap) {
      const defenderKey = attackerKey === "p1" ? "p2" : "p1";
      const defender = snap[defenderKey];
      const hitX = defender.x + 60;
      const hitY = STAGE_H - FLOOR_Y - defender.y - 170;
      const numId = `dmg-${Date.now()}-${Math.random()}`;
      const isBig = amount >= 12;
      const isBlocked = defender.blocking;
      setDmgNums((old) => [...old, { id: numId, x: hitX, y: hitY, value: amount, big: isBig, blocked: isBlocked }]);
      setTimeout(() => setDmgNums((old) => old.filter((d) => d.id !== numId)), 900);
    }

    setPlayers((prev) => {
      const attacker = { ...prev[attackerKey] };
      const defenderKey = attackerKey === "p1" ? "p2" : "p1";
      const defender = { ...prev[defenderKey] };

      let damage = amount;
      if (defender.blocking) damage = Math.round(damage * 0.4 * defender.stats.defense);
      if (moveType === "punch" && defender.id === "tonda") damage = Math.round(damage * 0.8);

      defender.hp = Math.max(0, defender.hp - damage);
      defender.hurtTimer = 8;
      defender.x += attacker.facing * (moveType === "kick" ? 20 : 14);

      const hitX = defender.x + 60 + attacker.facing * 22;
      const hitY = STAGE_H - FLOOR_Y - defender.y - (headshot ? 210 : 160);

      setFx((old) => [
        ...old,
        ...makeFx(hitX, hitY, "blood", attacker.facing),
        ...makeFx(hitX, hitY, "spark", attacker.facing),
        ...(headshot && !defender.blocking ? makeFx(hitX + 8, hitY - 10, "tooth", attacker.facing) : []),
      ]);

      if (headshot && !defender.blocking) defender.teeth += 1;

      const next = attackerKey === "p1" ? { p1: attacker, p2: defender } : { p1: defender, p2: attacker };

      if (next.p1.hp <= 0 || next.p2.hp <= 0) {
        setTimeout(() => {
          endFight(next.p1.hp <= 0 ? next.p2.name : next.p1.name);
        }, 50);
      }

      return next;
    });
  }

  function melee(attackerKey, kind) {
    const snap = playersRef.current;
    if (!snap) return;
    const attackerNow = snap[attackerKey];
    const defenderNow = snap[attackerKey === "p1" ? "p2" : "p1"];

    setPlayers((prev) => {
      const attacker = { ...prev[attackerKey] };
      if (attacker.attackTimer > 0 || winnerRef.current) return prev;
      attacker.attack = kind;
      attacker.attackTimer = kind === "punch" ? 11 : 15;
      attacker.combo = [...attacker.combo, { k: kind === "punch" ? "P" : "K", t: Date.now() }].slice(-3);
      return attackerKey === "p1" ? { ...prev, p1: attacker } : { ...prev, p2: attacker };
    });

    const reach = kind === "kick" ? 176 : 150;
    if (distance(attackerNow, defenderNow) <= reach) {
      const damage = kind === "punch" ? attackerNow.stats.punch : attackerNow.stats.kick;
      const headshot = kind === "punch" && !defenderNow.crouching;
      damageTarget(attackerKey, kind, damage, headshot);

      const sequence = [...attackerNow.combo.map((item) => item.k), kind === "punch" ? "P" : "K"]
        .slice(-3)
        .join("");

      if (sequence === "PPK" || sequence === "KPK") {
        damageTarget(attackerKey, "combo", 14, true);
      }
    }
  }

  function fire(attackerKey) {
    setPlayers((prev) => {
      const attacker = { ...prev[attackerKey] };
      if (attacker.attackTimer > 0 || attacker.shotsLeft <= 0 || winnerRef.current) return prev;

      attacker.shotsLeft -= 1;
      attacker.attack = "shot";
      attacker.attackTimer = 18;

      setProjectiles((old) => [
        ...old,
        {
          id: `${attackerKey}-${Date.now()}-${Math.random()}`,
          owner: attackerKey,
          x: attacker.x + 55 + attacker.facing * 30,
          y: STAGE_H - FLOOR_Y - attacker.y - 150,
          vx: attacker.facing * 12,
          damage: attacker.stats.shot,
          color: attacker.color,
        },
      ]);

      return attackerKey === "p1" ? { ...prev, p1: attacker } : { ...prev, p2: attacker };
    });
  }

  function tickProjectiles(prev, curPlayers) {
    if (!curPlayers) return prev;
    const next = [];
    prev.forEach((projectile) => {
      const moved = { ...projectile, x: projectile.x + projectile.vx };
      const target = projectile.owner === "p1" ? curPlayers.p2 : curPlayers.p1;

      const hit =
        moved.x > target.x &&
        moved.x < target.x + 120 &&
        moved.y > STAGE_H - FLOOR_Y - target.y - 240 &&
        moved.y < STAGE_H - FLOOR_Y - target.y - 60;

      if (hit) damageTarget(projectile.owner, "shot", projectile.damage, true);
      else if (moved.x > 0 && moved.x < STAGE_W) next.push(moved);
    });

    return next;
  }

  function act(key) {
    const snap = playersRef.current;
    if (!snap) return;
    if (key === snap.p1.controls.jump && snap.p1.y === 0 && !snap.p1.crouching) {
      setPlayers((prev) => ({ ...prev, p1: { ...prev.p1, vy: JUMP_FORCE } }));
    }
    if (key === snap.p2.controls.jump && snap.p2.y === 0 && !snap.p2.crouching) {
      setPlayers((prev) => ({ ...prev, p2: { ...prev.p2, vy: JUMP_FORCE } }));
    }
    if (key === snap.p1.controls.punch) melee("p1", "punch");
    if (key === snap.p1.controls.kick) melee("p1", "kick");
    if (key === snap.p1.controls.shot) fire("p1");
    if (key === snap.p2.controls.punch) melee("p2", "punch");
    if (key === snap.p2.controls.kick) melee("p2", "kick");
    if (key === snap.p2.controls.shot) fire("p2");
  }

  function triggerCelebration() {
    playVictorySound();
    for (let wave = 0; wave < 6; wave += 1) {
      setTimeout(() => {
        setFx((old) => {
          const centerX = 160 + Math.random() * 860;
          const centerY = 70 + Math.random() * 180;
          const extra = FIREWORK_COLORS.flatMap((color) =>
            makeFx(centerX, centerY, "firework", 1, color).map((item) => ({ ...item, color }))
          );
          return [...old, ...extra];
        });
      }, wave * 260);
    }
  }

  function finishByHp() {
    const snap = playersRef.current;
    if (!snap) return;
    const nextWinner =
      snap.p1.hp === snap.p2.hp ? "Remíza" : snap.p1.hp > snap.p2.hp ? snap.p1.name : snap.p2.name;
    endFight(nextWinner);
  }

  function endFight(nextWinner) {
    clearInterval(timerRef.current);
    setWinner(nextWinner);
    setPhase("over");
    triggerCelebration();
  }

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>MALFINI SKLAD ARENA</h1>
          <div className="sub">2 hráči, 4 postavy, střely, kryt, skrčení a komba</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="ghostbtn" onClick={backToSelect}>
            výběr postav
          </button>
          <button type="button" className="ghostbtn fsbtn" onClick={toggleMusic} title={isMusicOn ? "Ztlumit hudbu" : "Zapnout hudbu"}>
            {isMusicOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            )}
          </button>
          <button type="button" className="ghostbtn fsbtn" onClick={toggleFullscreen} title={isFullscreen ? "Ukončit celou obrazovku" : "Celá obrazovka"}>
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/></svg>
            )}
          </button>
        </div>
      </div>

      {phase === "select" ? (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="select-layout" onClick={handleSelectAreaClick}>
          {/* ── P1 CAROUSEL ── */}
          <div className="panel carousel-panel">
            <h2 style={{ color: "#ef4444" }}>Hráč 1</h2>
            <div className="carr3d-scene">
              {FIGHTERS.map((f, i) => {
                const selIdx = FIGHTERS.findIndex((x) => x.id === p1Choice.id);
                let off = i - selIdx;
                if (off > FIGHTERS.length / 2) off -= FIGHTERS.length;
                if (off < -FIGHTERS.length / 2) off += FIGHTERS.length;
                const style = getCard3dStyle(off, f.color);
                return (
                  <div
                    key={f.id}
                    className="carr3d-card"
                    style={style}
                    onClick={Math.abs(off) === 1 ? () => cycleP1(off) : undefined}
                  >
                    <img src={f.img} alt={f.name} draggable="false" />
                    <div className="carr3d-badge" style={{ color: f.color }}>{f.name}</div>
                  </div>
                );
              })}
            </div>
            <p className="carr3d-passive">{p1Choice.passive}</p>
            <div className="carr-dots">
              {FIGHTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`dot${f.id === p1Choice.id ? " dot-active" : ""}`}
                  style={f.id === p1Choice.id ? { background: p1Choice.color } : {}}
                  onClick={() => setP1Choice(f)}
                  title={f.name}
                />
              ))}
            </div>
            <div className="carr-hint">← A &nbsp;·&nbsp; D →</div>
          </div>

          {/* ── CENTER PANEL ── */}
          <div className="panel featurePanel carr-center">
            <div className="featureTitle">Ovládání</div>
            <ul className="featureList">
              {CONTROLS_INFO.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>Každý hráč má 3 střely za fight.</li>
              <li>Ve skrčení zároveň kryješ a dostáváš méně damage.</li>
              <li>Po výhře hraje oslavný zvuk a běží ohňostroj.</li>
            </ul>
            <button type="button" className="start" onClick={startFight}>
              START FIGHT
            </button>
            <div className="carr-hint" style={{ marginTop: 10 }}>nebo stiskni Enter</div>
          </div>

          {/* ── P2 CAROUSEL ── */}
          <div className="panel carousel-panel">
            <h2 style={{ color: "#06b6d4" }}>Hráč 2</h2>
            <div className="carr3d-scene">
              {FIGHTERS.map((f, i) => {
                const selIdx = FIGHTERS.findIndex((x) => x.id === p2Choice.id);
                let off = i - selIdx;
                if (off > FIGHTERS.length / 2) off -= FIGHTERS.length;
                if (off < -FIGHTERS.length / 2) off += FIGHTERS.length;
                const style = getCard3dStyle(off, f.color);
                return (
                  <div
                    key={f.id}
                    className="carr3d-card"
                    style={style}
                    onClick={Math.abs(off) === 1 ? () => cycleP2(off) : undefined}
                  >
                    <img src={f.img} alt={f.name} draggable="false" />
                    <div className="carr3d-badge" style={{ color: f.color }}>{f.name}</div>
                  </div>
                );
              })}
            </div>
            <p className="carr3d-passive">{p2Choice.passive}</p>

            <div className="carr-dots">
              {FIGHTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`dot${f.id === p2Choice.id ? " dot-active" : ""}`}
                  style={f.id === p2Choice.id ? { background: p2Choice.color } : {}}
                  onClick={() => setP2Choice(f)}
                  title={f.name}
                />
              ))}
            </div>
            <div className="carr-hint">← ↑ &nbsp;·&nbsp; → šipky</div>
          </div>
        </div>
      ) : (
        <>
          <div id="hud">
            <HealthBar label={players.p1.name} hp={players.p1.hp} shotsLeft={players.p1.shotsLeft} />
            <div className={`timer${timer <= 10 ? " timer--low" : ""}`}>
              <div className="t1">TIME</div>
              <div className="t2">{timer}</div>
            </div>
            <HealthBar label={players.p2.name} hp={players.p2.hp} shotsLeft={players.p2.shotsLeft} reverse />
          </div>

          <div id="arena" ref={arenaRef}>
            <ArenaBackground />

            <div className="note left">{CONTROLS_INFO[0]}</div>
            <div className="note right">{CONTROLS_INFO[1]}</div>
            <div className="midnote">{CONTROLS_INFO[2]}</div>

            <Fighter fighter={players.p1} side="left" isWinner={phase === "over" && winner === players.p1.name} />
            <Fighter fighter={players.p2} side="right" isWinner={phase === "over" && winner === players.p2.name} />

            {projectiles.map((projectile) => (
              <div
                key={projectile.id}
                className="proj"
                style={{ left: projectile.x, top: projectile.y, backgroundColor: projectile.color }}
              />
            ))}

            {fx.map((item) => (
              <div key={item.id} className="fx" style={{ left: item.x, top: item.y, transform: `rotate(${item.rot}deg)` }}>
                {item.type === "blood" ? (
                  <div className="blood" style={{ width: item.size, height: item.size * 0.8 }} />
                ) : item.type === "tooth" ? (
                  <div className="tooth" style={{ width: item.size, height: Math.max(7, item.size * 0.66) }} />
                ) : item.type === "firework" ? (
                  <div className="firework" style={{ width: item.size * 0.7, height: item.size * 0.7, backgroundColor: item.color }} />
                ) : (
                  <div className="spark" style={{ width: item.size * 0.55, height: item.size * 0.55 }} />
                )}
              </div>
            ))}

            {/* Floating damage numbers */}
            {dmgNums.map((d) => (
              <div
                key={d.id}
                className={`dmg-num${d.big ? " dmg-num--big" : ""}${d.blocked ? " dmg-num--blocked" : ""}`}
                style={{ left: d.x, top: d.y }}
              >
                {d.blocked ? "BLOCK" : `-${d.value}`}
              </div>
            ))}

            {/* Combo counters */}
            {players.p1.combo.length >= 2 && (
              <div className="combo-p1">
                <div className="combo-count" key={players.p1.combo.length}>{players.p1.combo.length} HIT</div>
                <div className="combo-label">COMBO</div>
              </div>
            )}
            {players.p2.combo.length >= 2 && (
              <div className="combo-p2">
                <div className="combo-count" key={players.p2.combo.length}>{players.p2.combo.length} HIT</div>
                <div className="combo-label">COMBO</div>
              </div>
            )}

            {/* Fight announce */}
            {announce && (
              <div className="announce">
                <div className="announce-text" key={announce}>{announce}</div>
              </div>
            )}

            {phase === "over" && (
              <div className="ko">
                <div className="big">K.O.</div>
                <div className="winner">{winner}</div>
                <div className="sub2">VÍTĚZ SLAVÍ VE SKLADU</div>
                <div className="teethStats">{teethLabel}</div>
                <div className="trophy">🏆</div>
                <button type="button" onClick={startFight}>
                  REMATCH
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
