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
}

export default function PuzzlePiece({ piece, onRotate, onDragEnd, isActive, size, isCorrect, boardSize, onClick }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        className={`absolute cursor-grab ${isCorrect ? 'ring-4 ring-yellow-500 ring-opacity-50' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
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
          opacity: 1
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          opacity: { duration: 0.2 }
        }}
        drag
        dragMomentum={false}
        dragElastic={0}
        whileHover={{ 
          scale: isCorrect ? 1 : 1.05,
          boxShadow: "0px 5px 15px rgba(0,0,0,0.3)"
        }}
        whileDrag={{ 
          scale: 1.1,
          zIndex: 50,
          boxShadow: "0px 10px 25px rgba(0,0,0,0.4)"
        }}
        onDragStart={() => setIsDragging(true)}
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
            ${isCorrect ? 'opacity-100 cursor-default' : 'opacity-90 hover:opacity-100'}`}
          onClick={() => !isDragging && !isCorrect && onRotate(piece.id)}
          style={piece.imageStyles}
          whileHover={!isCorrect && {
            filter: "brightness(1.2)"
          }}
          animate={isCorrect ? {
            scale: [1, 1.05, 1],
            transition: {
              duration: 0.5,
              times: [0, 0.5, 1]
            }
          } : {}}
        />
      </motion.div>
    </AnimatePresence>
  );
}