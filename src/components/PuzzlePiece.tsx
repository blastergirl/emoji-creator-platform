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
  isHinted: boolean;
}

export default function PuzzlePiece({ piece, onRotate, onDragEnd, isActive, size, isCorrect, boardSize, onClick, isDraggable, isHinted }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        className={`absolute touch-none ${isDraggable ? 'cursor-grab' : 'cursor-default'} 
          ${isCorrect ? 'ring-4 ring-yellow-500 ring-opacity-50' : ''}
          ${isHinted ? 'ring-4 ring-blue-500 ring-opacity-75' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          willChange: 'transform',
          zIndex: isDragging ? 50 : isActive ? 40 : isHinted ? 35 : isCorrect ? 10 : 20,
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
          scale: isHinted ? 1.1 : isActive ? 1.05 : 1,
          opacity: 1,
          boxShadow: isHinted ? "0px 0px 20px rgba(59, 130, 246, 0.5)" : "none"
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
          onClick?.();
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
            ${isCorrect ? 'opacity-100' : 'opacity-90 hover:opacity-100'}
            ${isHinted ? 'border-2 border-blue-500' : ''}`}
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
          animate={isHinted ? {
            scale: [1, 1.1],
          } : undefined}
          transition={{
            repeat: isHinted ? Infinity : 0,
            repeatType: "reverse",
            duration: 0.5
          }}
        >
          {isHinted && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                Goes Here!
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}