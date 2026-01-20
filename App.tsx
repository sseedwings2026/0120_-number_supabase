
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { GameRecord, GuessHistory, GameStatus } from './types';

// Components
const Header = () => (
  <header className="mb-8 text-center">
    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
      Number Guessing Pro
    </h1>
    <p className="text-slate-400 mt-2">1부터 100 사이의 숫자를 맞춰보세요!</p>
  </header>
);

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('START_SCREEN');
  const [playerName, setPlayerName] = useState('');
  const [bestRecord, setBestRecord] = useState<GameRecord | null>(null);
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [history, setHistory] = useState<GuessHistory[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Fetch Best Record
  const fetchBestRecord = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_records')
        .select('*')
        .order('attempts', { ascending: true })
        .order('time_seconds', { ascending: true })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setBestRecord(data[0]);
      }
    } catch (err) {
      console.error('Error fetching record:', err);
    }
  }, []);

  useEffect(() => {
    fetchBestRecord();
  }, [fetchBestRecord]);

  const startGame = () => {
    if (!playerName.trim()) {
      alert('이름을 입력해주세요!');
      return;
    }
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setHistory([]);
    setStartTime(Date.now());
    setStatus('PLAYING');
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(currentGuess);
    if (isNaN(num) || num < 1 || num > 100) {
      alert('1에서 100 사이의 숫자를 입력하세요.');
      return;
    }

    let feedback: 'UP' | 'DOWN' | 'CORRECT';
    if (num < targetNumber) feedback = 'UP';
    else if (num > targetNumber) feedback = 'DOWN';
    else feedback = 'CORRECT';

    const newGuess: GuessHistory = {
      number: num,
      feedback,
      timestamp: Date.now()
    };

    setHistory([newGuess, ...history]);
    setCurrentGuess('');

    if (feedback === 'CORRECT') {
      const finishTime = Date.now();
      setEndTime(finishTime);
      handleSuccess(history.length + 1, (finishTime - startTime) / 1000);
    }
  };

  const handleSuccess = async (attempts: number, timeSec: number) => {
    setStatus('SUCCESS');
    
    // Check if it's a new personal record or better than global record
    // In this app, we save every result as long as user finishes.
    // The "best" will be determined by query.
    setLoading(true);
    try {
      const { error } = await supabase
        .from('game_records')
        .insert([{
          name: playerName,
          attempts,
          time_seconds: parseFloat(timeSec.toFixed(2))
        }]);
      
      if (error) throw error;
      await fetchBestRecord(); // Refresh best record
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setPlayerName('');
    setStatus('START_SCREEN');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <Header />

        {status === 'START_SCREEN' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Best Record Box */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-emerald-500/30">
              <h2 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-2">🏆 현재 최고 기록</h2>
              {bestRecord ? (
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold">{bestRecord.name}</div>
                    <div className="text-slate-400 text-xs">최고 도전자</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-mono text-xl">{bestRecord.attempts}회 / {bestRecord.time_seconds}초</div>
                    <div className="text-slate-500 text-[10px]">{new Date(bestRecord.created_at!).toLocaleDateString()}</div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">아직 기록이 없습니다. 첫 주인공이 되어보세요!</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-slate-300 font-medium">당신의 이름</label>
              <input
                type="text"
                placeholder="도전자 이름을 입력하세요"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
              />
            </div>

            <button
              onClick={startGame}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transform active:scale-95 transition-all"
            >
              게임 시작하기
            </button>
          </div>
        )}

        {status === 'PLAYING' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center px-2">
              <div className="text-slate-400 text-sm">진행중: <span className="text-white font-bold">{playerName}</span></div>
              <div className="text-slate-400 text-sm">시도횟수: <span className="text-blue-400 font-mono font-bold">{history.length}</span></div>
            </div>

            <form onSubmit={handleGuess} className="relative group">
              <input
                autoFocus
                type="number"
                min="1"
                max="100"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                placeholder="?"
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl py-8 text-center text-6xl font-black outline-none focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="submit"
                className="absolute right-4 bottom-4 bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest px-1">최근 시도 이력</h3>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 border-2 border-dashed border-slate-700 rounded-xl">
                    숫자를 입력하고 Enter를 누르세요!
                  </div>
                ) : (
                  history.map((h, i) => (
                    <div
                      key={h.timestamp}
                      className={`flex justify-between items-center p-3 rounded-xl border ${
                        i === 0 ? 'bg-slate-700/50 border-blue-500/50 scale-[1.02]' : 'bg-slate-900/30 border-slate-700'
                      } transition-all`}
                    >
                      <span className="text-xl font-bold">{h.number}</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        h.feedback === 'UP' ? 'text-amber-400 bg-amber-400/10' : 'text-rose-400 bg-rose-400/10'
                      }`}>
                        {h.feedback === 'UP' ? 'UP ▲' : 'DOWN ▼'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative text-7xl mb-4">🎉</div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white">정답입니다!</h2>
              <p className="text-slate-400">당신의 기록을 저장했습니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-500 uppercase font-bold">시도 횟수</div>
                <div className="text-2xl font-black text-blue-400">{history.length}회</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-500 uppercase font-bold">걸린 시간</div>
                <div className="text-2xl font-black text-emerald-400">{((endTime - startTime) / 1000).toFixed(2)}초</div>
              </div>
            </div>

            <button
              onClick={resetGame}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? '기록 저장 중...' : '다시 도전하기'}
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-slate-600 text-xs">
        Powered by Supabase & React 18
      </p>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
