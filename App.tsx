
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { GAME_DURATION } from './constants';
import { Gavel, Trophy, Timer, AlertCircle, Briefcase } from 'lucide-react';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lastAdvice, setLastAdvice] = useState<string | null>(null);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (gameState === GameState.PLAYING) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState(GameState.GAME_OVER);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
        if (score > highScore) setHighScore(score);
    }
  }, [gameState, score, highScore]);

  // Clear advice after 4 seconds
  useEffect(() => {
    if (lastAdvice) {
        const t = setTimeout(() => setLastAdvice(null), 4000);
        return () => clearTimeout(t);
    }
  }, [lastAdvice]);

  const startGame = () => {
    audioService.init(); // Start audio context on user gesture
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState(GameState.PLAYING);
    setLastAdvice(null);
  };

  return (
    <div className="relative w-screen h-screen bg-stone-900 overflow-hidden flex flex-col items-center justify-center text-stone-100 font-sans">
      
      {/* Game Layer */}
      <div className="absolute inset-0 z-0">
        <GameCanvas 
            gameState={gameState} 
            setScore={setScore} 
            setLastAdvice={setLastAdvice} 
            timer={timeLeft}
        />
      </div>

      {/* HUD Layer */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="flex flex-col gap-2">
             <div className="bg-stone-900/80 backdrop-blur-md p-4 rounded-lg border border-stone-600 shadow-xl flex items-center gap-4">
                <div className="p-2 bg-amber-600 rounded-full">
                    <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Billable Hours</p>
                    <p className="text-2xl font-serif font-bold text-amber-400">${score.toLocaleString()}</p>
                </div>
             </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
             <div className={`bg-stone-900/80 backdrop-blur-md p-4 rounded-lg border border-stone-600 shadow-xl flex items-center gap-4 transition-colors ${timeLeft < 10 ? 'border-red-500 bg-red-900/50' : ''}`}>
                <div className="text-right">
                    <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Time Remaining</p>
                    <p className={`text-2xl font-serif font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>00:{timeLeft.toString().padStart(2, '0')}</p>
                </div>
                <div className={`p-2 rounded-full ${timeLeft < 10 ? 'bg-red-600' : 'bg-stone-700'}`}>
                    <Timer className="w-6 h-6 text-white" />
                </div>
             </div>
        </div>
      </div>

      {/* Toast Notification for Legal Advice */}
      {lastAdvice && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 animate-bounce-in w-full max-w-xl px-4 pointer-events-none">
              <div className="bg-white text-stone-900 p-6 rounded-xl shadow-2xl border-l-8 border-red-600 flex items-start gap-4">
                  <div className="mt-1">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider text-red-800 mb-1">Legal Objection Filed</h3>
                      <p className="font-serif italic text-xl leading-relaxed">"{lastAdvice}"</p>
                  </div>
              </div>
          </div>
      )}

      {/* MENU SCREEN */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-30 bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="text-center max-w-2xl p-8 border-4 border-double border-amber-600 bg-stone-800 rounded-lg shadow-2xl">
                <div className="flex justify-center mb-6">
                    <Gavel className="w-24 h-24 text-amber-500" />
                </div>
                <h1 className="text-6xl font-serif font-bold text-amber-500 mb-2">Turkey Law</h1>
                <h2 className="text-2xl text-stone-400 mb-8 font-light">Firm of Feldman & Fowl</h2>
                
                <p className="mb-8 text-lg text-stone-300 leading-relaxed">
                    The turkeys have taken over the law firm. As the managing partner (and hunter), 
                    it's your job to serve some "writs of habeas corpus" (bullets). 
                    <br/><br/>
                    <span className="text-amber-400 italic">Turn up your volume for maximum litigation!</span>
                </p>

                <button 
                    onClick={startGame}
                    className="group relative px-8 py-4 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-xl rounded transition-all transform hover:scale-105 hover:shadow-lg flex items-center gap-3 mx-auto"
                >
                    <Briefcase className="w-6 h-6" />
                    <span>Enter The Courtroom</span>
                </button>
            </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-30 bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
             <div className="text-center max-w-xl p-8 border border-red-900 bg-stone-900 rounded-lg shadow-2xl">
                <h1 className="text-5xl font-serif font-bold text-red-500 mb-2">Mistrial!</h1>
                <p className="text-stone-400 mb-8">Time's up. The jury is hung (and hungry).</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-stone-800 p-4 rounded border border-stone-700">
                        <p className="text-xs uppercase text-stone-500 font-bold">Final Billable</p>
                        <p className="text-3xl font-serif text-amber-400">${score.toLocaleString()}</p>
                    </div>
                    <div className="bg-stone-800 p-4 rounded border border-stone-700">
                        <p className="text-xs uppercase text-stone-500 font-bold">Firm Record</p>
                        <p className="text-3xl font-serif text-white">${highScore.toLocaleString()}</p>
                    </div>
                </div>

                <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-stone-100 hover:bg-white text-stone-900 font-bold text-xl rounded transition-all flex items-center gap-3 mx-auto"
                >
                    <Gavel className="w-6 h-6" />
                    <span>File Appeal (Replay)</span>
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;
