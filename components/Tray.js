import styles from './Tray.module.css';
import { MAX_TRAY_SIZE } from '../lib/gameLogic';

export default function Tray({ tray }) {
  const slots = Array.from({ length: MAX_TRAY_SIZE }, (_, i) => tray[i] || null);

  return (
    <div className={styles.trayWrapper}>
      <div className={styles.tray}>
        {slots.map((tile, index) => (
          <div key={index} className={styles.slot}>
            {tile && (
              <div className={styles.trayTile}>
                <span className={styles.emoji}>{tile.emoji}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
