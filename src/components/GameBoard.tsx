import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PuzzlePiece from './PuzzlePiece';
import Timer from './Timer';
import { Cat, Clock, Trophy } from 'lucide-react';
import type { PuzzlePiece as PuzzlePieceType, GameState } from '../types';
import confetti from 'canvas-confetti';
import { levels, type LevelConfig } from '../config/levels';

type Difficulty = 'easy' | 'medium' | 'hard';

const MOBILE_BREAKPOINT = 768; // pixels
const DESKTOP_PIECE_SIZE = 150;
const MOBILE_PIECE_SIZE = 80; // Smaller pieces for mobile
const BOARD_HEIGHT_MOBILE = 400; // Smaller board height for mobile
const SNAP_THRESHOLD = 30;

const CAT_IMAGE = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&fit=crop&crop=faces,center";

const calculatePieceSize = () => {
  if (typeof window === 'undefined') return DESKTOP_PIECE_SIZE;
  return window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_PIECE_SIZE : DESKTOP_PIECE_SIZE;
};

// Move LevelSelectModal outside of GameBoard and memoize it
const LevelSelectModal = React.memo(({ 
  onClose, 
  onSelectLevel, 
  currentLevel, 
  loadedImages 
}: { 
  onClose: () => void;
  onSelectLevel: (level: LevelConfig) => void;
  currentLevel: LevelConfig;
  loadedImages: Set<string>;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 flex items-center justify-center z-50"
  >
    <motion.div 
      className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    />
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="relative bg-black/90 p-6 rounded-2xl shadow-2xl border border-yellow-500/20 max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-yellow-500 text-center">Select Level</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {levels.map((level) => (
          <motion.button
            key={level.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectLevel(level)}
            className={`relative p-2 rounded-lg border-2 transition-all
              ${currentLevel.id === level.id 
                ? 'border-yellow-500' 
                : 'border-yellow-500/20 hover:border-yellow-500/50'}`}
          >
            <div className="relative aspect-square bg-black/50">
              {loadedImages.has(level.image) && (
                <img 
                  src={level.image} 
                  alt={level.name}
                  className="w-full h-full object-cover rounded"
                  draggable="false"
                />
              )}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="mt-2 text-yellow-500 font-semibold">{level.name}</div>
            <div className={`text-sm ${
              level.difficulty === 'easy' ? 'text-green-500' :
              level.difficulty === 'medium' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {level.difficulty.charAt(0).toUpperCase() + level.difficulty.slice(1)}
              {` (${level.gridSize}x${level.gridSize})`}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  </motion.div>
));

export default function GameBoard() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [pieceSize, setPieceSize] = useState(calculatePieceSize());
  const [boardHeight, setBoardHeight] = useState(600);

  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(levels[0]);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  const calculateImageSection = (index: number, level = currentLevel) => {
    const row = Math.floor(index / level.gridSize);
    const col = index % level.gridSize;
    return {
      backgroundImage: `url(${level.image})`,
      backgroundSize: `${pieceSize * level.gridSize}px ${pieceSize * level.gridSize}px`,
      backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
    };
  };

  const createInitialPieces = (size: number, level = currentLevel): PuzzlePieceType[] => {
    return Array.from({ length: level.gridSize * level.gridSize }, (_, i) => {
      const correctX = (i % level.gridSize) * size;
      const correctY = Math.floor(i / level.gridSize) * size;
      
      const angle = (i / (level.gridSize * level.gridSize)) * Math.PI * 2;
      const radius = size * 2;
      const scatterX = Math.cos(angle) * radius;
      const scatterY = Math.sin(angle) * radius;
      
      return {
        id: i,
        rotation: Math.floor(Math.random() * 4) * 90,
        position: {
          x: correctX + scatterX,
          y: correctY + scatterY,
        },
        imageStyles: calculateImageSection(i, level),
        correctPosition: {
          x: correctX,
          y: correctY,
        },
        correctRotation: 0,
        opacity: 1,
      };
    });
  };

  const boardRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<PuzzlePieceType[]>(() => createInitialPieces(pieceSize));
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
  const [hintPieceId, setHintPieceId] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setPieceSize(isMobile ? MOBILE_PIECE_SIZE : DESKTOP_PIECE_SIZE);
      setBoardHeight(isMobile ? BOARD_HEIGHT_MOBILE : 600);
    };

    handleResize(); // Call once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    preloadImages();
  }, []);

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
        
        setHintPieceId(randomPiece.id);
        
        setTimeout(() => {
          setHintPieceId(null);
        }, 3000);
        
        setGameState(prev => ({ ...prev, hintsRemaining: prev.hintsRemaining - 1 }));
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
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const FINISH_THRESHOLD = pieceSize * 0.9;
    
    const isNearCorrectPosition = 
      Math.abs(piece.position.x - piece.correctPosition.x) < FINISH_THRESHOLD &&
      Math.abs(piece.position.y - piece.correctPosition.y) < FINISH_THRESHOLD;

    const rotationThreshold = isMobile ? 60 : 45; // degrees
    const isRotationClose = Math.abs(((piece.rotation % 360) + 360) % 360) < rotationThreshold;
    
    return isNearCorrectPosition && isRotationClose;
  };

  const handleFinish = () => {
    const allPiecesInPlace = pieces.every(piece => isPieceInCorrectArea(piece));
    
    if (allPiecesInPlace) {
      setPieces(prev => prev.map(piece => ({
        ...piece,
        position: piece.correctPosition,
        rotation: piece.correctRotation
      })));
      
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
      alert("Some pieces aren't in their correct positions. Try arranging them according to the preview image!");
    }
  };

  const resetGame = () => {
    setPieces(createInitialPieces(pieceSize));
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

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

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

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 }
      });
    }, 500);

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

  // Update the handleLevelChange function
  const handleLevelChange = (newLevel: LevelConfig) => {
    console.log('handleLevelChange called with level:', newLevel.id);
    
    if (newLevel.id === currentLevel.id) {
      console.log('Same level selected, closing modal');
      setShowLevelSelect(false);
      return;
    }

    console.log('Updating to new level:', newLevel.id);
    setCurrentLevel(newLevel);
    
    console.log('Fading out pieces');
    setPieces(prev => prev.map(piece => ({
      ...piece,
      opacity: 0
    })));

    setTimeout(() => {
      console.log('Creating new pieces for level:', newLevel.id);
      const newPieces = createInitialPieces(pieceSize, newLevel);
      setPieces(newPieces);
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
      setShowLevelSelect(false);
    }, 300);
  };

  const goToNextLevel = () => {
    const currentIndex = levels.findIndex(level => level.id === currentLevel.id);
    let nextIndex = (currentIndex + 1) % levels.length;
    while (levels[nextIndex].image === currentLevel.image && nextIndex !== currentIndex) {
      nextIndex = (nextIndex + 1) % levels.length;
    }
    handleLevelChange(levels[nextIndex]);
  };

  const preloadImages = () => {
    console.log('Starting image preload');
    const loadImage = (src: string) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded:', src);
          setLoadedImages(prev => new Set([...prev, src]));
          resolve(src);
        };
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all(levels.map(level => loadImage(level.image)))
      .then(() => console.log('All images preloaded'))
      .catch(error => console.error('Error preloading images:', error));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-yellow-900/5 to-yellow-600/10 p-2 sm:p-8"
    >
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 sm:mb-8"
        >
          <div className="flex items-center space-x-4 sm:space-x-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLevelSelect(true)}
              className="px-4 py-2 bg-yellow-500/20 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-all"
            >
              Select Level
            </motion.button>
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <Timer seconds={gameState.timeElapsed} />
            </motion.div>
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span className="font-semibold">{gameState.score}</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          ref={boardRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full bg-black/90 rounded-xl shadow-2xl overflow-hidden border border-yellow-500/20"
          style={{ height: `${boardHeight}px` }}
        >
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-4 right-4 w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] rounded-lg overflow-hidden shadow-lg border-2 border-yellow-500/20"
          >
            <motion.img 
              key={currentLevel.image}
              src={currentLevel.image}
              alt="Complete puzzle preview"
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
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
                isHinted={hintPieceId === piece.id}
                size={pieceSize}
                boardSize={pieceSize * currentLevel.gridSize}
                onClick={() => handlePieceClick(piece.id)}
                isDraggable={!correctPieces.has(piece.id)}
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
                  className="relative bg-black/90 p-4 sm:p-8 rounded-2xl shadow-2xl text-center border border-yellow-500/20 mx-4"
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
                    <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-yellow-500">
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
                    className="text-xl sm:text-2xl text-yellow-400 mb-6"
                  >
                    🏆 Score: {gameState.score} 🏆
                  </motion.p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetGame}
                      className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 transition-all shadow-lg"
                    >
                      🔄 Try Again
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToNextLevel}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all shadow-lg"
                    >
                      Next Level ➡️
                    </motion.button>
                  </div>
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
          className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={useHint}
              disabled={gameState.hintsRemaining === 0}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all w-full sm:w-auto
                ${gameState.hintsRemaining > 0
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
            >
              Use Hint ({gameState.hintsRemaining})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowControls(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold bg-gray-800 text-yellow-500 hover:bg-gray-700 w-full sm:w-auto"
            >
              How to Play
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFinish}
            className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 
              text-white hover:from-green-600 hover:to-emerald-700 shadow-lg 
              transition-all transform hover:shadow-xl w-full sm:w-auto"
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
              className="relative bg-black/90 p-4 sm:p-8 rounded-2xl shadow-2xl text-left border border-yellow-500/20 max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
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
      <AnimatePresence>
        {showLevelSelect && (
          <LevelSelectModal
            onClose={() => setShowLevelSelect(false)}
            onSelectLevel={handleLevelChange}
            currentLevel={currentLevel}
            loadedImages={loadedImages}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}