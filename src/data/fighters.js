import tondaImg from "../assets/tonda.png";
import romanImg from "../assets/roman.png";
import radekImg from "../assets/radek.png";
import janaImg from "../assets/jana.png";
import pepaImg from "../assets/pepa_idle.png";

import radekIdle from "../assets/radek/idle.png";
import radekPunch from "../assets/radek/punch.png";
import radekKick from "../assets/radek/kick.png";
import radekWin from "../assets/radek/win.png";

import pepaIdle from "../assets/pepa_idle.png";
import pepaPunch from "../assets/pepa_punch.png";
import pepaKick from "../assets/pepa_kick.png";
import pepaWin from "../assets/pepa_win.png";
import pepaHurt from "../assets/pepa_hurt.png";
import pepaCrouch from "../assets/pepa_crouch.png";

export const FIGHTERS = [
  {
    id: "tonda",
    name: "Mlátička",
    role: "BOXER",
    img: tondaImg,
    color: "#ef4444",
    passive: "Tvrdá brada – dostává o něco menší damage od boxů.",
    stats: { punch: 10, kick: 12, shot: 10, defense: 0.9, speed: 1.0 },
  },
  {
    id: "roman",
    name: "Řežba",
    role: "RYCHLÍK",
    img: romanImg,
    color: "#f59e0b",
    passive: "Rychlý krok – pohybuje se nejrychleji.",
    stats: { punch: 9, kick: 11, shot: 9, defense: 1.0, speed: 1.22 },
  },
  {
    id: "radek",
    name: "Blesk",
    role: "STŘELEC",
    img: radekImg,
    color: "#22c55e",
    passive: "Silná střela – projektil má vyšší damage.",
    stats: { punch: 9, kick: 12, shot: 13, defense: 1.0, speed: 1.02 },
    sprites: { idle: radekIdle, punch: radekPunch, kick: radekKick, win: radekWin },
  },
  {
    id: "jana",
    name: "Drtička",
    role: "OBRÁNCE",
    img: janaImg,
    color: "#3b82f6",
    passive: "Ocelový kryt – při bloku schytá méně damage.",
    stats: { punch: 8, kick: 10, shot: 9, defense: 0.78, speed: 0.98 },
  },
  {
    id: "pepa",
    name: "Pepan",
    role: "DĚLNÍK",
    img: pepaImg,
    color: "#ef4444",
    passive: "Tvrdé ruce – každý úder nese extra razanci ze skladu.",
    stats: { punch: 11, kick: 11, shot: 8, defense: 0.95, speed: 1.05 },
    sprites: { idle: pepaIdle, punch: pepaPunch, kick: pepaKick, win: pepaWin, hurt: pepaHurt, crouch: pepaCrouch },
  },
];
