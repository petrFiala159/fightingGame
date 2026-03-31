import { useEffect, useMemo, useRef, useState } from "react";
import ArenaBackground from "./components/ArenaBackground";
import Fighter from "./components/Fighter";
import HealthBar from "./components/HealthBar";

import { FIGHTERS } from "./data/fighters";
import { CONTROLS_INFO, FIREWORK_COLORS, MAX_HP, MAX_SHOTS, P1_KEYS, P2_KEYS, ROUND_TIME, STAGE_H, STAGE_W, JUMP_FORCE, BASE_MOVE, GRAVITY, FLOOR_Y } from "./game/constants";
import { unlockAudio, playHitSound, playPunchSound, playKickSound, playHeadshotSound, playBlockSound, playComboSound, playShotFireSound, playShotHitSound, playJumpSound, playLowHpSound, playAnnounceSound, playVictorySound, startBgMusic, pauseBgMusic, resumeBgMusic } from "./game/audio";
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
  const [round, setRound] = useState(1);
  const [roundWins, setRoundWins] = useState({ p1: 0, p2: 0 });
  const [isMatchOver, setIsMatchOver] = useState(false);
  const musicStartedRef = useRef(false);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const pressedRef = useRef({});
  const playersRef = useRef(null);
  const winnerRef = useRef("");
  const arenaRef = useRef(null);
  const roundRef = useRef(1);
  const roundWinsRef = useRef({ p1: 0, p2: 0 });

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

  // keep refs in sync with state for use inside closures
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { winnerRef.current = winner; }, [winner]);

  // Low HP heartbeat warning
  useEffect(() => {
    if (phase !== "fight") return;
    if ((players.p1.hp <= 25 && players.p1.hp > 0) || (players.p2.hp <= 25 && players.p2.hp > 0)) {
      playLowHpSound();
    }
  }, [Math.floor(players.p1.hp / 5), Math.floor(players.p2.hp / 5), phase]);

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

  function showAnnounce(text) {
    setAnnounce(text);
    playAnnounceSound();
    setTimeout(() => setAnnounce(null), 1400);
  }

  function resetRound() {
    setPlayers({
      p1: cloneFighter(p1Choice, 140, 1, P1_KEYS, MAX_HP, MAX_SHOTS),
      p2: cloneFighter(p2Choice, 920, -1, P2_KEYS, MAX_HP, MAX_SHOTS),
    });
    setProjectiles([]);
    setFx([]);
    setDmgNums([]);
    setWinner("");
    winnerRef.current = "";
    setTimer(ROUND_TIME);
    setPhase("fight");
  }

  function startFight() {
    unlockAudio();
    roundRef.current = 1;
    roundWinsRef.current = { p1: 0, p2: 0 };
    setRound(1);
    setRoundWins({ p1: 0, p2: 0 });
    setIsMatchOver(false);
    resetRound();
    showAnnounce("ROUND 1");
  }

  function startNextRound() {
    const next = roundRef.current + 1;
    roundRef.current = next;
    setRound(next);
    resetRound();
    showAnnounce(next >= 3 ? "FINAL ROUND" : `ROUND ${next}`);
  }

  function backToSelect() {
    clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    roundRef.current = 1;
    roundWinsRef.current = { p1: 0, p2: 0 };
    setRound(1);
    setRoundWins({ p1: 0, p2: 0 });
    setIsMatchOver(false);
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
    const snap = playersRef.current;
    const isBlocked = snap?.[attackerKey === "p1" ? "p2" : "p1"]?.blocking ?? false;

    if (isBlocked) {
      playBlockSound();
    } else if (moveType === "combo") {
      playComboSound();
    } else if (moveType === "shot") {
      playShotHitSound();
    } else if (headshot) {
      playHeadshotSound();
    } else if (moveType === "kick") {
      playKickSound();
    } else {
      playPunchSound();
    }
    triggerShake(moveType === "kick" || moveType === "combo");

    if (snap) {
      const defenderKey = attackerKey === "p1" ? "p2" : "p1";
      const defender = snap[defenderKey];
      const hitX = defender.x + 60;
      const hitY = STAGE_H - FLOOR_Y - defender.y - 170;
      const numId = `dmg-${Date.now()}-${Math.random()}`;
      const isBig = amount >= 12;
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

      playShotFireSound();
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
      playJumpSound();
      setPlayers((prev) => ({ ...prev, p1: { ...prev.p1, vy: JUMP_FORCE } }));
    }
    if (key === snap.p2.controls.jump && snap.p2.y === 0 && !snap.p2.crouching) {
      playJumpSound();
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
    cancelAnimationFrame(rafRef.current);
    setWinner(nextWinner);
    setPhase("over");

    const snap = playersRef.current;
    const newWins = { ...roundWinsRef.current };
    if (nextWinner !== "Remíza" && snap) {
      if (nextWinner === snap.p1.name) newWins.p1 += 1;
      else newWins.p2 += 1;
    }
    roundWinsRef.current = newWins;
    setRoundWins(newWins);

    const matchOver = newWins.p1 >= 2 || newWins.p2 >= 2;
    if (matchOver) {
      setIsMatchOver(true);
      triggerCelebration();
    } else {
      playVictorySound();
      setTimeout(() => startNextRound(), 2800);
    }
  }

  function getStatBars(fighter) {
    const s = fighter.stats;
    return [
      { label: "PUNCH",    value: Math.round(60 + ((s.punch - 8)   / 2)    * 40) },
      { label: "KICK",     value: Math.round(60 + ((s.kick - 10)   / 2)    * 40) },
      { label: "STŘELA",   value: Math.round(60 + ((s.shot - 9)    / 4)    * 40) },
      { label: "OBRANA",   value: Math.round(60 + ((1.0 - Math.min(s.defense, 1.0)) / 0.22) * 40) },
      { label: "RYCHLOST", value: Math.round(60 + ((s.speed - 0.98) / 0.24) * 40) },
    ];
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
        <div className="sel-screen" onClick={handleSelectAreaClick}>
          {/* Ambient background blobs */}
          <div className="sel-bg">
            <div className="sel-blob sel-blob--left"  style={{ background: p1Choice.color }} />
            <div className="sel-blob sel-blob--right" style={{ background: p2Choice.color }} />
          </div>

          <div className="sel-layout">

            {/* ── P1 PANEL ── */}
            <div className="sel-panel" style={{ borderTopColor: p1Choice.color }}>
              <div className="sel-player-tag" style={{ color: p1Choice.color }}>HRÁČ 1</div>

              <div className="sel-portrait-row">
                <button type="button" className="sel-nav-btn" onClick={() => cycleP1(-1)}>‹</button>
                <div className="sel-portrait-frame">
                  <img src={p1Choice.img} alt={p1Choice.name} className="sel-portrait-img" draggable="false" />
                  <div className="sel-portrait-bottom" style={{ background: `linear-gradient(transparent, ${p1Choice.color}99)` }} />
                  <div className="sel-portrait-glow" style={{ border: `2px solid ${p1Choice.color}`, boxShadow: `0 0 36px ${p1Choice.color}66, inset 0 0 24px ${p1Choice.color}22` }} />
                </div>
                <button type="button" className="sel-nav-btn" onClick={() => cycleP1(1)}>›</button>
              </div>

              <div className="sel-name" style={{ color: p1Choice.color }}>{p1Choice.name}</div>
              <div className="sel-role" style={{ borderColor: `${p1Choice.color}88`, color: p1Choice.color }}>{p1Choice.role}</div>

              <div className="sel-stats">
                {getStatBars(p1Choice).map(({ label, value }) => (
                  <div key={label} className="sel-stat">
                    <span className="sel-stat-lbl">{label}</span>
                    <div className="sel-stat-track">
                      <div className="sel-stat-fill" style={{ width: `${value}%`, background: p1Choice.color }} />
                    </div>
                    <span className="sel-stat-val">{value}</span>
                  </div>
                ))}
              </div>

              <p className="sel-passive">{p1Choice.passive}</p>

              <div className="sel-dots">
                {FIGHTERS.map((f) => (
                  <button key={f.id} type="button"
                    className={`dot${f.id === p1Choice.id ? " dot-active" : ""}`}
                    style={f.id === p1Choice.id ? { background: p1Choice.color } : {}}
                    onClick={() => setP1Choice(f)} title={f.name}
                  />
                ))}
              </div>
              <div className="carr-hint" style={{ marginTop: 8 }}>← A · D →</div>
            </div>

            {/* ── VS CENTER ── */}
            <div className="sel-vs">
              <div className="sel-vs-matchup">
                <div className="sel-vs-side">
                  <img src={p1Choice.img} className="sel-vs-portrait" alt={p1Choice.name} />
                  <div className="sel-vs-fname" style={{ color: p1Choice.color }}>{p1Choice.name}</div>
                </div>
                <div className="sel-vs-text">VS</div>
                <div className="sel-vs-side sel-vs-side--right">
                  <img src={p2Choice.img} className="sel-vs-portrait sel-vs-portrait--flip" alt={p2Choice.name} />
                  <div className="sel-vs-fname" style={{ color: p2Choice.color }}>{p2Choice.name}</div>
                </div>
              </div>

              <button type="button" className="sel-start-btn" onClick={startFight}>
                START FIGHT
              </button>
              <div className="carr-hint" style={{ marginTop: 6 }}>nebo stiskni Enter</div>

              <div className="sel-controls-hint">
                <div><span style={{ color: "#ef4444" }}>P1:</span> A/D pohyb · W skok · F box · G kop · H střela</div>
                <div><span style={{ color: "#06b6d4" }}>P2:</span> ←/→ pohyb · ↑ skok · J box · K kop · L střela</div>
                <div style={{ color: "#666", marginTop: 4 }}>KOMBO: BOX–BOX–KOP / KOP–BOX–KOP</div>
              </div>
            </div>

            {/* ── P2 PANEL ── */}
            <div className="sel-panel" style={{ borderTopColor: p2Choice.color }}>
              <div className="sel-player-tag" style={{ color: p2Choice.color }}>HRÁČ 2</div>

              <div className="sel-portrait-row">
                <button type="button" className="sel-nav-btn" onClick={() => cycleP2(-1)}>‹</button>
                <div className="sel-portrait-frame">
                  <img src={p2Choice.img} alt={p2Choice.name} className="sel-portrait-img" draggable="false" />
                  <div className="sel-portrait-bottom" style={{ background: `linear-gradient(transparent, ${p2Choice.color}99)` }} />
                  <div className="sel-portrait-glow" style={{ border: `2px solid ${p2Choice.color}`, boxShadow: `0 0 36px ${p2Choice.color}66, inset 0 0 24px ${p2Choice.color}22` }} />
                </div>
                <button type="button" className="sel-nav-btn" onClick={() => cycleP2(1)}>›</button>
              </div>

              <div className="sel-name" style={{ color: p2Choice.color }}>{p2Choice.name}</div>
              <div className="sel-role" style={{ borderColor: `${p2Choice.color}88`, color: p2Choice.color }}>{p2Choice.role}</div>

              <div className="sel-stats">
                {getStatBars(p2Choice).map(({ label, value }) => (
                  <div key={label} className="sel-stat sel-stat--rev">
                    <span className="sel-stat-val">{value}</span>
                    <div className="sel-stat-track sel-stat-track--rev">
                      <div className="sel-stat-fill" style={{ width: `${value}%`, background: p2Choice.color }} />
                    </div>
                    <span className="sel-stat-lbl">{label}</span>
                  </div>
                ))}
              </div>

              <p className="sel-passive">{p2Choice.passive}</p>

              <div className="sel-dots">
                {FIGHTERS.map((f) => (
                  <button key={f.id} type="button"
                    className={`dot${f.id === p2Choice.id ? " dot-active" : ""}`}
                    style={f.id === p2Choice.id ? { background: p2Choice.color } : {}}
                    onClick={() => setP2Choice(f)} title={f.name}
                  />
                ))}
              </div>
              <div className="carr-hint" style={{ marginTop: 8 }}>← ↑ · → šipky</div>
            </div>

          </div>
        </div>
      ) : (
        <>
          <div id="hud">
            <div className="hud-side">
              <HealthBar label={players.p1.name} hp={players.p1.hp} shotsLeft={players.p1.shotsLeft} />
              <div className="win-pips">
                {[0, 1].map((i) => (
                  <div key={i} className={`win-pip${i < roundWins.p1 ? " win-pip--on" : ""}`}
                    style={i < roundWins.p1 ? { background: p1Choice.color, boxShadow: `0 0 10px ${p1Choice.color}` } : {}} />
                ))}
              </div>
            </div>

            <div className="hud-center">
              <div className="round-label">ROUND {round}</div>
              <div className="score-display">
                <span style={{ color: p1Choice.color }}>{roundWins.p1}</span>
                <span className="score-sep">:</span>
                <span style={{ color: p2Choice.color }}>{roundWins.p2}</span>
              </div>
              <div className={`timer${timer <= 10 ? " timer--low" : ""}`}>
                <div className="t1">TIME</div>
                <div className="t2">{timer}</div>
              </div>
            </div>

            <div className="hud-side hud-side--right">
              <HealthBar label={players.p2.name} hp={players.p2.hp} shotsLeft={players.p2.shotsLeft} reverse />
              <div className="win-pips win-pips--right">
                {[0, 1].map((i) => (
                  <div key={i} className={`win-pip${i < roundWins.p2 ? " win-pip--on" : ""}`}
                    style={i < roundWins.p2 ? { background: p2Choice.color, boxShadow: `0 0 10px ${p2Choice.color}` } : {}} />
                ))}
              </div>
            </div>
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
              <div className={`ko${isMatchOver ? "" : " ko--round"}`}>
                <div className="big">{isMatchOver ? "K.O." : `ROUND ${round}`}</div>
                <div className="winner">{winner}</div>
                {isMatchOver ? (
                  <>
                    <div className="sub2">VÍTĚZ SLAVÍ VE SKLADU</div>
                    <div className="match-score">
                      <span style={{ color: p1Choice.color }}>{p1Choice.name} {roundWins.p1}</span>
                      <span style={{ color: "#555" }}> – </span>
                      <span style={{ color: p2Choice.color }}>{roundWins.p2} {p2Choice.name}</span>
                    </div>
                    <div className="teethStats">{teethLabel}</div>
                    <div className="trophy">🏆</div>
                    <button type="button" onClick={startFight}>REMATCH</button>
                  </>
                ) : (
                  <>
                    <div className="round-score-big">
                      <span style={{ color: p1Choice.color }}>{roundWins.p1}</span>
                      <span className="round-score-sep">:</span>
                      <span style={{ color: p2Choice.color }}>{roundWins.p2}</span>
                    </div>
                    <div className="next-round-msg">Příští kolo začíná za chvíli…</div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
