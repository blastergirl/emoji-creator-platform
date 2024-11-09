import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PuzzlePiece from './PuzzlePiece';
import Timer from './Timer';
import { Cat, Clock, Trophy } from 'lucide-react';
import type { PuzzlePiece as PuzzlePieceType, GameState } from '../types';
import confetti from 'canvas-confetti';

type Difficulty = 'easy' | 'medium' | 'hard';

const PUZZLE_SIZE = 3;
const PIECE_SIZE = 150;
const SNAP_THRESHOLD = 30;

const CAT_IMAGE = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&fit=crop&crop=faces,center";

const calculateImageSection = (index: number) => {
  const row = Math.floor(index / PUZZLE_SIZE);
  const col = index % PUZZLE_SIZE;
  return {
    backgroundImage: `url(${CAT_IMAGE})`,
    backgroundSize: `${PIECE_SIZE * PUZZLE_SIZE}px ${PIECE_SIZE * PUZZLE_SIZE}px`,
    backgroundPosition: `-${col * PIECE_SIZE}px -${row * PIECE_SIZE}px`,
  };
};

const initialPieces: PuzzlePieceType[] = Array.from({ length: PUZZLE_SIZE * PUZZLE_SIZE }, (_, i) => {
  const correctX = (i % PUZZLE_SIZE) * PIECE_SIZE;
  const correctY = Math.floor(i / PUZZLE_SIZE) * PIECE_SIZE;
  
  const angle = (i / (PUZZLE_SIZE * PUZZLE_SIZE)) * Math.PI * 2;
  const radius = 300;
  const scatterX = Math.cos(angle) * radius;
  const scatterY = Math.sin(angle) * radius;
  
  return {
    id: i,
    rotation: Math.floor(Math.random() * 4) * 90,
    position: {
      x: correctX + scatterX,
      y: correctY + scatterY,
    },
    imageStyles: calculateImageSection(i),
    correctPosition: {
      x: correctX,
      y: correctY,
    },
    correctRotation: 0,
  };
});

const triggerCelebration = () => {
  // Initial burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

  // Side cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  }, 250);

  // Delayed bursts
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 }
    });
  }, 500);

  // Rain effect
  setTimeout(() => {
    const end = Date.now() + 1000;
    const colors = ['#ff0000', '#ffd700', '#00ff00', '#0000ff', '#ff69b4'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, 750);
};

export default function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<PuzzlePieceType[]>(initialPieces);
  const [gameState, setGameState] = useState<GameState>({
    timeElapsed: 0,
    hintsRemaining: 3,
    isComplete: false,
    score: 0,
  });
  const [activePiece, setActivePiece] = useState<number | null>(null);
  const [correctPieces, setCorrectPieces] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [showFinishButton, setShowFinishButton] = useState(true);

  const getPuzzleSize = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy': return 2;
      case 'medium': return 3;
      case 'hard': return 4;
      default: return 3;
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameState.isComplete) {
        setGameState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isComplete]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedPiece !== null) {
        switch (e.key) {
          case 'r':
          case 'R':
            handleRotate(selectedPiece);
            break;
          case 'Escape':
            setSelectedPiece(null);
            break;
          // Arrow keys for fine movement
          case 'ArrowLeft':
            movePiece(selectedPiece, { x: -10, y: 0 });
            break;
          case 'ArrowRight':
            movePiece(selectedPiece, { x: 10, y: 0 });
            break;
          case 'ArrowUp':
            movePiece(selectedPiece, { x: 0, y: -10 });
            break;
          case 'ArrowDown':
            movePiece(selectedPiece, { x: 0, y: 10 });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPiece]);

  const isPieceCorrect = (piece: PuzzlePieceType) => {
    const positionCorrect = Math.abs(piece.position.x - piece.correctPosition.x) < SNAP_THRESHOLD &&
                           Math.abs(piece.position.y - piece.correctPosition.y) < SNAP_THRESHOLD;
    const rotationCorrect = piece.rotation === piece.correctRotation;
    return positionCorrect && rotationCorrect;
  };

  const handleRotate = (id: number) => {
    if (correctPieces.has(id)) return;
    
    setPieces(prev => prev.map(piece =>
      piece.id === id ? { ...piece, rotation: (piece.rotation + 90) % 360 } : piece
    ));
    checkCompletion();
  };

  const handleDragEnd = (id: number, dragInfo: { x: number; y: number }) => {
    if (correctPieces.has(id) || !boardRef.current) return;

    const piece = pieces.find(p => p.id === id);
    if (!piece) return;

    const newX = piece.position.x + dragInfo.x;
    const newY = piece.position.y + dragInfo.y;

    const isNearCorrectPosition = 
      Math.abs(newX - piece.correctPosition.x) < SNAP_THRESHOLD &&
      Math.abs(newY - piece.correctPosition.y) < SNAP_THRESHOLD;

    setPieces(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        position: isNearCorrectPosition
          ? { ...p.correctPosition }
          : { x: newX, y: newY }
      };
    }));

    checkCompletion();
  };

  const checkCompletion = () => {
    const newCorrectPieces = new Set<number>();
    pieces.forEach(piece => {
      if (isPieceCorrect(piece)) {
        newCorrectPieces.add(piece.id);
      }
    });
    setCorrectPieces(newCorrectPieces);

    const isComplete = newCorrectPieces.size === pieces.length;
    if (isComplete && !gameState.isComplete) {
      setGameState(prev => ({
        ...prev,
        isComplete: true,
        score: Math.max(1000 - prev.timeElapsed * 10, 0),
      }));
      setShowCelebration(true);
      triggerCelebration();
    }
  };

  const useHint = () => {
    if (gameState.hintsRemaining > 0) {
      const unsolvedPieces = pieces.filter(p => !correctPieces.has(p.id));
      
      if (unsolvedPieces.length > 0) {
        const randomPiece = unsolvedPieces[Math.floor(Math.random() * unsolvedPieces.length)];
        setPieces(prev => prev.map(p =>
          p.id === randomPiece.id
            ? { ...p, position: p.correctPosition, rotation: p.correctRotation }
            : p
        ));
        setGameState(prev => ({ ...prev, hintsRemaining: prev.hintsRemaining - 1 }));
        checkCompletion();
      }
    }
  };

  const handlePieceClick = (id: number) => {
    if (!correctPieces.has(id)) {
      setSelectedPiece(id);
    }
  };

  const movePiece = (id: number, offset: { x: number, y: number }) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id === id && !correctPieces.has(id)) {
        return {
          ...piece,
          position: {
            x: piece.position.x + offset.x,
            y: piece.position.y + offset.y
          }
        };
      }
      return piece;
    }));
    checkCompletion();
  };

  const isPieceInCorrectArea = (piece: PuzzlePieceType) => {
    // Make the threshold much more lenient - allowing for bigger gaps
    const FINISH_THRESHOLD = PIECE_SIZE * 0.8; // 80% of piece size tolerance
    
    const correctCol = Math.floor(piece.correctPosition.x / PIECE_SIZE);
    const correctRow = Math.floor(piece.correctPosition.y / PIECE_SIZE);
    
    const pieceX = piece.position.x;
    const pieceY = piece.position.y;
    
    // Check if piece is roughly in the right area
    const isNearCorrectX = Math.abs(pieceX - piece.correctPosition.x) < FINISH_THRESHOLD;
    const isNearCorrectY = Math.abs(pieceY - piece.correctPosition.y) < FINISH_THRESHOLD;
    
    return isNearCorrectX && isNearCorrectY;
  };

  const handleFinish = () => {
    const allPiecesInPlace = pieces.every(piece => isPieceInCorrectArea(piece));
    
    if (allPiecesInPlace) {
      // Snap all pieces to their exact positions
      setPieces(prev => prev.map(piece => ({
        ...piece,
        position: piece.correctPosition,
        rotation: piece.correctRotation
      })));
      
      // New scoring system:
      // Base score: 3 points for completing the puzzle
      // Bonus: +1 point for each hint remaining
      const baseScore = 3;
      const hintBonus = gameState.hintsRemaining;
      const finalScore = baseScore + hintBonus;
      
      setGameState(prev => ({
        ...prev,
        isComplete: true,
        score: finalScore,
      }));
      
      setShowCelebration(true);
      triggerCelebration();
    } else {
      // Show a more helpful message
      alert("Some pieces aren't in their correct positions. Try arranging them according to the preview image!");
    }
  };

  const resetGame = () => {
    setPieces([...initialPieces]); // Create a new array to trigger re-render
    setGameState({
      timeElapsed: 0,
      hintsRemaining: 3,
      isComplete: false,
      score: 0,
    });
    setCorrectPieces(new Set());
    setShowCelebration(false);
    setSelectedPiece(null);
    setShowControls(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-yellow-900/5 to-yellow-600/10 p-8"
    >
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.05 }}
          >
            <Cat className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-yellow-500">Shadow Cat</h1>
          </motion.div>
          <div className="flex items-center space-x-6">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <Clock className="w-5 h-5 text-yellow-500" />
              <Timer seconds={gameState.timeElapsed} />
            </motion.div>
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{gameState.score}</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          ref={boardRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-[600px] bg-black/90 rounded-xl shadow-2xl overflow-hidden border border-yellow-500/20"
        >
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-4 right-4 w-[150px] h-[150px] rounded-lg overflow-hidden shadow-lg border-2 border-yellow-500/20"
          >
            <img 
              src={CAT_IMAGE} 
              alt="Complete puzzle preview"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {pieces.map(piece => (
              <PuzzlePiece
                key={piece.id}
                piece={piece}
                onRotate={handleRotate}
                onDragEnd={handleDragEnd}
                isActive={selectedPiece === piece.id}
                isCorrect={correctPieces.has(piece.id)}
                size={PIECE_SIZE}
                boardSize={PIECE_SIZE * PUZZLE_SIZE}
                onClick={() => handlePieceClick(piece.id)}
              />
            ))}
          </div>

          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm" />
                <motion.div
                  initial={{ y: 50 }}
                  animate={{ y: 0 }}
                  className="relative bg-black/90 p-8 rounded-2xl shadow-2xl text-center border border-yellow-500/20"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <h2 className="text-4xl font-bold mb-4 text-yellow-500">
                      🎉 Puzzle Complete! 🎊
                    </h2>
                  </motion.div>
                  <motion.p
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-2xl text-yellow-400 mb-8"
                  >
                    🏆 Score: {gameState.score} 🏆
                  </motion.p>
                  <motion.div
                    className="mt-4 text-3xl mb-8"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    🎈 🎨 🎯 🌟
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all shadow-lg"
                  >
                    🎮 Play Again
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {gameState.timeElapsed > 0 && !gameState.isComplete && (
            <motion.div
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-all shadow-lg"
              >
                🔄 Try Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 flex justify-between items-center"
        >
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={useHint}
              disabled={gameState.hintsRemaining === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-all
                ${gameState.hintsRemaining > 0
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
            >
              Use Hint ({gameState.hintsRemaining} remaining)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowControls(true)}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-800 text-yellow-500 hover:bg-gray-700"
            >
              How to Play
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFinish}
            className="px-8 py-4 rounded-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 
              text-white hover:from-green-600 hover:to-emerald-700 shadow-lg 
              transition-all transform hover:shadow-xl"
          >
            ✨ Check Puzzle ✨
          </motion.button>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm" onClick={() => setShowControls(false)} />
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="relative bg-black/90 p-8 rounded-2xl shadow-2xl text-left border border-yellow-500/20 max-w-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-yellow-500 text-center">How to Play Shadow Cat</h2>
              
              <div className="space-y-6 text-yellow-400">
                <div>
                  <h3 className="font-bold mb-2">🎯 Goal</h3>
                  <p>Arrange all puzzle pieces to recreate the cat image shown in the preview (top right corner).</p>
                </div>

                <div>
                  <h3 className="font-bold mb-2">🖱️ Basic Controls</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Drag and drop pieces to move them</li>
                    <li>Click a piece to rotate it clockwise</li>
                    <li>Click a piece to select it for keyboard controls</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-2">⌨️ Keyboard Controls</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Arrow keys: Fine-tune selected piece position</li>
                    <li>R key: Rotate selected piece</li>
                    <li>ESC key: Deselect piece</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-2">💡 Hints & Completion</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Use hints to automatically place a random piece (3 available)</li>
                    <li>When you think you're done, click "Check Puzzle"</li>
                    <li>Pieces don't need to be perfectly aligned - close is good enough!</li>
                    <li>Score: 3 points for completion + 1 point for each unused hint</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowControls(false)}
                  className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 font-semibold transition-all"
                >
                  Let's Play! 🎮
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}