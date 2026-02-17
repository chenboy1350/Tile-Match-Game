import Tile from './Tile';
import { isTileBlocked } from '../lib/gameLogic';
import styles from './GameBoard.module.css';

export default function GameBoard({ tiles, onTileClick }) {
  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board}>
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            blocked={isTileBlocked(tile, tiles)}
            onClick={onTileClick}
          />
        ))}
      </div>
    </div>
  );
}
