// Cochinos del Orinoco — Platanus Hack 26 Caracas
// Una excavadora en gabarra atrapa cochinos que bajan por el río. Roguelite de mejoras al azar.

const W = 800;
const H = 600;
// Orillas y centro del río del mundo activo (cambian con cada jugador, ver use())
let RL = 90;
let RR = 710;
let CX = 400;
const KEY = 'cochinos-orinoco-hs';

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u', ' '],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const K2A = {};
for (const [code, keys] of Object.entries(CABINET_KEYS)) {
  for (const k of keys) K2A[k.toLowerCase()] = code;
}

const held = {};
const hit = {};
window.addEventListener('keydown', (e) => {
  const c = K2A[e.key.toLowerCase()];
  if (!c) return;
  if (!held[c]) hit[c] = 1;
  held[c] = 1;
  e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  const c = K2A[e.key.toLowerCase()];
  if (c) held[c] = 0;
});

const FB = ['P1_1', 'P1_2', 'P1_3', 'P1_4', 'P1_5', 'P1_6', 'P2_1', 'P2_2', 'P2_3', 'P2_4', 'P2_5', 'P2_6'];
const ax = (k) => hit['P1_' + k] || hit['P2_' + k];
const anyBtn = () => FB.some((b) => hit[b]) || hit.START1 || hit.START2;

// Cochinos: rosado, azul, dorado, arcoíris
const PV = [1, 3, 10, 30];
const PC = [0xff9ec4, 0x5bc8ff, 0xffd23f, 0xffffff];
const PS = ['#ff9ec4', '#5bc8ff', '#ffd23f', '#ffffff'];

// Cosas que bajan por el río además de cochinos: bomba y los 3 ítems especiales
const IK = ['bomb', 'bolt', 'shd', 'net', 'heart'];
const IN = ['+1 BOMBA', 'TURBO', 'ESCUDO', 'RED', '+1 VIDA'];
const ICOL = [0xffa52e, 0xffe14d, 0x7fe0ff, 0xffffff, 0xff4d6d];

// Rarezas: común, rara, épica
const RC = [0x9be36b, 0x4fc3ff, 0xff5ad1];
const RN = ['COMÚN', 'RARA', 'ÉPICA'];

// [clave, nombre, descripción, nivel máx, rareza, icono, tinte]
const UP = [
  ['r', 'BRAZO LARGO', '+30% alcance\nde la garra', 5, 0, 'claw'],
  ['v', 'HIDRÁULICA', 'Garra +30%\nmás rápida', 5, 0, 'bolt'],
  ['z', 'PALA ANCHA', 'Garra +35%\nmás grande', 4, 0, 'claw', 0xffd23f],
  ['m', 'ORUGAS TURBO', '+18% velocidad\nde la gabarra', 4, 0, 'ex'],
  ['n', 'GARRA EXTRA', 'Lanza +1 garra\nen abanico', 4, 2, 'claw', 0xff8ad8],
  ['p', 'PALA HONDA', '+2 cochinos\npor cada garra', 5, 1, 'pig', 0xff9ec4],
  ['g', 'IMÁN PORCINO', 'Atrae cochinos\ncercanos', 4, 1, 'mag'],
  ['t', 'RAZA FINA', ['Bajan cochinos\nAZULES (3 pts)', 'Bajan cochinos\nDORADOS (10 pts)', 'Bajan cochinos\nARCOÍRIS (30 pts)'], 3, 2, 'pig'],
  ['f', 'CRECIDA', '+35% cochinos\nbajando el río', 5, 1, 'pig', 0x7fffd4],
  ['h', 'RÍO GENEROSO', 'Bombas e ítems\nbajan +30% seguido', 3, 1, 'net'],
  ['d', 'DINAMITA', '+2 bombas y\nexplosión más grande', 4, 2, 'bomb'],
  ['c', 'RACHA', 'El combo dura\n+1.5 segundos', 3, 0, 'bolt', 0xff8a1f],
  ['l', 'BLINDAJE', '+1 vida máxima\ny repara todo', 3, 1, 'heart'],
];

const LORE =
  'La crecida del Orinoco llegó de madrugada y sin avisar.\n\n' +
  'Don Chucho, un viejo granjero de la ribera, vio cómo el río se llevaba su corral... ' +
  'y a todos sus cochinitos, corriente abajo.\n\n' +
  'Tú solo ibas de paso: una excavadora rumbo a otra obra. ' +
  'Pero nadie deja a un llanero llorando en la orilla.\n\n' +
  'Te montaste en una gabarra, afilaste la garra y se lo prometiste:\n' +
  '«Tranquilo, Don Chucho. Yo se los traigo de vuelta.»';
const MAXLV = 24; // nivel 25 en pantalla
const FURY = 19; // desde el nivel 20 los caimanes se enfurecen

const LORE2 =
  '\n\nPero no eras la única excavadora en el camino... ¡A ver quién rescata más!';

let sc; // escena
let G; // mundo activo: río, excavadora y marcador de un jugador
let L; // niveles de mejoras del mundo activo
let WS = []; // mundos (1, o 2 en duelo)
let MODE = 0; // 0 título, 1 un jugador, 2 duelo
let GP = 'title'; // fase global: title, lore, play, pause, end
let TC, BT, LC, LX, LH, LT, LI, PZ; // título, récords, historia y pausa
let AC; // audio context
let best = [];
let loaded = 0;
let water, raft, ex, gfx, tS, tL, xpBar, tC, cBar, tN, tB, tI, iI, hearts;

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#0a2a36',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { create, update },
});

// --- Utilidades ---

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = Phaser.Math.Clamp;
const css = (c) => '#' + c.toString(16).padStart(6, '0');

function T(x, y, s, size, col = '#ffffff') {
  return sc.add
    .text(x, y, s, {
      fontFamily: 'monospace',
      fontSize: size + 'px',
      color: col,
      fontStyle: 'bold',
      align: 'center',
      stroke: '#061018',
      strokeThickness: Math.max(3, (size / 6) | 0),
    })
    .setOrigin(0.5);
}

function icon(key, x, y, size, tint) {
  const im = sc.add.image(x, y, key);
  im.setScale(size / Math.max(im.width, im.height));
  if (tint) im.setTint(tint);
  return im;
}

function tone(f, d, type = 'square', v = 0.1, f2 = 0, t0 = 0) {
  if (!AC || AC.state !== 'running') return;
  try {
    const t = AC.currentTime + t0;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g);
    g.connect(AC.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  } catch (_) {}
}

// Música: joropo alegre en 6/8. Notas en onda triangular con ataque suave y filtro
// pasa-bajos para que no canse, más maracas y bombo que le dan el ritmo. 16 compases.
const SCL = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19];
const MEL = '4-47-79-87-48-84-14-1-487-79-9a-97-58-4-187--4-79-9b-9a-86-89-74-78--4-15-57-97-42-41-14-87--0--';
const ROOT = [0, 0, -5, -5, 0, 5, -5, 0, 3, -2, 0, -5, 5, 0, -5, 0];
let MB; // bus de música
let NZ; // ruido para las maracas
let mt = 0;
let ms = 0;

function note(f, d, v, t0) {
  const t = AC.currentTime + t0;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = 'triangle';
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + 0.025);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g);
  g.connect(MB);
  o.start(t);
  o.stop(t + d + 0.05);
}

function shake(v, t0) {
  const t = AC.currentTime + t0;
  const n = AC.createBufferSource();
  const f = AC.createBiquadFilter();
  const g = AC.createGain();
  n.buffer = NZ;
  f.type = 'highpass';
  f.frequency.value = 5500;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  n.connect(f);
  f.connect(g);
  g.connect(AC.destination);
  n.start(t);
}

function music() {
  if (!AC || AC.state !== 'running') return;
  try {
    if (!MB) {
      NZ = AC.createBuffer(1, 3000, AC.sampleRate);
      const d = NZ.getChannelData(0);
      for (let i = 0; i < 3000; i++) d[i] = Math.random() * 2 - 1;
      MB = AC.createBiquadFilter();
      MB.type = 'lowpass';
      MB.frequency.value = 2200;
      MB.connect(AC.destination);
    }
    if (mt < AC.currentTime) mt = AC.currentTime + 0.05;
    while (mt < AC.currentTime + 0.15) {
      const s = ms % 96;
      const b = s % 6;
      const r = ROOT[(s / 6) | 0];
      const third = r === 0 || r === 5 ? 3 : 4;
      const t0 = mt - AC.currentTime;
      const hz = (base, semi) => base * 2 ** (semi / 12);
      // Bajo en los tiempos fuertes, arpegio tipo cuatro en los débiles
      if (b === 0) note(hz(73.42, r), 0.45, 0.16, t0);
      else if (b === 3) note(hz(73.42, r + 7), 0.3, 0.11, t0);
      else note(hz(146.83, r + [0, third, 7, 0, 12, 7][b]), 0.22, 0.04, t0);
      // Maracas en cada pulso (acento en 1 y 4) y bombo que marca el compás
      shake(b % 3 ? 0.025 : 0.06, t0);
      if (b % 3 === 0) tone(b ? 110 : 140, 0.12, 'sine', b ? 0.1 : 0.18, 45, t0);
      // Melodía: notas largas; en las vueltas impares calla la primera mitad
      const c = MEL[s];
      if (c !== '-' && (((ms / 96) | 0) % 2 === 0 || s > 23)) {
        let n = 1;
        while (MEL[s + n] === '-') n++;
        note(hz(293.66, SCL[parseInt(c, 36)]), n * 0.19, 0.065, t0);
      }
      mt += 0.155;
      ms++;
    }
  } catch (_) {}
}

// Emisores de partículas compartidos (se crean en mkFx)
let P;

function mkFx() {
  const e = (tex, depth, cfg) => sc.add.particles(0, 0, tex, Object.assign({ emitting: false }, cfg)).setDepth(depth);
  const glow = (depth, v0, v1, sz) =>
    e('dot', depth, { speed: { min: v0, max: v1 }, lifespan: { min: 280, max: 750 }, scale: { start: sz, end: 0 }, blendMode: 'ADD' });
  P = {
    // chispas de color: chicas, grandes y por encima de las cartas
    sk: glow(8, 20, 110, 1),
    bg: glow(8, 70, 300, 1.6),
    cf: glow(55, 80, 340, 1.8),
    // salpicadura de agua
    sp: e('dot', 8, {
      speed: { min: 60, max: 190 },
      angle: { min: 215, max: 325 },
      gravityY: 520,
      lifespan: { min: 300, max: 600 },
      scale: { start: 0.7, end: 0.15 },
      tint: [0xffffff, 0xbfe8ff, 0x8fd0f0],
    }),
    // fuego
    fi: e('dot', 8, {
      speed: { min: 30, max: 260 },
      lifespan: { min: 250, max: 650 },
      scale: { start: 2.6, end: 0 },
      tint: [0xffe14d, 0xff8a1f, 0xff3b1f],
      blendMode: 'ADD',
    }),
    // humo
    sm: e('dot', 9, {
      speed: { min: 10, max: 60 },
      angle: { min: 240, max: 300 },
      lifespan: { min: 700, max: 1300 },
      scale: { start: 1.2, end: 4 },
      alpha: { start: 0.45, end: 0 },
      tint: [0x444444, 0x777777],
    }),
    // espuma que se la lleva la corriente
    wk: e('dot', 1, {
      speedY: { min: 55, max: 85 },
      speedX: { min: -18, max: 18 },
      lifespan: { min: 500, max: 900 },
      scale: { start: 0.5, end: 1.6 },
      alpha: { start: 0.45, end: 0 },
    }),
    // onda en el agua
    rg: e('ring', 1, { lifespan: 650, scale: { start: 0.25, end: 1.5 }, alpha: { start: 0.7, end: 0 } }),
  };
  // Ambiente: hojas que caen de la selva y destellos del sol en el agua
  sc.add
    .particles(0, 0, 'leaf', {
      x: { min: 0, max: W },
      y: -10,
      speedY: { min: 35, max: 80 },
      speedX: { min: -25, max: 25 },
      rotate: { start: 0, end: 360 },
      lifespan: 11000,
      frequency: 650,
      scale: { min: 0.7, max: 1.3 },
      tint: [0x3a8a35, 0x9be36b, 0xcaa75a],
    })
    .setDepth(9);
  sc.add
    .particles(0, 0, 'dot', {
      x: { min: 0, max: W },
      y: { min: 50, max: H },
      speedY: 70,
      lifespan: 700,
      frequency: 80,
      scale: { start: 0.7, end: 0 },
      alpha: 0.6,
      blendMode: 'ADD',
    })
    .setDepth(1);
}

function burst(x, y, col, n = 8, sp = 60, depth = 8) {
  const e = depth > 50 ? P.cf : sp > 100 ? P.bg : P.sk;
  e.setParticleTint(col);
  e.emitParticleAt(x, y, n);
}

function pop(x, y, s, col) {
  if (G.fl > 10) return;
  G.fl++;
  const g = G;
  const t = T(x, y, s, 18, col).setDepth(9);
  sc.tweens.add({
    targets: t,
    y: y - 40,
    alpha: 0,
    duration: 650,
    onComplete: () => {
      t.destroy();
      g.fl--;
    },
  });
}

function store() {
  return (
    window.platanusArcadeStorage || {
      async get(k) {
        try {
          const r = window.localStorage.getItem(k);
          return r === null ? { found: false } : { found: true, value: JSON.parse(r) };
        } catch (_) {
          return { found: false };
        }
      },
      async set(k, v) {
        try {
          window.localStorage.setItem(k, JSON.stringify(v));
        } catch (_) {}
      },
    }
  );
}

const bestStr = () =>
  best.length ? best.map((e, i) => i + 1 + '. ' + e.n + ' ' + e.s).join('   ') : 'SIN RÉCORDS TODAVÍA';

// --- Texturas procedurales ---

function mkTex() {
  if (sc.textures.exists('pig')) return;
  const g = sc.make.graphics({ add: false });
  const tx = (k, w, h, f) => {
    g.clear();
    f();
    g.generateTexture(k, w, h);
  };

  tx('w', 64, 64, () => {
    g.fillStyle(0x1b6f8f).fillRect(0, 0, 64, 64);
    g.fillStyle(0x3d93b0, 0.6);
    g.fillRect(8, 4, 3, 18).fillRect(30, 30, 3, 22).fillRect(50, 10, 3, 14).fillRect(20, 50, 2, 10);
    g.fillStyle(0x145a76, 0.6);
    g.fillRect(42, 44, 3, 16).fillRect(16, 22, 2, 14).fillRect(58, 34, 2, 12);
  });

  // Cochino en blanco para poder teñirlo de cualquier color
  tx('pig', 44, 36, () => {
    g.fillStyle(0xd8d8d8).fillTriangle(6, 14, 10, 1, 19, 9).fillTriangle(38, 14, 34, 1, 25, 9);
    g.fillStyle(0xffffff).fillCircle(22, 20, 15);
    g.fillStyle(0xd0d0d0).fillEllipse(22, 25, 17, 12);
    g.fillStyle(0x555555).fillCircle(19, 25, 2).fillCircle(25, 25, 2);
    g.fillStyle(0x1a1a1a).fillCircle(15, 16, 2.6).fillCircle(29, 16, 2.6);
  });

  // Caimán mirando hacia abajo
  tx('cai', 34, 84, () => {
    g.fillStyle(0x2f7a2e).fillTriangle(10, 22, 24, 22, 17, 0);
    g.fillEllipse(5, 30, 10, 8).fillEllipse(29, 30, 10, 8).fillEllipse(5, 50, 10, 8).fillEllipse(29, 50, 10, 8);
    g.fillStyle(0x3f9a3a).fillEllipse(17, 38, 22, 46);
    g.fillStyle(0x2f7a2e).fillCircle(17, 26, 3).fillCircle(17, 36, 3).fillCircle(17, 46, 3);
    g.fillStyle(0x55b54a).fillRoundedRect(8, 52, 18, 30, 7);
    g.fillStyle(0xffffff);
    g.fillTriangle(7, 66, 10, 66, 8, 71).fillTriangle(24, 66, 27, 66, 26, 71);
    g.fillTriangle(7, 74, 10, 74, 8, 79).fillTriangle(24, 74, 27, 74, 26, 79);
    g.fillStyle(0xffe14d).fillCircle(11, 57, 3.5).fillCircle(23, 57, 3.5);
    g.fillStyle(0x111111).fillCircle(11, 58, 1.6).fillCircle(23, 58, 1.6);
  });

  tx('raft', 64, 64, () => {
    g.fillStyle(0x5a3414).fillRoundedRect(0, 0, 64, 64, 10);
    g.fillStyle(0x8a5a2b).fillRoundedRect(3, 3, 58, 58, 8);
    g.fillStyle(0x6b421c).fillRect(17, 3, 2, 58).fillRect(31, 3, 2, 58).fillRect(45, 3, 2, 58);
  });

  // Excavadora mirando a la derecha: amarilla (jugador 1) y azul (jugador 2)
  [
    ['ex', 0xffc21a, 0xd99a00],
    ['ex2', 0x4fc3ff, 0x2b8fd0],
  ].forEach(([k, c1, c2]) =>
    tx(k, 50, 40, () => {
      g.fillStyle(0x222222).fillRoundedRect(2, 1, 36, 10, 4).fillRoundedRect(2, 29, 36, 10, 4);
      g.fillStyle(0x555555).fillRect(6, 4, 4, 4).fillRect(16, 4, 4, 4).fillRect(26, 4, 4, 4);
      g.fillRect(6, 32, 4, 4).fillRect(16, 32, 4, 4).fillRect(26, 32, 4, 4);
      g.fillStyle(c1).fillRoundedRect(6, 7, 30, 26, 5);
      g.fillStyle(c2).fillRect(34, 16, 14, 8).fillRect(8, 9, 8, 22);
      g.fillStyle(0x1d3442).fillRect(19, 10, 13, 12);
      g.fillStyle(0x9fe0ff).fillRect(21, 12, 9, 8);
      g.fillStyle(0x333333).fillCircle(12, 27, 3);
    }),
  );

  tx('claw', 32, 30, () => {
    g.fillStyle(0xe6edf1).fillTriangle(4, 10, 30, 2, 20, 13).fillTriangle(4, 20, 30, 28, 20, 17);
    g.fillStyle(0xaab4bb).fillTriangle(4, 10, 20, 13, 6, 14).fillTriangle(4, 20, 20, 17, 6, 16);
    g.fillStyle(0x7d8890).fillCircle(7, 15, 7);
    g.fillStyle(0xe6edf1).fillCircle(7, 15, 3);
  });

  tx('dot', 8, 8, () => g.fillStyle(0xffffff).fillCircle(4, 4, 4));
  tx('ring', 64, 64, () => g.lineStyle(3, 0xffffff).strokeCircle(32, 32, 29));
  tx('leaf', 12, 8, () => g.fillStyle(0xffffff).fillEllipse(6, 4, 12, 7));

  tx('heart', 20, 18, () => {
    g.fillStyle(0xff4d6d).fillCircle(6, 6, 5.5).fillCircle(14, 6, 5.5).fillTriangle(0.5, 8, 19.5, 8, 10, 18);
    g.fillStyle(0xffb3c1).fillCircle(5, 5, 2);
  });

  tx('bomb', 32, 32, () => {
    g.fillStyle(0x8a5a2b).fillRect(17, 3, 3, 8);
    g.fillStyle(0xffd23f).fillCircle(20, 3, 3);
    g.fillStyle(0x2a2a2a).fillCircle(15, 20, 11);
    g.fillStyle(0x777777).fillCircle(11, 16, 3);
  });

  tx('mag', 32, 32, () => {
    g.fillStyle(0xff3b3b).fillCircle(16, 17, 14);
    g.fillRect(2, 4, 28, 13);
    g.fillStyle(0xffffff).fillRect(2, 2, 9, 6).fillRect(21, 2, 9, 6);
    // hueco de la U (se recorta al dibujar con color de fondo de carta)
    g.fillStyle(0x12222e).fillCircle(16, 16, 5).fillRect(11, 0, 10, 16);
  });

  tx('shd', 32, 32, () => {
    g.fillStyle(0x2b7fc4).fillRoundedRect(3, 2, 26, 16, 4).fillTriangle(3, 16, 29, 16, 16, 31);
    g.fillStyle(0x7fe0ff).fillRoundedRect(7, 6, 18, 11, 3).fillTriangle(7, 16, 25, 16, 16, 25);
  });

  tx('net', 32, 32, () => {
    g.lineStyle(3, 0xffffff).strokeCircle(16, 16, 13);
    g.lineStyle(2, 0xffffff);
    for (let i = 8; i < 28; i += 8) g.lineBetween(i, 5, i, 27).lineBetween(5, i, 27, i);
  });

  // Don Chucho, el granjero
  tx('man', 40, 56, () => {
    g.fillStyle(0x3a2a1a).fillRect(11, 51, 7, 5).fillRect(22, 51, 7, 5);
    g.fillStyle(0xe0a070).fillRect(3, 32, 6, 13).fillRect(31, 32, 6, 13);
    g.fillStyle(0xf1f1f1).fillRoundedRect(8, 30, 24, 14, 4);
    g.fillStyle(0x3d6fb5).fillRect(11, 36, 18, 16).fillRect(12, 30, 4, 8).fillRect(24, 30, 4, 8);
    g.fillStyle(0xe0a070).fillCircle(20, 22, 9);
    g.fillStyle(0x1a1a1a).fillCircle(16, 20, 1.5).fillCircle(24, 20, 1.5);
    g.fillStyle(0x4a3020).fillEllipse(20, 26, 13, 4);
    g.fillStyle(0xd9b25f).fillEllipse(20, 14, 40, 9);
    g.fillStyle(0xe8c877).fillRoundedRect(11, 2, 18, 12, 5);
    g.fillStyle(0xb5473a).fillRect(11, 10, 18, 3);
  });

  tx('bolt', 32, 32, () => {
    g.fillStyle(0xffe14d).fillTriangle(19, 1, 6, 18, 17, 18).fillTriangle(15, 14, 26, 14, 12, 31);
  });

  g.destroy();
}

// --- Mundos: cada jugador tiene su propio río (pantalla partida en duelo) ---

// Apunta los globales al mundo de un jugador; toda la lógica trabaja sobre el mundo activo
function use(w) {
  G = w;
  L = w.L;
  RL = w.a;
  RR = w.b;
  CX = (RL + RR) / 2;
  ({ water, raft, ex, gfx, tS, tL, xpBar, tC, cBar, tN, tB, tI, iI, hearts } = w.o);
}

const two = () => WS.length > 1;
// En duelo no se sacude ni destella la pantalla entera: molestaría al otro jugador
const shk = (d, i) => two() || sc.cameras.main.shake(d, i);
const fls = (d, r, g, b) => two() || sc.cameras.main.flash(d, r, g, b);

function mkWorld(i, n) {
  const duo = n > 1;
  const vw = W / n;
  const x0 = i * vw;
  const bk = duo ? 20 : 90;
  const a = x0 + bk;
  const b = x0 + vw - bk;
  const cx = x0 + vw / 2;
  const w = {
    ph: 'demo',
    T: 0, // tiempo total (animaciones)
    t: 0, // tiempo de partida
    tm: 180, // reloj del duelo
    x: cx,
    y: 430,
    fx: 0,
    fy: -1,
    hp: 3,
    inv: 0,
    cd: 0,
    score: 0,
    n: 0,
    xp: 0,
    need: 4,
    lv: 0,
    cb: 0,
    ct: 0,
    ps: 0,
    cs: 3,
    bm: 1, // bombas
    it: 0, // ítem especial guardado (índice en IK)
    is: 8, // tiempo para el próximo objeto del río
    tb: 0, // turbo activo
    sh: 0, // escudo activo
    ft: 0, // temporizador del humo del motor
    pm: 1, // último multiplicador mostrado
    fl: 0,
    sn: 0,
    hd: 1,
    pg: [],
    ca: [],
    cl: [],
    cards: [],
    L: {},
    P: i ? 'P2_' : 'P1_', // prefijo de sus controles
    a,
    b,
    x0,
    vw,
    ks: duo ? 0.56 : 1, // escala de cartas y avisos
    yb: duo ? H - 64 : H - 34,
    col: i ? 0x4fc3ff : 0xffc21a,
  };
  for (const u of UP) w.L[u[0]] = 0;
  const o = (w.o = {});

  o.water = sc.add.tileSprite(cx, 300, b - a, H, 'w');

  // Orillas con selva
  const g = sc.add.graphics().setDepth(1);
  const sd = duo ? 5 : 8;
  for (const s of [0, 1]) {
    const bx = s ? b : x0;
    g.fillStyle(0x2c6b2a).fillRect(bx, 0, bk, H);
    g.fillStyle(0xcaa75a).fillRect(s ? b : a - sd, 0, sd, H);
    for (let j = 0; j < (duo ? 24 : 46); j++) {
      g.fillStyle([0x1f5220, 0x3a8a35, 0x2f7a2e, 0x4a9e3f][j % 4], 0.9);
      g.fillCircle(bx + (s ? rnd(sd + 6, bk) : rnd(0, bk - sd - 6)), rnd(0, H), duo ? rnd(6, 11) : rnd(9, 20));
    }
  }

  o.raft = sc.add.image(cx, 430, 'raft').setDepth(4).setVisible(false);
  o.gfx = sc.add.graphics().setDepth(5);
  o.ex = sc.add
    .image(cx, 430, i ? 'ex2' : 'ex')
    .setDepth(6)
    .setRotation(-Math.PI / 2)
    .setVisible(false);

  // HUD (oculto hasta que empieza la partida)
  const n0 = sc.children.list.length;
  const D = (ob) => ob.setDepth(21);
  const R = (x, y, ww, hh, c, al) => D(sc.add.rectangle(x, y, ww, hh, c, al));
  o.hearts = [];
  if (duo) {
    // Compacto: marcador arriba y recursos en una franja abajo
    sc.add.rectangle(cx, 25, vw, 50, 0x061018, 0.75).setDepth(20);
    sc.add.rectangle(cx, 582, vw, 36, 0x061018, 0.75).setDepth(20);
    o.tS = D(T(x0 + 12, 18, '0', 24, css(w.col)).setOrigin(0, 0.5));
    R(cx, 43, 384, 8, 0x12222e);
    o.xpBar = R(x0 + 10, 43, 380, 4, 0x9be36b).setOrigin(0, 0.5);
    o.tL = D(T(cx, 20, '', 13));
    for (let j = 0; j < 6; j++) o.hearts.push(D(sc.add.image(x0 + 388 - j * 17, 18, 'heart').setScale(0.75)));
    o.tC = D(T(x0 + 34, 578, 'x1', 22, '#ff8a1f'));
    R(x0 + 34, 595, 52, 5, 0x12222e);
    o.cBar = R(x0 + 10, 595, 48, 3, 0xff8a1f).setOrigin(0, 0.5);
    D(icon('bomb', x0 + 116, 580, 24));
    o.tB = D(T(x0 + 142, 582, '1', 18));
    R(x0 + 210, 582, 30, 30, 0x12222e, 0.8).setStrokeStyle(2, 0x3d93b0);
    o.iI = D(sc.add.image(x0 + 210, 582, 'bolt').setScale(0.8));
    o.tI = D(T(x0 + 266, 582, '', 11, '#ffe14d'));
    D(icon('pig', x0 + 338, 582, 24, PC[0]));
    o.tN = D(T(x0 + 370, 582, '0', 16));
    w.mk = sc.make.graphics({ add: false }).fillStyle(0xffffff).fillRect(x0, 0, vw, H).createGeometryMask();
  } else {
    sc.add.rectangle(400, 25, W, 50, 0x061018, 0.75).setDepth(20);
    o.tS = D(T(16, 25, '0', 30, '#ffd23f').setOrigin(0, 0.5));
    R(400, 17, 304, 16, 0x12222e).setStrokeStyle(2, 0x3d93b0);
    o.xpBar = R(250, 17, 300, 10, 0x9be36b).setOrigin(0, 0.5);
    o.tL = D(T(400, 38, '', 13));
    for (let j = 0; j < 6; j++) o.hearts.push(D(sc.add.image(782 - j * 24, 25, 'heart')));
    D(T(45, 78, 'COMBO', 13, '#cfe8f2'));
    o.tC = D(T(45, 108, 'x1', 34, '#ff8a1f'));
    R(45, 134, 64, 8, 0x12222e);
    o.cBar = R(15, 134, 60, 4, 0xff8a1f).setOrigin(0, 0.5);
    D(icon('pig', 45, 180, 40, PC[0]));
    o.tN = D(T(45, 212, '0', 20));
    D(icon('bomb', 45, 262, 34));
    o.tB = D(T(45, 292, '1', 20));
    D(T(45, 336, 'ÍTEM', 13, '#cfe8f2'));
    R(45, 376, 56, 56, 0x12222e, 0.8).setStrokeStyle(2, 0x3d93b0);
    o.iI = D(sc.add.image(45, 376, 'bolt').setScale(1.4));
    o.tI = D(T(45, 416, '', 13, '#ffe14d'));
    w.ui = D(sc.add.container(0, 0));
  }
  w.hu = sc.children.list.slice(n0);
  use(w);
  hud();
  w.hu.forEach((ob) => ob.setVisible(false));
  return w;
}

// --- Escena ---

function create() {
  sc = this;
  AC = this.sound.context;
  mkTex();
  mkFx();
  WS = MODE > 1 ? [mkWorld(0, 2), mkWorld(1, 2)] : [mkWorld(0, 1)];

  if (!loaded) {
    loaded = 1;
    store()
      .get(KEY)
      .then((r) => {
        if (r && r.found && Array.isArray(r.value)) {
          best = r.value
            .filter((e) => e && typeof e.n === 'string' && typeof e.s === 'number')
            .slice(0, 5);
          if (BT && BT.active) BT.setText(bestStr());
        }
      })
      .catch(() => {});
  }
  if (MODE) lore();
  else title();
}

function title() {
  GP = 'title';
  const c = (TC = sc.add.container(0, 0).setDepth(30));
  const sun = rays(sc.add.graphics({ x: 400, y: 150 }).setAlpha(0.3));
  c.add(sun);
  sc.tweens.add({ targets: sun, angle: 360, duration: 24000, repeat: -1 });
  // Letras que saltan en ola
  'COCHINOS'.split('').forEach((ch, i) => {
    const t = T(400 + (i - 3.5) * 56, 128, ch, 96, i % 2 ? '#ffb8d6' : '#ff8fbd');
    c.add(t);
    sc.tweens.add({
      targets: t,
      y: 106,
      angle: i % 2 ? 6 : -6,
      duration: 480,
      yoyo: true,
      repeat: -1,
      delay: i * 110,
      ease: 'Sine.easeInOut',
    });
  });
  const t2 = T(400, 212, 'DEL ORINOCO', 48, '#ffd23f');
  const t3 = T(400, 278, 'START 1:  UN JUGADOR', 22, '#ffe9a0');
  const t4 = T(400, 308, 'START 2:  DUELO A PANTALLA PARTIDA', 22, '#9fdcff');
  const don = icon('man', 640, 425, 100);
  const raf = icon('raft', 160, 430, 96);
  const exc = icon('ex', 160, 430, 76).setRotation(-0.5);
  BT = T(400, 566, bestStr(), 15, '#9be36b');
  c.add([
    t2,
    sc.add.rectangle(400, 293, 520, 74, 0x061018, 0.78).setStrokeStyle(3, 0xffd23f),
    t3,
    t4,
    raf,
    exc,
    don,
    T(640, 490, 'Don Chucho', 13, '#cfe8f2'),
    T(400, 352, 'PALANCA: mover la gabarra', 15, '#cfe8f2'),
    T(400, 512, 'Las bombas matan caimanes. Los ítems bajan por el río.', 13, '#cfe8f2'),
    BT,
  ]);
  ['BOMBA', '↑', 'ÍTEM', '←', '↓', '→'].forEach((s, i) => {
    const x = 310 + (i % 3) * 90;
    const y = 398 + ((i / 3) | 0) * 52;
    c.add([
      sc.add.circle(x, y, 22, i === 0 ? 0xff5a3c : i === 2 ? 0x4fc3ff : 0xffc21a).setStrokeStyle(3, 0x061018),
      T(x, y, s, s.length > 1 ? 11 : 24),
    ]);
  });
  c.add(T(400, 488, '↑ ← ↓ →  lanzan la garra en esa dirección', 13, '#cfe8f2'));
  sc.tweens.add({ targets: t2, scale: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  sc.tweens.add({ targets: [t3, t4], scale: 1.07, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  sc.tweens.add({ targets: don, angle: 8, y: 418, duration: 380, yoyo: true, repeat: -1 });
  sc.tweens.add({ targets: [raf, exc], y: 438, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  sc.tweens.add({ targets: exc, rotation: -1.1, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Brillitos alrededor del título
  sc.add
    .particles(0, 0, 'dot', {
      x: { min: 150, max: 650 },
      y: { min: 60, max: 245 },
      speed: { min: 10, max: 50 },
      lifespan: 900,
      frequency: 45,
      scale: { start: 1.3, end: 0 },
      tint: [0xffd23f, 0xff9ec4, 0xffffff],
      blendMode: 'ADD',
    })
    .setDepth(31);
}

function restart(mode) {
  MODE = mode;
  for (const k in hit) delete hit[k];
  sc.scene.restart();
}

function update(time, d) {
  const dt = Math.min(d, 50) / 1000;
  const st = hit.START1 || hit.START2;
  music();

  if (GP === 'title') {
    // START 2 (o cualquier botón del jugador 2) arranca el duelo
    const n = hit.START2 || FB.slice(6).some((b) => hit[b]) ? 2 : anyBtn() ? 1 : 0;
    if (n) return restart(n);
  } else if (GP === 'lore') {
    const n = LT.length;
    const i = LI | 0;
    if (anyBtn()) {
      if (i < n) LI = n;
      else begin();
    } else if (i < n) {
      LI += 36 * dt;
      if ((LI | 0) > i && i % 3 === 0) tone(520 + (i % 5) * 40, 0.03, 'square', 0.025);
    }
    if (GP === 'lore') {
      LX.setText(LT.slice(0, LI | 0));
      LH.setText(LI < n ? 'BOTÓN: saltar' : 'PRESIONA UN BOTÓN PARA EMPEZAR');
      LH.setAlpha(LI < n ? 0.6 : 0.6 + 0.4 * Math.sin(time / 120));
    }
  } else if (GP === 'play') {
    if (st) {
      GP = 'pause';
      PZ = T(400, 300, 'PAUSA', 70, '#ffd23f').setDepth(70);
    }
  } else if (GP === 'pause') {
    if (st) {
      PZ.destroy();
      GP = 'play';
    }
  } else {
    use(WS[0]);
    if (overInput(dt)) return;
  }

  if (GP !== 'pause') {
    for (const w of WS) {
      use(w);
      step(dt, time);
    }
  }
  for (const k in hit) delete hit[k];
}

// Avanza el mundo activo
function step(dt, time) {
  const ph = G.ph;
  G.T += dt;
  G.sn = 0;
  if (ph === 'lvl') return lvl(time);
  water.tilePositionY -= 70 * dt;
  if (ph !== 'play') return river(dt);
  G.t += dt;
  if (two()) {
    const s = Math.ceil(G.tm);
    G.tm -= dt;
    if (Math.ceil(G.tm) < s) G.hd = 1;
    if (G.tm <= 0) return finish('¡TIEMPO!', '#ffd23f');
  }
  player(dt);
  river(dt);
  claws(dt);
  if (G.cb && (G.ct -= dt) <= 0) {
    G.cb = 0;
    G.hd = 1;
  }
  cBar.scaleX = G.cb ? clamp(G.ct / (2.5 + 1.5 * L.c), 0, 1) : 0;
  if (G.hd) hud();
  if (G.ph === 'play' && G.xp >= G.need && G.lv < MAXLV) levelUp();
}

function rays(g) {
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    g.fillStyle(i % 2 ? 0xffd23f : 0xff8a1f, 0.9);
    g.fillTriangle(0, 0, Math.cos(a) * 560, Math.sin(a) * 560, Math.cos(a + 0.27) * 560, Math.sin(a + 0.27) * 560);
  }
  return g;
}

// Historia que se escribe sola antes de cada partida
function lore() {
  GP = 'lore';
  LI = 0;
  LT = LORE + (two() ? LORE2 : '');
  tone(520, 0.1, 'square', 0.1, 1040);
  const c = (LC = sc.add.container(0, 0).setDepth(40));
  // En duelo el texto es más largo: la ilustración se achica para que quepa
  const d = two();
  const k = d ? 0.66 : 1;
  const y = d ? 108 : 130;
  const don = icon('man', 130, y, 110 * k);
  const pigs = [0, 1, 2].map((i) => icon('pig', 290 + i * 95, y - 10 + (i % 2) * 30 * k, 50 * k, PC[0]));
  LX = T(105, d ? 158 : 205, '', 17, '#f4f7fa').setOrigin(0).setAlign('left').setWordWrapWidth(600).setLineSpacing(3);
  LH = T(400, 578, '', 15, '#ffd23f');
  c.add([
    sc.add.rectangle(400, 300, W, H, 0x061018, 0.88),
    T(400, 44, two() ? 'LA CRECIDA: DUELO' : 'LA CRECIDA', 40, '#ffd23f'),
    don,
    icon('raft', 680, y, 96 * k),
    icon('ex', 680, y, 76 * k).setRotation(Math.PI),
    LX,
    LH,
  ]);
  if (d) c.add([icon('raft', 600, y, 96 * k), icon('ex2', 600, y, 76 * k).setRotation(Math.PI)]);
  c.add(pigs);
  sc.tweens.add({ targets: don, angle: 7, duration: 300, yoyo: true, repeat: -1 });
  pigs.forEach((p, i) =>
    sc.tweens.add({ targets: p, y: p.y + 12, angle: 14, duration: 500 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
  );
}

function begin() {
  sc.tweens.killTweensOf(LC.list);
  LC.destroy();
  GP = 'play';
  for (const w of WS) {
    use(w);
    // El río de adorno se limpia para empezar parejo
    G.pg.concat(G.ca).forEach((o) => o.destroy());
    G.pg = [];
    G.ca = [];
    G.hu.forEach((o) => o.setVisible(true));
    raft.setVisible(true);
    ex.setVisible(true);
    G.ph = 'play';
    hud();
    if (two()) banner('JUGADOR ' + (w.P === 'P1_' ? 1 : 2) + '\n¡3 minutos!', css(w.col));
  }
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.09, 0, i * 0.08));
}

function banner(s, col) {
  const t = T(CX, 210, s, 32, col).setDepth(30).setScale(0);
  sc.tweens.add({ targets: t, scale: G.ks, duration: 450, ease: 'Back.easeOut' });
  sc.tweens.add({ targets: t, alpha: 0, delay: 2800, duration: 500, onComplete: () => t.destroy() });
  shk(350, 0.012);
  tone(110, 0.8, 'sawtooth', 0.16, 55);
}

const mult = () => 1 + Math.min(9, (G.cb / 5) | 0);

function hud() {
  G.hd = 0;
  if (mult() > G.pm) burst(tC.x, tC.y, 0xff8a1f, 18, 200);
  G.pm = mult();
  tS.setText(G.score);
  const mx = G.lv >= MAXLV;
  const s = Math.max(0, Math.ceil(G.tm));
  tL.setText(
    'NIVEL ' +
      (G.lv + 1) +
      '   ' +
      (two() ? ((s / 60) | 0) + ':' + String(s % 60).padStart(2, '0') : mx ? '¡MÁXIMO!' : G.xp + '/' + G.need + ' cochinos'),
  );
  xpBar.scaleX = mx ? 1 : clamp(G.xp / G.need, 0, 1);
  tC.setText('x' + mult());
  tN.setText(G.n);
  tB.setText(G.bm);
  iI.setVisible(G.it > 0);
  if (G.it) iI.setTexture(IK[G.it]);
  tI.setText(G.it ? IN[G.it] : '');
  hearts.forEach((h, i) => h.setVisible(i < 3 + L.l).setTint(i < G.hp ? 0xffffff : 0x333333));
}

// Lista de mejoras en la orilla derecha (solo cabe en un jugador)
function ownUI() {
  if (!G.ui) return;
  G.ui.removeAll(true);
  let y = 78;
  for (const u of UP) {
    const n = L[u[0]];
    if (!n) continue;
    G.ui.add([icon(u[5], 742, y, 28, u[0] === 't' ? PC[n] : u[6]), T(776, y, n, 16, css(RC[u[4]]))]);
    y += 38;
  }
}

// --- Jugador y garras ---

function player(dt) {
  const p = G.P;
  const k = (c) => (held[p + c] ? 1 : 0);
  let mx = k('R') - k('L');
  let my = k('D') - k('U');
  // Garra estilo Isaac: cada botón dispara hacia un lado (2=arriba, 4=izq, 5=abajo, 6=der)
  const sx = k(6) - k(4);
  const sy = k(5) - k(2);
  const f = sx || sy;
  G.cd -= dt;
  G.inv -= dt;
  G.tb -= dt;
  G.sh -= dt;
  if (mx || my) {
    const n = Math.hypot(mx, my);
    const s = 190 * (1 + 0.18 * L.m) * (G.tb > 0 ? 1.8 : 1);
    mx /= n;
    my /= n;
    G.x = clamp(G.x + mx * s * dt, RL + 32, RR - 32);
    G.y = clamp(G.y + my * s * dt, 84, G.yb);
    if (!f) {
      G.fx = mx;
      G.fy = my;
    }
    if (G.tb > 0) P.fi.emitParticleAt(G.x - mx * 28, G.y - my * 28, 2);
    P.wk.emitParticleAt(G.x + rnd(-26, 26), G.y + rnd(-26, 26), 1);
  }
  if ((G.ft -= dt) <= 0) {
    G.ft = 0.12;
    P.sm.emitParticleAt(G.x - G.fx * 16, G.y - G.fy * 16, 1);
    P.wk.emitParticleAt(G.x + rnd(-28, 28), G.y + 30, 1);
  }
  if (G.sh > 0) {
    const a = rnd(0, 6.28);
    burst(G.x + Math.cos(a) * 46, G.y + Math.sin(a) * 46, 0x7fe0ff, 1);
  }
  if (f) {
    const n = Math.hypot(sx, sy);
    G.fx = sx / n;
    G.fy = sy / n;
    if (!G.cl.length && G.cd <= 0) fire();
  }
  if (hit[p + 1] && G.bm > 0) throwBomb();
  if (hit[p + 3] && G.it) useItem();
  raft.setPosition(G.x, G.y);
  ex.setPosition(G.x, G.y);
  ex.rotation = Phaser.Math.Angle.RotateTo(ex.rotation, Math.atan2(G.fy, G.fx), 14 * dt);
  ex.alpha = raft.alpha = G.inv > 0 && ((G.inv * 12) | 0) % 2 ? 0.3 : 1;
}

function throwBomb() {
  const w = G;
  G.bm--;
  G.hd = 1;
  const x = clamp(G.x + G.fx * 120, RL + 20, RR - 20);
  const y = clamp(G.y + G.fy * 120, 70, H - 20);
  const b = sc.add.image(G.x, G.y, 'bomb').setDepth(8);
  tone(300, 0.45, 'square', 0.06, 900);
  sc.tweens.add({
    targets: b,
    x,
    y,
    angle: 360,
    duration: 450,
    ease: 'Cubic.easeOut',
    onUpdate: () => P.fi.emitParticleAt(b.x, b.y - 12, 1),
  });
  sc.tweens.add({
    targets: b,
    scale: 1.8,
    duration: 225,
    yoyo: true,
    onComplete: () => {
      b.destroy();
      // La bomba cae fuera del turno de su mundo: hay que volver a apuntarle
      use(w);
      if (w.ph !== 'over') boom(x, y);
    },
  });
}

function useItem() {
  const i = G.it;
  G.it = 0;
  G.hd = 1;
  pop(G.x, G.y - 40, '¡' + IN[i] + '!', css(ICOL[i]));
  burst(G.x, G.y, ICOL[i], 20, 120);
  [660, 880, 1320].forEach((f, j) => tone(f, 0.14, 'triangle', 0.1, 0, j * 0.06));
  if (i === 1) G.tb = 7;
  else if (i === 2) G.sh = 7;
  else {
    // Red: se lleva todos los cochinos de la pantalla
    fls(250, 255, 255, 255);
    for (const o of G.pg) {
      if (o.dead || o.k > 3) continue;
      collect(o);
    }
  }
}

function fire() {
  const n = 1 + L.n;
  const a0 = Math.atan2(G.fy, G.fx);
  const sz = 1 + 0.35 * L.z;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * 0.3;
    G.cl.push({
      im: sc.add.image(G.x, G.y, 'claw').setDepth(7).setScale(sz).setRotation(a),
      a,
      d: 0,
      st: 0,
      hp: 1 + 2 * L.p,
      pg: [],
    });
  }
  G.cd = 0.1;
  P.sp.emitParticleAt(G.x + G.fx * 30, G.y + G.fy * 30, 5);
  tone(220, 0.1, 'sawtooth', 0.06, 520);
}

function claws(dt) {
  gfx.clear();
  if (L.g) gfx.lineStyle(2, 0xff6b6b, 0.25).strokeCircle(G.x, G.y, 60 + 45 * L.g);
  if (G.sh > 0 && (G.sh > 1.5 || ((G.sh * 10) | 0) % 2)) {
    gfx.fillStyle(0x7fe0ff, 0.18).fillCircle(G.x, G.y, 46);
    gfx.lineStyle(4, 0x7fe0ff, 0.9).strokeCircle(G.x, G.y, 46);
  }
  const sp = 520 * (1 + 0.3 * L.v);
  const rg = 170 * (1 + 0.3 * L.r);
  const sz = 15 * (1 + 0.35 * L.z);
  for (const c of G.cl) {
    c.d += (c.st ? -1.5 : 1) * sp * dt;
    if (c.d >= rg) c.st = 1;
    const x = G.x + Math.cos(c.a) * c.d;
    const y = G.y + Math.sin(c.a) * c.d;
    if (x < RL || x > RR || y < 50 || y > H) c.st = 1;
    c.im.setPosition(x, y);
    if (!c.st) P.wk.emitParticleAt(x, y, 1);
    gfx.lineStyle(7, 0x061018).lineBetween(G.x, G.y, x, y);
    gfx.lineStyle(3, G.col).lineBetween(G.x, G.y, x, y);

    if (c.hp > 0) {
      for (const o of G.pg) {
        if (o.dead || o.h || Math.hypot(o.x - x, o.y - y) > sz + 16) continue;
        o.h = c;
        P.sp.emitParticleAt(o.x, o.y, 4);
        o.setDepth(7);
        c.pg.push(o);
        if (G.sn++ < 3) tone(660, 0.05, 'square', 0.05);
        if (--c.hp <= 0) {
          c.st = 1;
          break;
        }
      }
    }
    for (const k of G.ca) {
      if (k.dead || Math.abs(k.x - x) > sz + 14 || Math.abs(k.y - y) > sz + 36) continue;
      // La garra rebota contra los caimanes: solo las bombas y el escudo los matan
      if (!c.st) {
        c.st = 1;
        tone(900, 0.06, 'square', 0.08, 300);
        burst(x, y, 0xffe14d, 10, 140);
        P.sp.emitParticleAt(x, y, 4);
      }
    }
    c.pg.forEach((o, i) => {
      const r = Math.min(sz, 4 + i * 3);
      o.x = x + Math.cos(i * 2.4) * r;
      o.y = y + Math.sin(i * 2.4) * r;
    });
    if (c.st && c.d <= 0) {
      c.pg.forEach(collect);
      c.im.destroy();
      c.dead = 1;
    }
  }
  G.cl = G.cl.filter((c) => !c.dead);
}

function collect(o) {
  if (o.dead) return;
  o.dead = 1;
  o.destroy();
  if (o.k > 3) {
    const i = o.k - 4;
    if (i > 3) G.hp = Math.min(3 + L.l, G.hp + 1);
    else if (i) G.it = i;
    else G.bm = Math.min(9, G.bm + 1);
    G.hd = 1;
    burst(o.x, o.y, ICOL[i], 18, 160);
    P.rg.emitParticleAt(o.x, o.y, 1);
    pop(o.x, o.y - 10, IN[i], css(ICOL[i]));
    tone(700, 0.2, 'triangle', 0.12, 1400);
    return;
  }
  const v = PV[o.k] * mult();
  G.score += v;
  G.n++;
  G.xp++;
  G.cb++;
  G.ct = 2.5 + 1.5 * L.c;
  G.hd = 1;
  burst(o.x, o.y, PC[o.k], 6, 40);
  P.sp.emitParticleAt(o.x, o.y, 4);
  P.rg.emitParticleAt(o.x, o.y, 1);
  // Los cochinos finos revientan en estrellas
  if (o.k > 1) burst(o.x, o.y, o.k > 2 ? ICOL[(Math.random() * 4) | 0] : 0xffd23f, 16, 200);
  pop(o.x, o.y - 10, '+' + v, PS[o.k]);
  if (G.sn++ < 3) tone(500 + Math.min(G.cb, 24) * 30 + o.k * 120, 0.08, 'square', 0.07);
}

function kill(c) {
  if (c.dead) return;
  c.dead = 1;
  c.destroy();
  const v = 5 * mult();
  G.score += v;
  G.hd = 1;
  burst(c.x, c.y, 0x55b54a, 18, 160);
  burst(c.x, c.y, 0xff5a5a, 6);
  P.sp.emitParticleAt(c.x, c.y, 12);
  P.rg.emitParticleAt(c.x, c.y, 1);
  pop(c.x, c.y, '+' + v, '#9be36b');
  tone(300, 0.2, 'sawtooth', 0.12, 80);
}

function boom(x, y) {
  const R = 100 + 25 * L.d;
  const r = sc.add.circle(x, y, R, 0xffa52e, 0.6).setDepth(8).setScale(0.1);
  sc.tweens.add({ targets: r, scale: 1, alpha: 0, duration: 400, onComplete: () => r.destroy() });
  P.fi.emitParticleAt(x, y, 45);
  P.sm.emitParticleAt(x, y, 14);
  P.sp.emitParticleAt(x, y, 26);
  P.rg.emitParticleAt(x, y, 1);
  burst(x, y, 0xffd23f, 20, R);
  shk(180, 0.012);
  tone(160, 0.4, 'sawtooth', 0.2, 40);
  for (const c of G.ca) if (Math.hypot(c.x - x, c.y - y) < R + 20) kill(c);
  for (const o of G.pg) if (o.k < 4 && Math.hypot(o.x - x, o.y - y) < R) collect(o);
}

function wreck(n) {
  burst(G.x, G.y, 0xff8a1f, 40, 200);
  P.fi.emitParticleAt(G.x, G.y, n);
  P.sm.emitParticleAt(G.x, G.y, 20);
  P.sp.emitParticleAt(G.x, G.y, 30);
  P.rg.emitParticleAt(G.x, G.y, 1);
  tone(400, 0.9, 'sawtooth', 0.2, 40);
}

function hurt() {
  G.hp--;
  G.inv = 1.6;
  G.cb = 0;
  G.hd = 1;
  shk(300, 0.02);
  fls(200, 255, 60, 60);
  tone(180, 0.4, 'sawtooth', 0.22, 50);
  burst(G.x, G.y, 0xffc21a, 14, 90);
  burst(G.x, G.y, 0xb5773a, 16, 200);
  P.sp.emitParticleAt(G.x, G.y, 12);
  if (G.hp > 0) return;
  if (!two()) return over();
  // En duelo, quedarte sin vidas te saca de la partida: conservas tus puntos y el rival sigue
  wreck(60);
  finish('¡HUNDIDO!', '#ff5a5a');
}

// --- Río: cochinos y caimanes ---

function river(dt) {
  const play = G.ph === 'play';
  const demo = G.ph === 'demo';
  const fury = G.lv >= FURY;
  const MR = L.g ? 60 + 45 * L.g : 0;

  if ((G.ps -= dt) <= 0 && G.pg.length < 150) {
    G.ps = demo ? 0.4 : 0.8 / ((1 + 0.35 * L.f) * (1 + G.t / 160));
    const t = demo ? 3 : L.t;
    const r = Math.random();
    let k = 0;
    if (r < 0.3 * t) k = 1;
    if (t > 1 && r < 0.1 * t) k = 2;
    if (t > 2 && r < 0.04) k = 3;
    const o = sc.add.image(rnd(RL + 24, RR - 24), -20, 'pig').setTint(PC[k]).setDepth(2);
    o.k = k;
    o.vy = rnd(55, 95) * (1 + G.t / 240);
    o.ph = rnd(0, 6.28);
    G.pg.push(o);
  }

  if (play && (G.is -= dt) <= 0) {
    G.is = rnd(9, 15) / (1 + 0.3 * L.h);
    // 5% corazón (rarísimo), 52% bomba, el resto un ítem especial
    const r = Math.random();
    const i = r < 0.05 ? 4 : r < 0.57 ? 0 : 1 + ((Math.random() * 3) | 0);
    const o = sc.add.image(rnd(RL + 30, RR - 30), -20, IK[i]).setDepth(2);
    o.k = 4 + i;
    o.vy = 70;
    o.ph = rnd(0, 6.28);
    G.pg.push(o);
  }

  if ((G.t > 6 || demo) && (G.cs -= dt) <= 0) {
    // Desde el nivel 20 salen el doble de caimanes y casi todos son de los rojos
    G.cs = Math.max(1.1, 5.5 - G.t / 28) * (fury ? 0.5 : 1);
    // Tipos: 0 verde, 1 rojo (rápido), 2 negro (el más feroz: más grande, veloz y te persigue de verdad)
    const r = Math.random();
    const ty = G.t > 110 && r < (fury ? 0.25 : 0.12) ? 2 : r < (fury ? 0.7 : G.t > 70 ? 0.35 : 0) ? 1 : 0;
    const c = sc.add.image(rnd(RL + 30, RR - 30), -45, 'cai').setDepth(3);
    if (ty) c.setTint(ty > 1 ? 0x6a5a8a : 0xff8866).setScale(ty > 1 ? 1.25 : 1);
    c.vy = (75 + Math.min(90, G.t * 0.5) + rnd(0, 30)) * [1, 1.5, 1.85][ty];
    c.sv = [45, 90, 170][ty];
    c.vx = 0;
    c.ph = rnd(0, 6.28);
    G.ca.push(c);
  }

  for (const o of G.pg) {
    if (o.dead || o.h) continue;
    o.y += o.vy * dt;
    o.x = clamp(o.x + Math.cos(G.T * 2 + o.ph) * 22 * dt, RL + 18, RR - 18);
    o.angle = Math.sin(G.T * 4 + o.ph) * 10;
    if (Math.random() < 0.05) P.wk.emitParticleAt(o.x, o.y + 14, 1);
    if (o.k > 1 && Math.random() < 0.18) {
      burst(o.x + rnd(-14, 14), o.y + rnd(-14, 14), o.k > 3 ? ICOL[o.k - 4] : o.k > 2 ? 0xffffff : 0xffd23f, 1);
    }
    if (o.k === 3) o.setTint(Phaser.Display.Color.HSVToRGB((G.T * 0.7 + o.ph) % 1, 0.65, 1).color);
    if (o.k > 3) o.setScale(1.25 + 0.2 * Math.sin(G.T * 7));
    if (play) {
      const dx = G.x - o.x;
      const dy = G.y - o.y;
      const r = Math.hypot(dx, dy);
      if (r < 38) collect(o);
      else if (r < MR) {
        const p = ((90 + 30 * L.g) * dt) / r;
        o.x += dx * p;
        o.y += dy * p;
      }
    }
    if (o.y > H + 24) {
      o.dead = 1;
      o.destroy();
    }
  }

  for (const c of G.ca) {
    if (c.dead) continue;
    if (play && c.y < G.y) c.vx += (Math.sign(G.x - c.x) * c.sv - c.vx) * dt * 2;
    c.x = clamp(c.x + c.vx * dt, RL + 18, RR - 18);
    c.y += c.vy * dt;
    c.rotation = Math.atan2(c.vy, c.vx) - Math.PI / 2 + Math.sin(G.T * 8 + c.ph) * 0.08;
    if (Math.random() < 0.5) P.wk.emitParticleAt(c.x + rnd(-8, 8), c.y - 30, 1);
    if (play && Math.abs(c.x - G.x) < 34 && Math.abs(c.y - G.y) < 54) {
      // Con el escudo, el caimán que te toca sale perdiendo
      if (G.sh > 0) kill(c);
      else if (G.inv <= 0) hurt();
    }
    if (c.dead) continue;
    // Los caimanes se comen a los cochinos que alcanzan
    for (const o of G.pg) {
      if (!o.dead && !o.h && o.k < 4 && Math.abs(o.x - c.x) < 20 && Math.abs(o.y - c.y - 26) < 20) {
        o.dead = 1;
        o.destroy();
        burst(o.x, o.y, 0xff5a5a, 5);
        P.sp.emitParticleAt(o.x, o.y, 6);
      }
    }
    if (c.y > H + 50) {
      c.dead = 1;
      c.destroy();
    }
  }

  G.pg = G.pg.filter((o) => !o.dead);
  G.ca = G.ca.filter((c) => !c.dead);
}

// --- Mejoras ---

function levelUp() {
  const w = G;
  const ks = G.ks;
  const mid = G.x0 + G.vw / 2;
  const pool = Phaser.Utils.Array.Shuffle(UP.filter((u) => L[u[0]] < u[3])).slice(0, 3);
  G.xp -= G.need;
  G.lv++;
  G.need = 4 + G.lv * 4;
  hud();
  if (!pool.length) {
    G.score += 100;
    return;
  }
  G.ph = 'lvl';
  G.rdy = 0;
  G.sel = pool.length > 1 ? 1 : 0;

  const o = (G.ov = sc.add.container(0, 0).setDepth(50));
  // En duelo todo el espectáculo se recorta a la mitad del jugador
  if (G.mk) o.setMask(G.mk);
  const dark = sc.add.rectangle(mid, 300, G.vw, H, 0x061018, 0);
  const sun = rays(sc.add.graphics({ x: mid, y: 280 }).setScale(0));
  const fl = sc.add.rectangle(mid, 300, G.vw, H, 0xffffff, 0.9);
  const tt = T(mid, 280, '¡MEJORA!', 96, '#fff36b')
    .setScale(6 * ks)
    .setAlpha(0);
  o.add([dark, sun, fl, tt]);
  // En duelo hay 5 segundos para elegir; si se acaban, sale una carta al azar
  G.cn = two() ? T(mid, 500, '', 44, '#ffd23f') : 0;
  if (G.cn) o.add(G.cn);

  sc.tweens.add({ targets: dark, fillAlpha: 0.82, duration: 300 });
  sc.tweens.add({ targets: fl, alpha: 0, duration: 350 });
  sc.tweens.add({ targets: sun, angle: 360, duration: 9000, repeat: -1 });
  sc.tweens.add({ targets: sun, scale: 1, duration: 500, ease: 'Back.easeOut' });
  sc.tweens.add({ targets: sun, alpha: 0.22, delay: 850, duration: 400 });
  sc.tweens.add({ targets: tt, scale: ks, alpha: 1, duration: 320, ease: 'Back.easeOut' });
  sc.tweens.add({ targets: tt, y: 96, scale: 0.55 * ks, delay: 850, duration: 350, ease: 'Cubic.easeInOut' });
  shk(260, 0.012);
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.16, 'square', 0.09, 0, i * 0.07));

  // Lluvia de cochinos
  for (let i = 0; i < 28; i++) {
    const p = sc.add.image(mid, 280, 'pig').setTint(PC[i % 4 === 3 ? 2 : i % 2]).setScale(0.3);
    const a = rnd(0, 6.28);
    o.add(p);
    sc.tweens.add({
      targets: p,
      x: mid + Math.cos(a) * rnd(380, 560),
      y: 280 + Math.sin(a) * rnd(300, 460),
      angle: rnd(-540, 540),
      scale: rnd(1, 1.8),
      duration: rnd(700, 1100),
      ease: 'Cubic.easeOut',
      onComplete: () => p.destroy(),
    });
  }

  G.cf = sc.add
    .particles(0, 0, 'dot', {
      x: { min: G.x0, max: G.x0 + G.vw },
      y: -10,
      speedY: { min: 120, max: 300 },
      lifespan: 3200,
      frequency: 30 / ks,
      scale: { min: 0.8, max: 1.6 },
      tint: PC.concat(RC),
    })
    .setDepth(51);
  sc.time.delayedCall(950, () => {
    use(w);
    pool.forEach(card);
  });
  sc.time.delayedCall(1500 + pool.length * 140, () => {
    w.rdy = 1;
    w.le = w.T + 5;
  });
}

function card(u, i, all) {
  const [k, nm, ds, mx, rar, ic, tint] = u;
  const col = RC[rar];
  const ks = G.ks;
  const c = sc.add.container(CX + (i - (all.length - 1) / 2) * 230 * ks, 780).setDepth(52);
  const bg = sc.add.graphics();
  bg.fillStyle(0x12222e).fillRoundedRect(-100, -140, 200, 280, 14);
  bg.fillStyle(col, 0.28).fillRoundedRect(-100, -140, 200, 44, { tl: 14, tr: 14, bl: 0, br: 0 });
  bg.lineStyle(5, col).strokeRoundedRect(-100, -140, 200, 280, 14);
  c.gl = sc.add.rectangle(0, 0, 222, 302, col, 0);
  c.u = u;
  c.add([
    c.gl,
    bg,
    T(0, -118, RN[rar], 16, css(col)),
    sc.add.circle(0, -46, 42, col, 0.22),
    icon(ic, 0, -46, 62, k === 't' ? PC[L.t + 1] : tint),
    T(0, 22, nm, 19),
    T(0, 70, Array.isArray(ds) ? ds[L[k]] : ds, 14, '#cfe8f2'),
    T(0, 118, 'NIVEL ' + (L[k] + 1) + '/' + mx, 14, css(col)),
  ]);
  c.setScale(0, ks);
  if (G.mk) c.setMask(G.mk);
  G.cards.push(c);
  sc.tweens.add({ targets: c, y: 335, scaleX: ks, duration: 480, delay: i * 140, ease: 'Back.easeOut' });
  tone(880 + i * 220, 0.12, 'triangle', 0.12, 0, i * 0.14 + 0.2);
}

function lvl(time) {
  if (!G.rdy) return;
  const p = G.P;
  const n = G.cards.length;
  const d = (hit[p + 'R'] ? 1 : 0) - (hit[p + 'L'] ? 1 : 0);
  if (d) {
    G.sel = (G.sel + d + n) % n;
    tone(700, 0.04, 'square', 0.06);
  }
  G.cards.forEach((c, i) => {
    const s = i === G.sel;
    c.setScale(G.ks * (s ? 1.1 : 0.9)).setAlpha(s ? 1 : 0.55);
    c.y = s ? 322 + Math.sin(time / 160) * 6 : 338;
    c.gl.setFillStyle(c.gl.fillColor, s ? 0.4 + 0.25 * Math.sin(time / 90) : 0);
  });
  if (G.cn) {
    const left = G.le - G.T;
    G.cn.setText(Math.ceil(left)).setScale(1 + (left % 1) * 0.3);
    if (left <= 0) {
      G.sel = (Math.random() * n) | 0;
      return pick();
    }
  }
  // Cada jugador confirma con cualquiera de sus seis botones
  if ([1, 2, 3, 4, 5, 6].some((b) => hit[p + b])) pick();
}

function pick() {
  const w = G;
  const s = G.cards[G.sel];
  const u = s.u;
  L[u[0]]++;
  if (u[0] === 'l') G.hp = 3 + L.l;
  if (u[0] === 'd') G.bm = Math.min(9, G.bm + 2);
  G.rdy = 0;
  G.cards.forEach((c, i) =>
    sc.tweens.add(
      c === s
        ? { targets: c, scale: 1.7 * G.ks, alpha: 0, duration: 420, ease: 'Cubic.easeOut' }
        : { targets: c, y: 820, angle: i < G.sel ? -25 : 25, duration: 380, ease: 'Cubic.easeIn' },
    ),
  );
  burst(s.x, s.y, RC[u[4]], two() ? 14 : 34, 220, 53);
  fls(180, 255, 255, 255);
  [784, 988, 1175].forEach((f) => tone(f, 0.3, 'triangle', 0.09));
  sc.tweens.add({ targets: G.ov, alpha: 0, duration: 420 });
  sc.time.delayedCall(440, () => {
    use(w);
    sc.tweens.killTweensOf(G.ov.list);
    G.ov.destroy();
    G.cards.forEach((c) => c.destroy());
    G.cards = [];
    G.cf.destroy();
    G.inv = Math.max(G.inv, 1);
    G.ph = 'play';
    ownUI();
    if (G.lv === FURY) {
      water.setTint(0xffb4a8);
      banner('¡NIVEL 20!\nLOS CAIMANES SE ENFURECEN', '#ff5a5a');
    }
    if (G.lv === MAXLV) banner('¡NIVEL MÁXIMO!\nAhora solo importan los puntos', '#ffd23f');
    hud();
  });
}

// --- Fin de partida ---

// Saca la excavadora del río del mundo activo
function retire() {
  G.ph = 'over';
  ex.setVisible(false);
  raft.setVisible(false);
  gfx.clear();
  G.cl.forEach((c) => c.im.destroy());
  G.cl = [];
  G.pg.forEach((o) => (o.h = 0));
  hud();
}

function over() {
  retire();
  wreck(60);
  GP = 'end';
  G.w = 1;

  G.q = G.score > 0 && (best.length < 5 || G.score > best[best.length - 1].s);
  sc.add.rectangle(400, 300, W, H, 0x061018, 0.8).setDepth(50);
  T(400, 120, '¡TE HUNDISTE!', 62, '#ff5a5a').setDepth(51);
  T(400, 200, G.score + ' PUNTOS', 40, '#ffd23f').setDepth(51);
  T(400, 248, 'Cochinos ' + G.n + '    Nivel ' + (G.lv + 1) + '    Tiempo ' + (G.t | 0) + 's', 16, '#cfe8f2').setDepth(51);
  T(400, 540, bestStr(), 15, '#9be36b').setDepth(51);
  if (G.q) {
    T(400, 320, '¡NUEVO RÉCORD!  TUS INICIALES', 20, '#9be36b').setDepth(51);
    G.nt = T(400, 390, '', 56).setDepth(51);
    T(400, 450, 'PALANCA ARRIBA/ABAJO: letra     BOTÓN: confirmar', 14, '#cfe8f2').setDepth(51);
    G.nm = [0, 0, 0];
    G.ni = 0;
    drawName();
  } else {
    const t = T(400, 380, 'PRESIONA START', 28).setDepth(51);
    sc.tweens.add({ targets: t, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
  }
}

// Duelo: este jugador terminó (se le acabó el reloj o se hundió); cuando terminan los dos se anuncia al ganador
function finish(msg, mc) {
  retire();
  sc.add.rectangle(G.x0 + G.vw / 2, 300, G.vw, H, 0x061018, 0.7).setDepth(50);
  T(CX, 130, msg, 44, mc).setDepth(51);
  T(CX, 180, G.score + ' puntos', 22).setDepth(51);
  tone(880, 0.5, 'triangle', 0.14, 220);
  if (WS.some((w) => w.ph !== 'over')) return;

  const a = WS[0].score;
  const b = WS[1].score;
  const win = a === b ? -1 : a > b ? 0 : 1;
  const col = win < 0 ? 0xffffff : WS[win].col;
  GP = 'end';
  WS[0].w = 1.5;
  WS[0].q = 0;
  sc.add.rectangle(400, 320, 600, 230, 0x061018, 0.94).setStrokeStyle(5, col).setDepth(60);
  const t = T(400, 262, win < 0 ? '¡EMPATE!' : '¡GANA EL JUGADOR ' + (win + 1) + '!', 44, css(col)).setDepth(61);
  T(240, 330, 'JUGADOR 1\n' + a, 26, css(WS[0].col)).setDepth(61);
  T(560, 330, 'JUGADOR 2\n' + b, 26, css(WS[1].col)).setDepth(61);
  T(400, 330, 'VS', 22).setDepth(61);
  const s = T(400, 402, 'PRESIONA START', 22).setDepth(61);
  sc.tweens.add({ targets: t, scale: 1.1, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  sc.tweens.add({ targets: s, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
  P.cf.setParticleTint(col);
  P.cf.emitParticleAt(400, 262, 60);
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, 0, i * 0.1));
}

function drawName() {
  G.nt.setText(
    G.nm
      .map((v, i) => {
        const ch = String.fromCharCode(65 + v);
        return i === G.ni ? '[' + ch + ']' : ' ' + ch + ' ';
      })
      .join(''),
  );
}

// Devuelve true si reinició la escena
function overInput(dt) {
  if ((G.w -= dt) > 0) return;
  if (!G.q) {
    if (anyBtn()) return restart(0), true;
    return;
  }
  const d = (ax('D') ? 1 : 0) - (ax('U') ? 1 : 0);
  if (d) {
    G.nm[G.ni] = (G.nm[G.ni] + d + 26) % 26;
    tone(700, 0.04, 'square', 0.06);
  }
  if (anyBtn()) {
    tone(880, 0.08, 'square', 0.08);
    if (++G.ni > 2) {
      best.push({ n: G.nm.map((v) => String.fromCharCode(65 + v)).join(''), s: G.score });
      best.sort((a, b) => b.s - a.s);
      best = best.slice(0, 5);
      store()
        .set(KEY, best)
        .catch(() => {});
      return restart(0), true;
    }
  }
  drawName();
}
