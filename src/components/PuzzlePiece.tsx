import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PuzzlePiece as PuzzlePieceType } from '../types';

interface Props {
  piece: PuzzlePieceType;
  onRotate: (id: number) => void;
  onDragEnd: (id: number, dragInfo: { x: number; y: number }) => void;
  isActive: boolean;
  size: number;
  isCorrect: boolean;
  boardSize: number;
  onClick?: () => void;
  isDraggable: boolean;
}

export default function PuzzlePiece({ piece, onRotate, onDragEnd, isActive, size, isCorrect, boardSize, onClick, isDraggable }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        className={`absolute touch-none ${isDraggable ? 'cursor-grab' : 'cursor-default'} 
          ${isCorrect ? 'ring-4 ring-yellow-500 ring-opacity-50' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          willChange: 'transform',
          zIndex: isDragging ? 50 : isActive ? 40 : isCorrect ? 10 : 20,
        }}
        initial={{ 
          x: piece.position.x - boardSize / 2,
          y: piece.position.y - boardSize / 2,
          scale: 0,
          opacity: 0 
        }}
        animate={{
          x: piece.position.x - boardSize / 2,
          y: piece.position.y - boardSize / 2,
          rotate: piece.rotation,
          scale: isActive ? 1.05 : 1,
          opacity: 1,
          zIndex: isDragging ? 50 : isActive ? 40 : isCorrect ? 10 : 20,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          opacity: { duration: 0.2 }
        }}
        drag={isDraggable}
        dragMomentum={false}
        dragElastic={0}
        whileHover={isDraggable ? { 
          scale: 1.05,
          boxShadow: "0px 5px 15px rgba(0,0,0,0.3)",
          zIndex: 30
        } : undefined}
        whileDrag={isDraggable ? { 
          scale: 1.1,
          zIndex: 50,
          boxShadow: "0px 10px 25px rgba(0,0,0,0.4)"
        } : undefined}
        onDragStart={() => {
          setIsDragging(true);
          onClick?.(); // Select the piece when starting to drag
        }}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          onDragEnd(piece.id, { 
            x: info.offset.x,
            y: info.offset.y
          });
        }}
        onClick={onClick}
      >
        <motion.div 
          className={`w-full h-full rounded-lg shadow-lg overflow-hidden transition-all duration-200
            ${isCorrect ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging && isDraggable) {
              onRotate(piece.id);
            }
          }}
          style={{
            ...piece.imageStyles,
            pointerEvents: isCorrect ? 'none' : 'auto',
          }}
          whileHover={!isCorrect ? {
            filter: "brightness(1.2)"
          } : undefined}
          animate={isCorrect ? {
            scale: [1, 1.05, 1],
            transition: {
              duration: 0.5,
              times: [0, 0.5, 1]
            }
          } : undefined}
        />
      </motion.div>
    </AnimatePresence>
  );
}