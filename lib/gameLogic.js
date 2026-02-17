const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🌸', '🌺', '🍀', '🔥', '⭐'];

const GRID = 8;
const MAX_LAYERS = 8;
export const TILE_SPACING = 44;
export const TILE_SIZE = 40;

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate one inverted pyramid (wide at top, narrow at bottom)
// centerCol/centerRow = center on the grid
// maxLayer = how many layers deep this group goes (topmost layer index)
// topRadius = radius of the widest part (top layer)
function generateDepthGroup(centerCol, centerRow, maxLayer, topRadius) {
  const positions = [];

  for (let layer = 0; layer <= maxLayer; layer++) {
    // Inverted: higher layer = wider, lower layer = narrower
    const progress = maxLayer === 0 ? 1 : layer / maxLayer;
    const radius = Math.max(0, Math.round(topRadius * progress));

    const candidates = [];
    for (let r = centerRow - radius; r <= centerRow + radius; r++) {
      for (let c = centerCol - radius; c <= centerCol + radius; c++) {
        if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
          candidates.push({ col: c, row: r });
        }
      }
    }

    // Top 2 layers are dense, lower layers are sparser
    const isTopLayer = layer >= maxLayer - 1;
    const density = isTopLayer
      ? 0.75 + Math.random() * 0.15
      : 0.25 + Math.random() * 0.15;
    const shuffled = shuffle(candidates);
    const count = Math.max(layer === maxLayer ? 1 : 0, Math.floor(candidates.length * density));

    // Alternating half-tile offset: odd layers shift by 0.5
    // so each tile sits at the corner of 4 tiles from the layer below
    const offset = layer % 2 === 1 ? 0.5 : 0;

    for (let i = 0; i < count; i++) {
      positions.push({
        col: shuffled[i].col + offset,
        row: shuffled[i].row + offset,
        gridCol: shuffled[i].col,
        gridRow: shuffled[i].row,
        layer,
      });
    }
  }

  return positions;
}

// Generate side reserve stacks (left & right)
// 1 stack per side, staircase layout so player can count remaining tiles
function generateSideStacks() {
  const positions = [];
  const baseRow = 1.5;
  const step = 0.3; // vertical offset per layer for staircase

  // Left stack
  for (let layer = 0; layer < MAX_LAYERS; layer++) {
    positions.push({
      col: -2,
      row: baseRow + (MAX_LAYERS - 1 - layer) * step,
      gridCol: -2,
      gridRow: baseRow,
      layer,
      isSideStack: true,
    });
  }

  // Right stack
  for (let layer = 0; layer < MAX_LAYERS; layer++) {
    positions.push({
      col: GRID + 1,
      row: baseRow + (MAX_LAYERS - 1 - layer) * step,
      gridCol: GRID + 1,
      gridRow: baseRow,
      layer,
      isSideStack: true,
    });
  }

  return positions;
}

export function generateTiles() {
  // 3 depth groups at random positions
  const groups = [
    { maxLayer: 7, topRadius: 3 }, // Deep
    { maxLayer: 4, topRadius: 2 }, // Medium
    { maxLayer: 2, topRadius: 1 }, // Shallow
  ];

  // Pick random centers, spread apart
  const centers = [];
  for (const group of groups) {
    let centerCol, centerRow;
    let attempts = 0;
    do {
      centerCol = 2 + Math.floor(Math.random() * 4); // 2-5
      centerRow = 2 + Math.floor(Math.random() * 4);
      attempts++;
    } while (
      attempts < 50 &&
      centers.some(
        (c) => Math.abs(c.col - centerCol) + Math.abs(c.row - centerRow) < 3
      )
    );
    centers.push({ col: centerCol, row: centerRow });

    group.centerCol = centerCol;
    group.centerRow = centerRow;
  }

  // Generate main board positions
  let mainPositions = [];
  for (const group of groups) {
    const positions = generateDepthGroup(
      group.centerCol,
      group.centerRow,
      group.maxLayer,
      group.topRadius
    );
    mainPositions.push(...positions);
  }

  if (mainPositions.length < 30) {
    mainPositions = generateDepthGroup(4, 4, 7, 3);
  }

  // Generate side stacks (6 stacks × 8 layers = 48 tiles)
  const sidePositions = generateSideStacks();

  // Combine all positions
  let allPositions = [...mainPositions, ...sidePositions];

  // Adjust total to be multiple of 3
  allPositions = shuffle(allPositions);
  while (allPositions.length % 3 !== 0) {
    // Remove from main board, not side stacks
    const idx = allPositions.findIndex((p) => !p.isSideStack);
    if (idx !== -1) allPositions.splice(idx, 1);
    else allPositions.pop();
  }

  const totalTiles = allPositions.length;
  const setsNeeded = totalTiles / 3;

  // Build emoji pool: reuse emojis in sets of 3
  const emojiPool = [];
  for (let i = 0; i < setsNeeded; i++) {
    emojiPool.push(EMOJIS[i % EMOJIS.length], EMOJIS[i % EMOJIS.length], EMOJIS[i % EMOJIS.length]);
  }
  const shuffledEmojis = shuffle(emojiPool);

  return shuffle(allPositions).map((pos, i) => ({
    id: `tile-${i}`,
    emoji: shuffledEmojis[i],
    col: pos.col,
    row: pos.row,
    gridCol: pos.gridCol,
    gridRow: pos.gridRow,
    layer: pos.layer,
    isRemoved: false,
  }));
}

// Board offset to accommodate left side stacks
export const BOARD_OFFSET_X = 3;

// Threshold: tiles overlap visually when their centers are less than
// one tile-width apart (TILE_SIZE / TILE_SPACING ≈ 0.909)
const BLOCK_THRESHOLD = TILE_SIZE / TILE_SPACING;

export function isTileBlocked(tile, allTiles) {
  if (tile.isRemoved) return true;

  // Use visual col/row positions so blocking matches what the player sees
  return allTiles.some((other) => {
    if (other.isRemoved) return false;
    if (other.layer <= tile.layer) return false;

    const overlapX = Math.abs(other.col - tile.col) < BLOCK_THRESHOLD;
    const overlapY = Math.abs(other.row - tile.row) < BLOCK_THRESHOLD;

    return overlapX && overlapY;
  });
}

export function addToTray(tray, tile) {
  const newTray = [...tray];

  const matchIndex = newTray.findIndex((t) => t.emoji === tile.emoji);
  if (matchIndex !== -1) {
    let insertAt = matchIndex + 1;
    while (insertAt < newTray.length && newTray[insertAt].emoji === tile.emoji) {
      insertAt++;
    }
    newTray.splice(insertAt, 0, { ...tile });
  } else {
    newTray.push({ ...tile });
  }

  return newTray;
}

export function checkMatch(tray) {
  const counts = {};
  for (const tile of tray) {
    counts[tile.emoji] = (counts[tile.emoji] || 0) + 1;
  }

  const matchedEmoji = Object.keys(counts).find((emoji) => counts[emoji] >= 3);

  if (matchedEmoji) {
    let removed = 0;
    const newTray = tray.filter((tile) => {
      if (tile.emoji === matchedEmoji && removed < 3) {
        removed++;
        return false;
      }
      return true;
    });
    return { matched: true, matchedEmoji, newTray };
  }

  return { matched: false, matchedEmoji: null, newTray: tray };
}

export function checkWin(tiles) {
  return tiles.every((tile) => tile.isRemoved);
}

export function checkLose(tray) {
  return tray.length >= 7;
}

export const MAX_TRAY_SIZE = 7;
