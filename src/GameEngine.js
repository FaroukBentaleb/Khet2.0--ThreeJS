function createPlayer(id) {
  return {
    id,
    pieces: {
      sphinx: null,
      pharaoh: null,
      anubis: [],
      scarab: null,
      pyramids: []  // Track placed pyramids
    },
    reserve: {
      pyramids: 7,
      cooldown: []
    }
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function placeOnBoard(board, piece) {
  board[piece.y][piece.x] = piece;
}

function isCellEmpty(board, x, y) {
  return board[y][x] === null;
}

function placeSphinx(game, player) {
  const y = player.id === 1 ? 0 : 9;
  const x = randomInt(0, 9);

  // Sphinx direction based on position - facing the side with most space
  const direction = x <= 4 ? "RIGHT" : "LEFT";

  const sphinx = {
    type: "SPHINX",
    x,
    y,
    direction,
    owner: player.id
  };

  placeOnBoard(game.board, sphinx);
  return sphinx;
}

function placePharaoh(game, player) {
  const y = player.id === 1 ? 2 : 7;

  const forbidden = new Set([0, 9, player.pieces.sphinx.x]);
  
  // Add opponent's sphinx column if it exists (for player 2)
  const opponent = game.players[player.id === 1 ? "p2" : "p1"];
  if (opponent.pieces.sphinx) {
    forbidden.add(opponent.pieces.sphinx.x);
  }

  let x;
  do {
    x = randomInt(1, 8);
  } while (forbidden.has(x));

  // Pharaoh needs a direction property (vulnerable on all sides, but needs visual orientation)
  const direction = player.id === 1 ? "DOWN" : "UP";

  const pharaoh = {
    type: "PHARAOH",
    x,
    y,
    direction,
    owner: player.id
  };

  placeOnBoard(game.board, pharaoh);
  return pharaoh;
}

function placeAnubis(game, player) {
  const facing = player.id === 1 ? "DOWN" : "UP";

  // Anubis 1: same column as Pharaoh
  const a1 = {
    type: "ANUBIS",
    x: player.pieces.pharaoh.x,
    y: player.id === 1 ? 4 : 5,
    direction: facing,
    owner: player.id
  };

  // Anubis 2: column of opponent Sphinx
  const opponent = game.players[player.id === 1 ? "p2" : "p1"];
  const a2 = {
    type: "ANUBIS",
    x: opponent.pieces.sphinx.x,
    y: player.id === 1 ? 2 : 7,
    direction: facing,
    owner: player.id
  };

  placeOnBoard(game.board, a1);
  placeOnBoard(game.board, a2);

  player.pieces.anubis.push(a1, a2);
}

function placeScarab(game, player) {
  const y = player.id === 1 ? 3 : 6;
  const directions = ["UP", "DOWN", "LEFT", "RIGHT"];

  let x;
  do {
    x = randomInt(0, 9);
  } while (!isCellEmpty(game.board, x, y));

  const scarab = {
    type: "SCARAB",
    x,
    y,
    direction: directions[randomInt(0, 3)],
    owner: player.id
  };

  placeOnBoard(game.board, scarab);
  return scarab;
}

function createEmptyBoard() {
  return Array.from({ length: 10 }, () =>
    Array(10).fill(null)
  );
}

function placeInitialPieces(game) {
  const p1 = game.players.p1;
  const p2 = game.players.p2;

  // Step 1: Place both Sphinxes first (they don't depend on other pieces)
  p1.pieces.sphinx = placeSphinx(game, p1);
  p2.pieces.sphinx = mirrorSphinx(game, p1.pieces.sphinx, p2);

  // Step 2: Place both Pharaohs (now both sphinxes exist)
  p1.pieces.pharaoh = placePharaoh(game, p1);
  p2.pieces.pharaoh = mirrorPharaoh(game, p1.pieces.pharaoh, p2);

  // Step 3: Place both players' Anubis (now both sphinxes and pharaohs exist)
  placeAnubis(game, p1);
  placeAnubis(game, p2);

  // Step 4: Place both Scarabs
  p1.pieces.scarab = placeScarab(game, p1);
  p2.pieces.scarab = mirrorScarab(game, p1.pieces.scarab, p2);
}

function mirrorSphinx(game, originalSphinx, player) {
  const flipDir = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT"
  };

  const mirrored = {
    type: "SPHINX",
    x: 9 - originalSphinx.x,
    y: 9 - originalSphinx.y,
    direction: flipDir[originalSphinx.direction],
    owner: player.id
  };

  placeOnBoard(game.board, mirrored);
  return mirrored;
}

function mirrorPharaoh(game, originalPharaoh, player) {
  const flipDir = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT"
  };

  const mirrored = {
    type: "PHARAOH",
    x: 9 - originalPharaoh.x,
    y: 9 - originalPharaoh.y,
    direction: flipDir[originalPharaoh.direction],
    owner: player.id
  };

  placeOnBoard(game.board, mirrored);
  return mirrored;
}

function mirrorScarab(game, originalScarab, player) {
  const flipDir = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT"
  };

  const mirrored = {
    type: "SCARAB",
    x: 9 - originalScarab.x,
    y: 9 - originalScarab.y,
    direction: flipDir[originalScarab.direction],
    owner: player.id
  };

  placeOnBoard(game.board, mirrored);
  return mirrored;
}

export function initializeGame() {
  const game = {
    board: createEmptyBoard(),
    turnCount: 0,
    currentPlayer: 1,
    players: {
      p1: createPlayer(1),
      p2: createPlayer(2)
    }
  };
  placeInitialPieces(game);

  return game;
}