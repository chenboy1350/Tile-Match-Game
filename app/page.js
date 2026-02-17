'use client';

import { useState, useRef, useCallback } from 'react';
import StartScreen from '../components/StartScreen';
import GameBoard from '../components/GameBoard';
import Tray from '../components/Tray';
import {
  generateTiles,
  addToTray,
  checkMatch,
  checkWin,
  checkLose,
  isTileBlocked,
} from '../lib/gameLogic';
import styles from './page.module.css';

export default function Home() {
  const [gameState, setGameState] = useState('start');
  const [tiles, setTiles] = useState([]);
  const [tray, setTray] = useState([]);
  const animatingRef = useRef(false);

  const startGame = useCallback(() => {
    setTiles(generateTiles());
    setTray([]);
    setGameState('playing');
    animatingRef.current = false;
  }, []);

  const handleTileClick = useCallback(
    (clickedTile) => {
      if (gameState !== 'playing') return;
      if (animatingRef.current) return;
      if (isTileBlocked(clickedTile, tiles)) return;

      // Remove tile from board
      const newTiles = tiles.map((t) =>
        t.id === clickedTile.id ? { ...t, isRemoved: true } : t
      );
      setTiles(newTiles);

      // Add to tray and check match
      setTray((prevTray) => {
        const newTray = addToTray(prevTray, clickedTile);
        const { matched, newTray: trayAfterMatch } = checkMatch(newTray);

        if (matched) {
          animatingRef.current = true;
          // Show match briefly then remove
          setTimeout(() => {
            setTray(trayAfterMatch);
            animatingRef.current = false;

            if (checkWin(newTiles)) {
              setGameState('win');
            }
          }, 400);
          return newTray;
        }

        // Check lose
        if (checkLose(newTray)) {
          setTimeout(() => setGameState('lose'), 300);
        }

        // Check win
        if (checkWin(newTiles)) {
          setGameState('win');
        }

        return newTray;
      });
    },
    [gameState, tiles]
  );

  if (gameState === 'start') {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tile Match</h1>
        <div className={styles.tilesLeft}>
          Tiles: {tiles.filter((t) => !t.isRemoved).length}
        </div>
      </header>

      <GameBoard tiles={tiles} onTileClick={handleTileClick} />

      <Tray tray={tray} />

      {(gameState === 'win' || gameState === 'lose') && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            {gameState === 'win' ? (
              <>
                <div className={styles.modalEmoji}>🎉</div>
                <h2 className={styles.modalTitle}>You Win!</h2>
                <p className={styles.modalText}>เคลียร์หมดทุก Tile แล้ว!</p>
              </>
            ) : (
              <>
                <div className={styles.modalEmoji}>😵</div>
                <h2 className={styles.modalTitle}>Game Over</h2>
                <p className={styles.modalText}>ถาดเต็ม! ลองใหม่อีกครั้ง</p>
              </>
            )}
            <button className={styles.retryButton} onClick={startGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
