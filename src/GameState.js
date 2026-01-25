export const BOARD_SIZE = 10;

// Directions: 0=N, 1=E, 2=S, 3=W (y grows downward)
export const DIR = Object.freeze({ N: 0, E: 1, S: 2, W: 3 });
export const dirDx = [0, 1, 0, -1];
export const dirDy = [-1, 0, 1, 0];

export const PIECE = Object.freeze({
  SPHINX: "Sphinx",
  PHARAOH: "Pharaoh",
  ANUBIS: "Anubis",
  SCARAB: "Scarab",
  PYRAMID: "Pyramid",
});

export function oppositeDir(d) {
  return (d + 2) % 4;
}

export function inBounds(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function makeEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

function cloneState(state) {
  // structuredClone is supported in modern browsers; fallback keeps it simple.
  if (typeof structuredClone === "function") return structuredClone(state);
  return JSON.parse(JSON.stringify(state));
}

function randInt(rng, n) {
  return Math.floor(rng() * n);
}

function pickRandom(rng, arr) {
  return arr[randInt(rng, arr.length)];
}

function mirrorPos({ x, y }) {
  return { x: BOARD_SIZE - 1 - x, y: BOARD_SIZE - 1 - y };
}

function mirrorRot(rot) {
  // central symmetry = rotation + 180°
  return (rot + 2) % 4;
}

function placePiece(state, piece) {
  const { x, y, id } = piece;
  if (!inBounds(x, y)) throw new Error("Out of bounds placement");
  if (state.board[y][x] !== null) throw new Error("Cell occupied");
  state.pieces[id] = piece;
  state.board[y][x] = id;
}

function removePieceAt(state, x, y) {
  const id = state.board[y][x];
  if (!id) return null;
  state.board[y][x] = null;
  state.pieces[id].alive = false;
  return id;
}

export function createInitialState({ rng = Math.random } = {}) {
  const state = {
    size: BOARD_SIZE,
    ply: 0, // number of half-turns played
    currentPlayer: 0,
    winner: null, // 0 | 1 | "draw" | null
    board: makeEmptyBoard(),
    pieces: {}, // id -> piece
    players: [
      {
        pyramidsAvailable: 7,
        incomingPyramids: [], // array of remainingTurns integers (decremented at end of owner's turns)
        swapCooldown: { pharaoh: 0, sphinx: 0 }, // decremented at begin of owner's turns
      },
      {
        pyramidsAvailable: 7,
        incomingPyramids: [],
        swapCooldown: { pharaoh: 0, sphinx: 0 },
      },
    ],
    meta: {
      lastLaser: null, // { path: [{x,y}], destroyedIds: [], stoppedBy: "shield"|"out"|"loop" }
    },
  };

  // Player 0: Sphinx on first line (y=0), random col, laser horizontal facing side with most cells.
  const sphinxCol0 = randInt(rng, BOARD_SIZE);
  const sphinxRot0 = sphinxCol0 <= 4 ? DIR.E : DIR.W;
  const sphinx0 = {
    id: "p0-sphinx",
    type: PIECE.SPHINX,
    player: 0,
    x: sphinxCol0,
    y: 0,
    rot: sphinxRot0,
    alive: true,
  };
  placePiece(state, sphinx0);

  // Player 1: central symmetry placement.
  const sphinxPos1 = mirrorPos({ x: sphinxCol0, y: 0 });
  const sphinxRot1 = sphinxPos1.x <= 4 ? DIR.E : DIR.W;
  const sphinx1 = {
    id: "p1-sphinx",
    type: PIECE.SPHINX,
    player: 1,
    x: sphinxPos1.x,
    y: sphinxPos1.y,
    rot: sphinxRot1,
    alive: true,
  };
  placePiece(state, sphinx1);

  // Pharaoh: player 0 random on 3rd line (y=2) excluding specified columns.
  const forbidden = new Set([0, BOARD_SIZE - 1, sphinxCol0, sphinxPos1.x]);
  const candidates = [];
  for (let x = 0; x < BOARD_SIZE; x++) if (!forbidden.has(x)) candidates.push(x);
  const pharaohCol0 = pickRandom(rng, candidates);
  const pharaoh0 = {
    id: "p0-pharaoh",
    type: PIECE.PHARAOH,
    player: 0,
    x: pharaohCol0,
    y: 2,
    rot: 0,
    alive: true,
  };
  placePiece(state, pharaoh0);

  const pharaohPos1 = mirrorPos({ x: pharaohCol0, y: 2 });
  const pharaoh1 = {
    id: "p1-pharaoh",
    type: PIECE.PHARAOH,
    player: 1,
    x: pharaohPos1.x,
    y: pharaohPos1.y,
    rot: 0,
    alive: true,
  };
  placePiece(state, pharaoh1);

  // Anubis: first on 5th line (y=4) same column as Pharaoh, facing opponent.
  const anubisA0 = {
    id: "p0-anubisA",
    type: PIECE.ANUBIS,
    player: 0,
    x: pharaohCol0,
    y: 4,
    rot: DIR.S,
    alive: true,
  };
  placePiece(state, anubisA0);

  const anubisAPos1 = mirrorPos({ x: pharaohCol0, y: 4 });
  const anubisA1 = {
    id: "p1-anubisA",
    type: PIECE.ANUBIS,
    player: 1,
    x: anubisAPos1.x,
    y: anubisAPos1.y,
    rot: DIR.N,
    alive: true,
  };
  placePiece(state, anubisA1);

  // Second Anubis: on 3rd line (y=2), column of opponent's sphinx, facing opponent.
  const anubisB0 = {
    id: "p0-anubisB",
    type: PIECE.ANUBIS,
    player: 0,
    x: sphinxPos1.x,
    y: 2,
    rot: DIR.S,
    alive: true,
  };
  // If Pharaoh happened to take this cell (should be prevented by forbidden columns), it would collide.
  placePiece(state, anubisB0);

  const anubisBPos1 = mirrorPos({ x: sphinxPos1.x, y: 2 });
  const anubisB1 = {
    id: "p1-anubisB",
    type: PIECE.ANUBIS,
    player: 1,
    x: anubisBPos1.x,
    y: anubisBPos1.y,
    rot: DIR.N,
    alive: true,
  };
  placePiece(state, anubisB1);

  // Scarab: randomly on 4th line (y=3) with random orientation (0-3). Mirror by central symmetry.
  const scarabCandidates = [];
  for (let x = 0; x < BOARD_SIZE; x++) if (state.board[3][x] === null) scarabCandidates.push(x);
  const scarabCol0 = pickRandom(rng, scarabCandidates);
  const scarabRot0 = randInt(rng, 4);
  const scarab0 = {
    id: "p0-scarab",
    type: PIECE.SCARAB,
    player: 0,
    x: scarabCol0,
    y: 3,
    rot: scarabRot0,
    alive: true,
  };
  placePiece(state, scarab0);

  const scarabPos1 = mirrorPos({ x: scarabCol0, y: 3 });
  const scarab1 = {
    id: "p1-scarab",
    type: PIECE.SCARAB,
    player: 1,
    x: scarabPos1.x,
    y: scarabPos1.y,
    rot: mirrorRot(scarabRot0),
    alive: true,
  };
  placePiece(state, scarab1);

  return state;
}

export function getPieceById(state, id) {
  return state.pieces[id] ?? null;
}

export function getPieceAt(state, x, y) {
  const id = inBounds(x, y) ? state.board[y][x] : null;
  return id ? state.pieces[id] : null;
}

export function canRotate(type) {
  return (
    type === PIECE.SPHINX ||
    type === PIECE.ANUBIS ||
    type === PIECE.SCARAB ||
    type === PIECE.PYRAMID
  );
}

export function canMove(type) {
  return type === PIECE.ANUBIS || type === PIECE.SCARAB || type === PIECE.PYRAMID;
}

export function getLegalMoveTargets(state, pieceId) {
  const piece = getPieceById(state, pieceId);
  if (!piece || !piece.alive) return [];
  if (piece.player !== state.currentPlayer) return [];
  if (!canMove(piece.type)) return [];

  const targets = [];
  for (let d = 0; d < 4; d++) {
    const nx = piece.x + dirDx[d];
    const ny = piece.y + dirDy[d];
    if (!inBounds(nx, ny)) continue;
    if (state.board[ny][nx] !== null) continue;
    targets.push({ x: nx, y: ny });
  }
  return targets;
}

function orthNeighbors(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ].filter((p) => inBounds(p.x, p.y));
}

export function canPlacePyramidAt(state, x, y) {
  if (!inBounds(x, y)) return false;
  if (state.board[y][x] !== null) return false;
  if (state.players[state.currentPlayer].pyramidsAvailable <= 0) return false;

  // Cannot place orthogonally adjacent to your Pharaoh or ANY Sphinx.
  const neigh = orthNeighbors(x, y);

  let myPharaohId = state.currentPlayer === 0 ? "p0-pharaoh" : "p1-pharaoh";
  const myPharaoh = state.pieces[myPharaohId];
  for (const p of neigh) {
    const pid = state.board[p.y][p.x];
    if (!pid) continue;
    const piece = state.pieces[pid];
    if (piece.type === PIECE.SPHINX) return false;
    if (myPharaoh && piece.id === myPharaoh.id) return false;
  }
  return true;
}

function reflectDirTwoSided(dir, diagonal) {
  // diagonal: "\" or "/"
  if (diagonal === "\\") {
    // S->W, E->N, N->E, W->S
    if (dir === DIR.S) return DIR.W;
    if (dir === DIR.E) return DIR.N;
    if (dir === DIR.N) return DIR.E;
    return DIR.S; // DIR.W
  }
  // "/" : S->E, W->N, N->W, E->S
  if (dir === DIR.S) return DIR.E;
  if (dir === DIR.W) return DIR.N;
  if (dir === DIR.N) return DIR.W;
  return DIR.S; // DIR.E
}

function pyramidDiagonalForRot(rot) {
  return rot % 2 === 0 ? "\\" : "/";
}

function isPyramidReflectiveFace(rot, faceDir) {
  // Reflective faces are two adjacent faces depending on rotation.
  // rot 0: N & W (diagonal "\")
  // rot 1: N & E (diagonal "/")
  // rot 2: S & E (diagonal "\")
  // rot 3: S & W (diagonal "/")
  if (rot === 0) return faceDir === DIR.N || faceDir === DIR.W;
  if (rot === 1) return faceDir === DIR.N || faceDir === DIR.E;
  if (rot === 2) return faceDir === DIR.S || faceDir === DIR.E;
  return faceDir === DIR.S || faceDir === DIR.W;
}

function scarabDiagonalForRot(rot) {
  // Scarab reflects on both sides; rotation toggles diagonal.
  return rot % 2 === 0 ? "\\" : "/";
}

export function traceLaser(state, firingPlayer) {
  const sphinxId = firingPlayer === 0 ? "p0-sphinx" : "p1-sphinx";
  const sphinx = state.pieces[sphinxId];
  if (!sphinx || !sphinx.alive) {
    return { path: [], destroyedIds: [], stoppedBy: "out" };
  }

  let x = sphinx.x;
  let y = sphinx.y;
  let dir = sphinx.rot;

  const path = [];
  const destroyedIds = [];
  const visited = new Set(); // prevent infinite loops: key = "x,y,dir"

  for (let steps = 0; steps < 500; steps++) {
    x += dirDx[dir];
    y += dirDy[dir];

    if (!inBounds(x, y)) {
      return { path, destroyedIds, stoppedBy: "out" };
    }

    const key = `${x},${y},${dir}`;
    if (visited.has(key)) {
      return { path, destroyedIds, stoppedBy: "loop" };
    }
    visited.add(key);

    path.push({ x, y });
    const pid = state.board[y][x];
    if (!pid) continue;

    const piece = state.pieces[pid];
    const hitFace = oppositeDir(dir);

    if (piece.type === PIECE.SPHINX) {
      return { path, destroyedIds, stoppedBy: "shield" };
    }

    if (piece.type === PIECE.ANUBIS) {
      const shieldFace = piece.rot;
      if (hitFace === shieldFace) {
        return { path, destroyedIds, stoppedBy: "shield" };
      }
      // destroyed, beam continues unchanged
      removePieceAt(state, x, y);
      destroyedIds.push(pid);
      continue;
    }

    if (piece.type === PIECE.PHARAOH) {
      removePieceAt(state, x, y);
      destroyedIds.push(pid);
      continue;
    }

    if (piece.type === PIECE.PYRAMID) {
      if (isPyramidReflectiveFace(piece.rot, hitFace)) {
        dir = reflectDirTwoSided(dir, pyramidDiagonalForRot(piece.rot));
        continue;
      }
      // destroyed, beam continues unchanged; pyramid goes to opponent reserve after 1 of opponent's turns.
      const owner = piece.player;
      const opponent = 1 - owner;
      state.players[opponent].incomingPyramids.push(1);
      removePieceAt(state, x, y);
      destroyedIds.push(pid);
      continue;
    }

    if (piece.type === PIECE.SCARAB) {
      dir = reflectDirTwoSided(dir, scarabDiagonalForRot(piece.rot));
      continue;
    }
  }

  return { path, destroyedIds, stoppedBy: "loop" };
}

function computeWinnerFromState(state) {
  const p0Alive = state.pieces["p0-pharaoh"]?.alive !== false;
  const p1Alive = state.pieces["p1-pharaoh"]?.alive !== false;
  if (!p0Alive && !p1Alive) return "draw";
  if (!p0Alive) return 1;
  if (!p1Alive) return 0;

  if (state.ply >= 100) return "draw";
  return null;
}

function beginTurnAdjustments(state) {
  const pl = state.players[state.currentPlayer];
  pl.swapCooldown.pharaoh = Math.max(0, pl.swapCooldown.pharaoh - 1);
  pl.swapCooldown.sphinx = Math.max(0, pl.swapCooldown.sphinx - 1);
}

function endTurnAdjustments(state, playerWhoJustMoved) {
  const pl = state.players[playerWhoJustMoved];
  // unlock incoming pyramids after the player has completed a turn
  const nextIncoming = [];
  for (const t of pl.incomingPyramids) {
    const t2 = t - 1;
    if (t2 <= 0) pl.pyramidsAvailable += 1;
    else nextIncoming.push(t2);
  }
  pl.incomingPyramids = nextIncoming;
}

export function applyAction(state, action) {
  if (state.winner) return { state, events: [{ type: "noop" }] };

  const s = cloneState(state);
  const events = [];
  const player = s.currentPlayer;

  const fail = (msg) => {
    const err = new Error(msg);
    err.code = "INVALID_ACTION";
    throw err;
  };

  let skipFire = false;

  if (action.kind === "move") {
    const piece = getPieceById(s, action.pieceId);
    if (!piece || !piece.alive) fail("Unknown piece");
    if (piece.player !== player) fail("Not your piece");
    if (!canMove(piece.type)) fail("This piece cannot move");
    const targets = getLegalMoveTargets(s, action.pieceId);
    if (!targets.some((t) => t.x === action.toX && t.y === action.toY)) fail("Illegal move");

    // apply move
    s.board[piece.y][piece.x] = null;
    const from = { x: piece.x, y: piece.y };
    piece.x = action.toX;
    piece.y = action.toY;
    s.board[piece.y][piece.x] = piece.id;
    events.push({ type: "move", pieceId: piece.id, from, to: { x: piece.x, y: piece.y } });
  } else if (action.kind === "rotate") {
    const piece = getPieceById(s, action.pieceId);
    if (!piece || !piece.alive) fail("Unknown piece");
    if (piece.player !== player) fail("Not your piece");
    if (!canRotate(piece.type)) fail("This piece cannot rotate");
    const fromRot = piece.rot;
    piece.rot = (piece.rot + (action.delta ?? 1) + 4) % 4;
    events.push({ type: "rotate", pieceId: piece.id, fromRot, toRot: piece.rot });
  } else if (action.kind === "placePyramid") {
    if (!canPlacePyramidAt(s, action.x, action.y)) fail("Cannot place pyramid there");
    const rot = ((action.rot ?? 0) + 4) % 4;
    const id = `p${player}-pyr-${s.ply}-${action.x}-${action.y}`;
    const piece = {
      id,
      type: PIECE.PYRAMID,
      player,
      x: action.x,
      y: action.y,
      rot,
      alive: true,
    };
    s.players[player].pyramidsAvailable -= 1;
    placePiece(s, piece);
    events.push({ type: "place", pieceId: id, at: { x: action.x, y: action.y }, rot });
  } else if (action.kind === "swapScarab") {
    const scarabId = player === 0 ? "p0-scarab" : "p1-scarab";
    const targetId =
      action.target === "pharaoh"
        ? player === 0
          ? "p0-pharaoh"
          : "p1-pharaoh"
        : player === 0
          ? "p0-sphinx"
          : "p1-sphinx";

    const scarab = s.pieces[scarabId];
    const target = s.pieces[targetId];
    if (!scarab || !scarab.alive) fail("No scarab to swap");
    if (!target || !target.alive) fail("No target to swap");

    if (action.target === "pharaoh") {
      if (s.players[player].swapCooldown.pharaoh > 0) fail("Swap with Pharaoh on cooldown");
      s.players[player].swapCooldown.pharaoh = 4;
    } else {
      if (s.players[player].swapCooldown.sphinx > 0) fail("Swap with Sphinx on cooldown");
      s.players[player].swapCooldown.sphinx = 4;
      skipFire = true; // special rule
    }

    // swap positions
    const a = { x: scarab.x, y: scarab.y };
    const b = { x: target.x, y: target.y };

    s.board[a.y][a.x] = target.id;
    s.board[b.y][b.x] = scarab.id;
    scarab.x = b.x;
    scarab.y = b.y;
    target.x = a.x;
    target.y = a.y;

    events.push({ type: "swap", a: scarab.id, b: target.id, aFrom: a, aTo: b, bFrom: b, bTo: a });
  } else {
    fail("Unknown action");
  }

  // Laser resolution (unless skipped by swap-with-sphinx)
  if (!skipFire) {
    const laser = traceLaser(s, player);
    s.meta.lastLaser = laser;
    events.push({ type: "laser", ...laser });
    for (const id of laser.destroyedIds) {
      events.push({ type: "destroy", pieceId: id });
    }
  } else {
    s.meta.lastLaser = null;
    events.push({ type: "laserSkipped" });
  }

  // Determine winner/draw after laser resolution
  s.winner = computeWinnerFromState(s);

  // End of current player's turn: unlock incoming pyramids for that player
  endTurnAdjustments(s, player);

  // Advance turn if game not over
  if (!s.winner) {
    s.ply += 1;
    s.currentPlayer = 1 - player;
    beginTurnAdjustments(s);
  }

  return { state: s, events };
}

