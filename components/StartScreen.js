import styles from './StartScreen.module.css';

export default function StartScreen({ onStart }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.emoji}>🀄</span>
          Tile Match
        </h1>
        <p className={styles.subtitle}>จับคู่ 3 ไทล์เหมือนกันให้หมดกระดาน!</p>
        <button className={styles.startButton} onClick={onStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}
