export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Turkey {
  id: string;
  x: number;
  y: number;
  scale: number;
  speedX: number;
  speedY: number;
  state: 'RUNNING' | 'HIT' | 'FLEEING';
  variant: number; // 0: Normal, 1: Partner (Suit), 2: Intern (Coffee)
  frame: number; // For animation
  deathTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface LegalAdvice {
  text: string;
  author: string;
}
