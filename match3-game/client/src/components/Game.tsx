import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Game.css';

// Game piece types
const PIECE_TYPES = {
  APPLE: 'apple',
  BANANA: 'banana',
  STAR: 'star',
  GRAPE: 'grape',
  CARROT: 'carrot',
  CUPCAKE: 'cupcake',
};

const PIECE_COLORS = {
  apple: '#FF6B6B',
  banana: '#FFD93D',
  star: '#4D96FF',
  grape: '#D946EF',
  carrot: '#FF9F43',
  cupcake: '#FF6B9D',
};

const PIECE_EMOJIS = {
  apple: '🍎',
  banana: '🍌',
  star: '⭐',
  grape: '🍇',
  carrot: '🥕',
  cupcake: '🧁',
};

interface GamePiece {
  id: string;
  type: string;
  row: number;
  col: number;
  isMatched: boolean;
}

interface GameState {
  board: GamePiece[][];
  score: number;
  selectedPiece: GamePiece | null;
  animatingPieces: Set<string>;
  gameOver: boolean;
  message: string;
}

const GRID_SIZE = 4;
const PIECE_SIZE = 80;

export default function Game() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    score: 0,
    selectedPiece: null,
    animatingPieces: new Set(),
    gameOver: false,
    message: '',
  });

  // Initialize game board
  const initializeBoard = useCallback(() => {
    const board: GamePiece[][] = [];
    const pieceTypeArray = Object.values(PIECE_TYPES);

    for (let row = 0; row < GRID_SIZE; row++) {
      board[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        board[row][col] = {
          id: `${row}-${col}`,
          type: pieceTypeArray[Math.floor(Math.random() * pieceTypeArray.length)],
          row,
          col,
          isMatched: false,
        };
      }
    }

    setGameState(prev => ({
      ...prev,
      board,
      selectedPiece: null,
      message: 'Tap three matching pieces!',
    }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  // Check for matches
  const findMatches = useCallback((board: GamePiece[][]) => {
    const matchedIds = new Set<string>();

    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const piece1 = board[row][col];
        const piece2 = board[row][col + 1];
        const piece3 = board[row][col + 2];

        if (
          piece1.type === piece2.type &&
          piece2.type === piece3.type &&
          !piece1.isMatched
        ) {
          matchedIds.add(piece1.id);
          matchedIds.add(piece2.id);
          matchedIds.add(piece3.id);
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const piece1 = board[row][col];
        const piece2 = board[row + 1][col];
        const piece3 = board[row + 2][col];

        if (
          piece1.type === piece2.type &&
          piece2.type === piece3.type &&
          !piece1.isMatched
        ) {
          matchedIds.add(piece1.id);
          matchedIds.add(piece2.id);
          matchedIds.add(piece3.id);
        }
      }
    }

    return matchedIds;
  }, []);

  // Handle piece click
  const handlePieceClick = useCallback((piece: GamePiece) => {
    if (gameState.animatingPieces.size > 0) return;

    setGameState(prev => {
      let newBoard = prev.board.map(row => [...row]);
      let newScore = prev.score;
      let newMessage = 'Tap three matching pieces!';

      // If no piece selected, select this one
      if (!prev.selectedPiece) {
        return {
          ...prev,
          selectedPiece: piece,
          message: 'Select two more!',
        };
      }

      // If same piece selected, deselect
      if (prev.selectedPiece.id === piece.id) {
        return {
          ...prev,
          selectedPiece: null,
          message: 'Tap three matching pieces!',
        };
      }

      // If different piece selected and same type, check for third
      if (prev.selectedPiece.type === piece.type) {
        // Look for a third piece of the same type
        let thirdPiece = null;
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            const candidate = newBoard[row][col];
            if (
              candidate.type === piece.type &&
              candidate.id !== prev.selectedPiece.id &&
              candidate.id !== piece.id
            ) {
              thirdPiece = candidate;
              break;
            }
          }
          if (thirdPiece) break;
        }

        if (thirdPiece) {
          // Mark all three as matched
          newBoard[prev.selectedPiece.row][prev.selectedPiece.col].isMatched = true;
          newBoard[piece.row][piece.col].isMatched = true;
          newBoard[thirdPiece.row][thirdPiece.col].isMatched = true;

          newScore = prev.score + 30;
          newMessage = 'Great Job! 🎉';

          // Animate removal
          const animatingIds = new Set([
            prev.selectedPiece.id,
            piece.id,
            thirdPiece.id,
          ]);

          setGameState(prevState => ({
            ...prevState,
            animatingPieces: animatingIds,
          }));

          // Remove matched pieces after animation
          setTimeout(() => {
            setGameState(prevState => {
              const updatedBoard = prevState.board.map(row =>
                row.filter(p => !p.isMatched)
              );

              // Refill board
              const pieceTypeArray = Object.values(PIECE_TYPES);
              const newBoardFilled: GamePiece[][] = [];

              for (let row = 0; row < GRID_SIZE; row++) {
                newBoardFilled[row] = [];
                for (let col = 0; col < GRID_SIZE; col++) {
                  if (updatedBoard[row] && updatedBoard[row][col]) {
                    newBoardFilled[row][col] = updatedBoard[row][col];
                  } else {
                    newBoardFilled[row][col] = {
                      id: `${row}-${col}-${Math.random()}`,
                      type: pieceTypeArray[
                        Math.floor(Math.random() * pieceTypeArray.length)
                      ],
                      row,
                      col,
                      isMatched: false,
                    };
                  }
                }
              }

              return {
                ...prevState,
                board: newBoardFilled,
                selectedPiece: null,
                animatingPieces: new Set(),
                score: newScore,
                message: 'Awesome! Keep going! 🌟',
              };
            });
          }, 400);

          return {
            ...prev,
            board: newBoard,
            score: newScore,
            selectedPiece: null,
            message: newMessage,
          };
        }
      }

      // Select new piece if different type
      return {
        ...prev,
        selectedPiece: piece,
        message: 'Select two more!',
      };
    });
  }, [gameState.animatingPieces.size]);

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Happy Match 3 Adventure</h1>
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Score</span>
            <span className="stat-value">{gameState.score}</span>
          </div>
        </div>
      </div>

      <div className="game-message">{gameState.message}</div>

      <div className="game-board">
        <AnimatePresence>
          {gameState.board.map((row, rowIdx) =>
            row.map((piece, colIdx) => (
              <motion.div
                key={piece.id}
                className={`game-piece ${piece.type} ${
                  gameState.selectedPiece?.id === piece.id ? 'selected' : ''
                }`}
                onClick={() => handlePieceClick(piece)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: gameState.animatingPieces.has(piece.id) ? 1.2 : 1,
                  opacity: gameState.animatingPieces.has(piece.id) ? 0 : 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: gameState.animatingPieces.has(piece.id) ? 0.4 : 0.3,
                }}
                style={{
                  backgroundColor: PIECE_COLORS[piece.type as keyof typeof PIECE_COLORS],
                }}
              >
                <span className="piece-emoji">
                  {PIECE_EMOJIS[piece.type as keyof typeof PIECE_EMOJIS]}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <button className="reset-button" onClick={() => initializeBoard()}>
        New Game 🎮
      </button>
    </div>
  );
}
