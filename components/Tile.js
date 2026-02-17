import { TILE_SPACING, BOARD_OFFSET_X } from '../lib/gameLogic';
import styles from './Tile.module.css';

export default function Tile({ tile, blocked, onClick }) {
  const handleClick = () => {
    if (!blocked && !tile.isRemoved) {
      onClick(tile);
    }
  };

  if (tile.isRemoved) return null;

  const tileStyle = {
    left: `${(tile.col + BOARD_OFFSET_X) * TILE_SPACING}px`,
    top: `${tile.row * TILE_SPACING}px`,
    zIndex: tile.layer * 10,
  };

  return (
    <div
      className={`${styles.tile} ${blocked ? styles.blocked : styles.active}`}
      style={tileStyle}
      onClick={handleClick}
      data-layer={tile.layer}
    >
      <span className={styles.emoji}>{tile.emoji}</span>
    </div>
  );
}
