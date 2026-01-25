import "./style.css";
import { applyAction, canPlacePyramidAt, createInitialState, getLegalMoveTargets } from "./GameState.js";

const CELL = 56; // must match --cell in CSS
const GAP = 2; // must match --gap in CSS

function cellToPx(x, y) {
  return { px: x * (CELL + GAP), py: y * (CELL + GAP) };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function labelForType(type) {
  switch (type) {
    case "Sphinx":
      return "SPHINX";
    case "Pharaoh":
      return "PHARAOH";
    case "Anubis":
      return "ANUBIS";
    case "Scarab":
      return "SCARAB";
    case "Pyramid":
      return "PYRAMID";
    default:
      return type.toUpperCase();
  }
}

function buildUI(root) {
  root.innerHTML = `
    <div class="app">
      <div class="panel">
        <div class="panel__header">
          <div>
            <div class="panel__title">Khet 2.0</div>
            <div class="panel__subtitle">Hover, select, act — laser resolves automatically</div>
          </div>
          <div class="chip" id="turnChip">
            <span class="dot p0" id="turnDot"></span>
            <span id="turnText">Player 1</span>
          </div>
        </div>
        <div class="panel__body">
          <div class="hudRow">
            <div class="chip">
              <span style="color: var(--muted)">Pyramids</span>
              <strong id="pyrCount">7</strong>
              <span style="color: var(--muted)">(locked <span id="pyrLocked">0</span>)</span>
            </div>
            <div class="chip">
              <span style="color: var(--muted)">Ply</span>
              <strong id="ply">0</strong>
            </div>
          </div>

          <div class="btnRow">
            <button class="btn primary" id="modeMove">Move</button>
            <button class="btn primary" id="modeRotate">Rotate</button>
          </div>
          <div class="btnRow">
            <button class="btn" id="modePlace">Place Pyramid</button>
            <button class="btn" id="rotatePyr">Rotate Placed</button>
          </div>
          <div class="btnRow">
            <button class="btn" id="swapPharaoh">Swap with Pharaoh</button>
            <button class="btn" id="swapSphinx">Swap with Sphinx</button>
          </div>

          <div class="status" id="status">Select an action mode, then interact with the board.</div>
          <div class="hint">
            - <b>Move</b>: click one of your movable pieces, then click a green cell.<br/>
            - <b>Rotate</b>: click one of your rotatable pieces to rotate 90°.<br/>
            - <b>Place Pyramid</b>: click a valid empty cell (not adjacent to any Sphinx nor your Pharaoh).<br/>
            - <b>Rotate Placed</b>: while in place mode, rotates the orientation used for placement.
          </div>
          <div class="btnRow">
            <button class="btn danger" id="restart">Restart</button>
            <button class="btn" id="clearSel">Clear selection</button>
          </div>
        </div>
      </div>

      <div class="boardWrap">
        <div class="board">
          <div class="cells" id="cells"></div>
          <canvas class="laser" id="laser"></canvas>
          <div class="pieces" id="pieces"></div>
        </div>
      </div>
    </div>

    <div class="modal" id="modal">
      <div class="modal__card">
        <h2 class="modal__title" id="modalTitle">Game over</h2>
        <p class="modal__desc" id="modalDesc"></p>
        <div class="modal__actions">
          <button class="btn primary" id="modalRestart">Restart</button>
        </div>
      </div>
    </div>
  `;

  const cellsEl = root.querySelector("#cells");
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const el = document.createElement("div");
      el.className = "cell";
      el.dataset.x = String(x);
      el.dataset.y = String(y);
      cellsEl.appendChild(el);
    }
  }

  return {
    turnDot: root.querySelector("#turnDot"),
    turnText: root.querySelector("#turnText"),
    pyrCount: root.querySelector("#pyrCount"),
    pyrLocked: root.querySelector("#pyrLocked"),
    ply: root.querySelector("#ply"),
    status: root.querySelector("#status"),
    cellsEl,
    piecesEl: root.querySelector("#pieces"),
    laser: root.querySelector("#laser"),
    modal: root.querySelector("#modal"),
    modalTitle: root.querySelector("#modalTitle"),
    modalDesc: root.querySelector("#modalDesc"),
    modeMove: root.querySelector("#modeMove"),
    modeRotate: root.querySelector("#modeRotate"),
    modePlace: root.querySelector("#modePlace"),
    rotatePyr: root.querySelector("#rotatePyr"),
    swapPharaoh: root.querySelector("#swapPharaoh"),
    swapSphinx: root.querySelector("#swapSphinx"),
    restart: root.querySelector("#restart"),
    clearSel: root.querySelector("#clearSel"),
    modalRestart: root.querySelector("#modalRestart"),
  };
}

function setupLaserCanvas(canvas) {
  // size it to board inner area: 10 cells + 9 gaps
  const w = 10 * CELL + 9 * GAP;
  canvas.width = w;
  canvas.height = w;
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return ctx;
}

function pathToPoints(path) {
  // path is list of cells entered; draw center-to-center polyline starting from first cell
  const pts = [];
  for (const c of path) {
    const { px, py } = cellToPx(c.x, c.y);
    pts.push({ x: px + CELL / 2, y: py + CELL / 2 });
  }
  return pts;
}

async function animateLaser(ctx, path) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!path || path.length === 0) return;

  const pts = pathToPoints(path);
  const total = pts.length - 1;
  const duration = Math.min(650, 120 + total * 55);
  const start = performance.now();

  const draw = (t) => {
    const now = performance.now();
    const p = Math.min(1, (now - start) / duration);
    const segFloat = p * total;
    const seg = Math.floor(segFloat);
    const segT = segFloat - seg;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = "rgba(255, 92, 122, 0.92)";
    ctx.shadowColor = "rgba(255, 92, 122, 0.55)";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= seg; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (seg + 1 < pts.length) {
      const a = pts[seg];
      const b = pts[seg + 1];
      ctx.lineTo(a.x + (b.x - a.x) * segT, a.y + (b.y - a.y) * segT);
    }
    ctx.stroke();

    if (p < 1) requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
  await sleep(duration + 60);
  // fade out quickly
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function setStatus(ui, text, kind = "neutral") {
  ui.status.textContent = text;
  ui.status.classList.remove("ok", "bad");
  if (kind === "ok") ui.status.classList.add("ok");
  if (kind === "bad") ui.status.classList.add("bad");
}

function flashCell(ui, x, y, cls = "isInvalid", ms = 220) {
  const cell = ui.cellsEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (!cell) return;
  cell.classList.add(cls);
  setTimeout(() => cell.classList.remove(cls), ms);
}

function makePieceEl(piece) {
  const el = document.createElement("div");
  el.className = `piece p${piece.player} piece--${piece.type.toLowerCase()}`;
  el.dataset.id = piece.id;
  el.innerHTML = `
    <div style="display:grid; gap:2px; text-align:center;">
      <div class="piece__label">${labelForType(piece.type)}</div>
      <div class="piece__sub">P${piece.player + 1}</div>
    </div>
  `;
  return el;
}

function setPieceTransform(el, piece) {
  const { px, py } = cellToPx(piece.x, piece.y);
  const rot = piece.rot * 90;
  el.style.setProperty("--tx", `${px}px`);
  el.style.setProperty("--ty", `${py}px`);
  el.style.setProperty("--rot", `${rot}deg`);
  el.style.transform = `translate(${px}px, ${py}px) rotate(${rot}deg)`;
}

function updateModeButtons(ui, mode) {
  for (const b of [ui.modeMove, ui.modeRotate, ui.modePlace]) b.classList.remove("isActive");
  if (mode === "move") ui.modeMove.classList.add("isActive");
  if (mode === "rotate") ui.modeRotate.classList.add("isActive");
  if (mode === "place") ui.modePlace.classList.add("isActive");
}

function render(state, ui, view) {
  ui.ply.textContent = String(state.ply);
  ui.turnText.textContent = state.currentPlayer === 0 ? "Player 1" : "Player 2";
  ui.turnDot.classList.toggle("p0", state.currentPlayer === 0);
  ui.turnDot.classList.toggle("p1", state.currentPlayer === 1);

  ui.pyrCount.textContent = String(state.players[state.currentPlayer].pyramidsAvailable);
  ui.pyrLocked.textContent = String(state.players[state.currentPlayer].incomingPyramids.length);

  // clear cell highlights
  ui.cellsEl.querySelectorAll(".cell.isValid").forEach((c) => c.classList.remove("isValid"));

  // compute valid move targets if needed
  if (view.mode === "move" && view.selectedId) {
    const targets = getLegalMoveTargets(state, view.selectedId);
    for (const t of targets) {
      const cell = ui.cellsEl.querySelector(`.cell[data-x="${t.x}"][data-y="${t.y}"]`);
      if (cell) cell.classList.add("isValid");
    }
  }
  if (view.mode === "place") {
    // show all placeable cells as valid (optional; can be many but only 100)
    ui.cellsEl.querySelectorAll(".cell").forEach((cell) => {
      const x = Number(cell.dataset.x);
      const y = Number(cell.dataset.y);
      if (canPlacePyramidAt(state, x, y)) cell.classList.add("isValid");
    });
  }

  // pieces create/update/remove (with destroy fade)
  const aliveIds = new Set(Object.values(state.pieces).filter((p) => p.alive).map((p) => p.id));

  for (const [id, el] of view.pieceEls.entries()) {
    if (!aliveIds.has(id) && !el.classList.contains("isDestroyed")) {
      el.classList.add("isDestroyed");
      setTimeout(() => {
        el.remove();
        view.pieceEls.delete(id);
      }, 220);
    }
  }

  for (const piece of Object.values(state.pieces)) {
    if (!piece.alive) continue;
    let el = view.pieceEls.get(piece.id);
    if (!el) {
      el = makePieceEl(piece);
      view.pieceEls.set(piece.id, el);
      ui.piecesEl.appendChild(el);
    }
    setPieceTransform(el, piece);
    el.classList.toggle("isSelected", view.selectedId === piece.id);
  }

  // hover cell
  ui.cellsEl.querySelectorAll(".cell.isHover").forEach((c) => c.classList.remove("isHover"));
  if (view.hoverCell) {
    const c = ui.cellsEl.querySelector(`.cell[data-x="${view.hoverCell.x}"][data-y="${view.hoverCell.y}"]`);
    if (c) c.classList.add("isHover");
  }

  // hover piece
  for (const el of view.pieceEls.values()) el.classList.remove("isHover");
  if (view.hoverId) {
    const el = view.pieceEls.get(view.hoverId);
    if (el) el.classList.add("isHover");
  }

  // modal
  ui.modal.classList.toggle("isOpen", Boolean(state.winner));
  if (state.winner) {
    ui.modalTitle.textContent = "Game over";
    ui.modalDesc.textContent =
      state.winner === "draw" ? "Draw." : state.winner === 0 ? "Player 1 wins!" : "Player 2 wins!";
  }
}

async function main() {
  const root = document.querySelector("#app");
  const ui = buildUI(root);
  const laserCtx = setupLaserCanvas(ui.laser);

  let state = createInitialState();
  const view = {
    mode: "move", // move | rotate | place
    selectedId: null,
    hoverCell: null,
    hoverId: null,
    pieceEls: new Map(),
    placingRot: 0,
    locked: false,
  };

  updateModeButtons(ui, view.mode);
  render(state, ui, view);
  setStatus(ui, "Move mode: click one of your pieces, then click a green cell.", "ok");

  function setMode(mode) {
    view.mode = mode;
    updateModeButtons(ui, mode);
    if (mode === "move") setStatus(ui, "Move mode: click your piece then a green cell.", "ok");
    if (mode === "rotate") setStatus(ui, "Rotate mode: click one of your rotatable pieces to rotate.", "ok");
    if (mode === "place")
      setStatus(ui, `Place Pyramid mode: click a green cell (orientation ${view.placingRot * 90}°).`, "ok");
    render(state, ui, view);
  }

  async function perform(action) {
    if (view.locked || state.winner) return;
    view.locked = true;
    try {
      const result = applyAction(state, action);
      state = result.state;
      render(state, ui, view);

      // Laser animation if present
      const laserEvent = result.events.find((e) => e.type === "laser");
      if (laserEvent?.path) {
        await animateLaser(laserCtx, laserEvent.path);
      }

      // small delay to let CSS transitions settle
      await sleep(80);
      if (!state.winner) setStatus(ui, `Player ${state.currentPlayer + 1}'s turn.`, "ok");
      render(state, ui, view);
    } catch (e) {
      setStatus(ui, e?.message || "Invalid action", "bad");
      if (view.hoverCell) flashCell(ui, view.hoverCell.x, view.hoverCell.y);
      if (view.selectedId) {
        const el = view.pieceEls.get(view.selectedId);
        if (el) {
          el.classList.remove("isShaking");
          // force reflow so animation restarts
          void el.offsetWidth;
          el.classList.add("isShaking");
          setTimeout(() => el.classList.remove("isShaking"), 280);
        }
      }
      await sleep(120);
      render(state, ui, view);
    } finally {
      view.locked = false;
    }
  }

  // buttons
  ui.modeMove.addEventListener("click", () => setMode("move"));
  ui.modeRotate.addEventListener("click", () => setMode("rotate"));
  ui.modePlace.addEventListener("click", () => setMode("place"));
  ui.rotatePyr.addEventListener("click", () => {
    view.placingRot = (view.placingRot + 1) % 4;
    if (view.mode === "place") setStatus(ui, `Place Pyramid: orientation ${view.placingRot * 90}°`, "ok");
  });

  ui.swapPharaoh.addEventListener("click", async () => {
    await perform({ kind: "swapScarab", target: "pharaoh" });
  });
  ui.swapSphinx.addEventListener("click", async () => {
    await perform({ kind: "swapScarab", target: "sphinx" });
  });

  ui.restart.addEventListener("click", () => {
    state = createInitialState();
    view.selectedId = null;
    view.hoverId = null;
    view.hoverCell = null;
    view.placingRot = 0;
    // clear pieces
    for (const el of view.pieceEls.values()) el.remove();
    view.pieceEls.clear();
    laserCtx.clearRect(0, 0, ui.laser.width, ui.laser.height);
    setMode("move");
    render(state, ui, view);
    setStatus(ui, "New game. Move mode.", "ok");
  });
  ui.modalRestart.addEventListener("click", () => ui.restart.click());

  ui.clearSel.addEventListener("click", () => {
    view.selectedId = null;
    render(state, ui, view);
    setStatus(ui, "Selection cleared.", "ok");
  });

  // hover over board cells
  ui.cellsEl.addEventListener("pointermove", (e) => {
    const target = e.target.closest(".cell");
    if (!target) return;
    const x = Number(target.dataset.x);
    const y = Number(target.dataset.y);
    view.hoverCell = { x, y };
    // if a piece exists at this cell, set hoverId
    const pid = state.board?.[y]?.[x] ?? null;
    view.hoverId = pid;
    render(state, ui, view);
  });
  ui.cellsEl.addEventListener("pointerleave", () => {
    view.hoverCell = null;
    view.hoverId = null;
    render(state, ui, view);
  });

  // click on board cell: either select piece, move target, or place
  ui.cellsEl.addEventListener("click", async (e) => {
    if (view.locked || state.winner) return;
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const pid = state.board[y][x];

    if (view.mode === "place") {
      await perform({ kind: "placePyramid", x, y, rot: view.placingRot });
      return;
    }

    if (pid) {
      // selection
      const p = state.pieces[pid];
      if (p?.player !== state.currentPlayer) {
        setStatus(ui, "You can only select your own pieces.", "bad");
        flashCell(ui, x, y);
        return;
      }
      view.selectedId = pid;
      render(state, ui, view);
      if (view.mode === "move") setStatus(ui, "Now click a green cell to move.", "ok");
      return;
    }

    // empty cell click in move mode: attempt move if valid
    if (view.mode === "move" && view.selectedId) {
      await perform({ kind: "move", pieceId: view.selectedId, toX: x, toY: y });
      return;
    }
  });

  // click directly on piece in rotate mode (or move selection)
  ui.piecesEl.addEventListener("click", async (e) => {
    if (view.locked || state.winner) return;
    const pieceEl = e.target.closest(".piece");
    if (!pieceEl) return;
    const id = pieceEl.dataset.id;
    const piece = state.pieces[id];
    if (!piece) return;

    if (piece.player !== state.currentPlayer) {
      setStatus(ui, "You can only act with your own pieces.", "bad");
      return;
    }

    if (view.mode === "rotate") {
      await perform({ kind: "rotate", pieceId: id, delta: 1 });
      return;
    }

    // otherwise just select
    view.selectedId = id;
    render(state, ui, view);
  });
}

main();