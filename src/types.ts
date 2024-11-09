export interface PuzzlePiece {
  id: number;
  rotation: number;
  position: { x: number; y: number };
  imageStyles: {
    backgroundImage: string;
    backgroundSize: string;
    backgroundPosition: string;
  };
  correctPosition: { x: number; y: number };
  correctRotation: number;
}

export interface GameState {
  timeElapsed: number;
  hintsRemaining: number;
  isComplete: boolean;
  score: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  completionTime: number;
}