
export interface GameRecord {
  id?: string;
  name: string;
  attempts: number;
  time_seconds: number;
  created_at?: string;
}

export interface GuessHistory {
  number: number;
  feedback: 'UP' | 'DOWN' | 'CORRECT';
  timestamp: number;
}

export type GameStatus = 'START_SCREEN' | 'PLAYING' | 'SUCCESS';
