import React, { useState, useEffect, useRef } from 'react';
import { User, FlyingFlowerTurn, FlyingFlowerGame } from '../types';
import { judgePoem, getPoemHint } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { Send, RefreshCw, Trophy, HelpCircle, AlertCircle, Flower } from 'lucide-react';

interface FlyingFlowerProps {
  user: User;
}

const FlyingFlower: React.FC<FlyingFlowerProps> = ({ user }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover'>('intro');
  const [keyword, setKeyword] = useState('月');
  const [turns, setTurns] = useState<FlyingFlowerTurn[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHighScore();
  }, [user.id]);

  useEffect(() => {
    if (gameState === 'playing') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, gameState]);

  const loadHighScore = async () => {
    const hs = await dataService.getFlyingFlowerHighscore(user.id);
    setHighScore(hs);
  };

  const startGame = () => {
    const keywords = ['月', '花', '春', '风', '山', '水', '云', '酒', '梦', '夜'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    setKeyword(randomKeyword);
    setGameState('playing');
    setScore(0);
    setTurns([{
        sender: 'ai',
        verse: `飞花令起，令字为“${randomKeyword}”。请君先赋。`,
        isCorrect: true
    }]);
    setInput('');
    setHint(null);
  };

  const endGame = async (reason: string) => {
    setGameState('gameover');
    
    const lastTurn: FlyingFlowerTurn = { 
        sender: 'ai', 
        verse: `游戏结束：${reason}`, 
        isCorrect: false 
    };
    
    const finalTurns = [...turns, lastTurn];
    setTurns(finalTurns);
    
    if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(`u_${user.id}_ff_highscore`, score.toString());
    }

    const gameRecord: FlyingFlowerGame = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        keyword,
        score,
        turns: finalTurns
    };
    await dataService.saveFlyingFlowerGame(user.id, gameRecord);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    
    // Check if user has enough AI quota
    const allowed = await dataService.checkDailyQuota(user.id);
    if (!allowed) {
        alert("今日AI额度已用尽，请升级会员。");
        return;
    }

    const userVerse = input.trim();
    
    // Optimistic Update
    const newTurns = [...turns, { sender: 'user' as const, verse: userVerse }];
    setTurns(newTurns);
    setInput('');
    setIsThinking(true);
    setHint(null); // Clear hint on submit
    
    // Collect history of verses for duplicate checking
    const historyVerses = turns.map(t => t.verse);

    try {
        const judgment = await judgePoem(keyword, userVerse, historyVerses);
        
        // Update user turn validity based on judgment
        const turnsWithValidity = [...newTurns];
        turnsWithValidity[turnsWithValidity.length - 1].isCorrect = judgment.valid;
        if (!judgment.valid) {
            turnsWithValidity[turnsWithValidity.length - 1].reason = judgment.reason;
        }
        setTurns(turnsWithValidity);

        if (judgment.valid) {
            setScore(s => s + 1);
            await dataService.incrementAiUsage(user.id);
            
            // AI Turn
            if (judgment.aiReply) {
                setTurns(prev => [...prev, {
                    sender: 'ai',
                    verse: judgment.aiReply,
                    isCorrect: true
                }]);
            } else {
                // AI failed to reply (rare)
                endGame("在下才疏学浅，接不上来了。足下获胜！");
            }
        } else {
            endGame(judgment.reason || "不合令律");
        }
    } catch (e) {
        console.error(e);
        endGame("裁判网络开小差了...");
    } finally {
        setIsThinking(false);
    }
  };

  const handleGetHint = async () => {
      if (isThinking) return;
      setIsThinking(true);
      const hintVerse = await getPoemHint(keyword);
      setHint(hintVerse);
      setIsThinking(false);
      await dataService.incrementAiUsage(user.id);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-[#f5f5f4] relative rounded-xl overflow-hidden shadow-sm border border-stone-200">
       {/* Header */}
       <div className="bg-white p-4 border-b border-stone-200 flex justify-between items-center z-10">
           <div className="flex items-center gap-2">
               <Flower className="text-red-800" size={24} />
               <h2 className="text-xl font-serif font-bold text-stone-800">飞花令</h2>
           </div>
           <div className="flex items-center gap-4 text-sm font-serif">
               <div className="flex items-center gap-1 text-stone-500">
                   <Trophy size={16} /> 最高: {highScore}
               </div>
               {gameState === 'playing' && (
                   <div className="font-bold text-red-800 text-lg px-3 py-1 bg-red-50 rounded">
                       令：{keyword}
                   </div>
               )}
           </div>
       </div>

       {/* Game Content */}
       <div className="flex-1 overflow-hidden relative flex flex-col">
           {gameState === 'intro' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                   <div className="mb-8 p-6 border-4 border-double border-stone-800 rounded-lg bg-white/80 backdrop-blur-sm text-center max-w-md">
                       <h3 className="text-3xl font-calligraphy text-stone-900 mb-4">游戏规则</h3>
                       <p className="font-serif text-stone-600 leading-relaxed mb-4">
                           系统指定一字为“令”，双方轮流背诵含有该字的古典诗词名句。<br/>
                           不可重复，不可杜撰。<br/>
                           胜者，文采风流；败者，罚酒三杯。
                       </p>
                       <button 
                           onClick={startGame}
                           className="px-8 py-3 bg-red-900 text-white font-bold font-serif rounded shadow hover:bg-red-800 transition-colors"
                       >
                           开始对弈
                       </button>
                   </div>
               </div>
           )}

           {(gameState === 'playing' || gameState === 'gameover') && (
               <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                   {turns.map((turn, idx) => (
                       <div key={idx} className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                           <div className={`
                               max-w-[80%] p-4 rounded-lg font-serif text-lg shadow-sm border relative
                               ${turn.sender === 'user' 
                                   ? 'bg-white border-stone-200 text-stone-800' 
                                   : 'bg-[#fffdf5] border-stone-200 text-stone-900'
                               }
                               ${turn.isCorrect === false ? 'border-red-500 bg-red-50' : ''}
                           `}>
                               {turn.verse}
                               
                               {/* Keyword Highlighting */}
                               {turn.isCorrect !== false && turn.sender !== 'ai' && (
                                   <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1 rounded-full">Valid</span>
                               )}

                               {turn.reason && (
                                   <div className="mt-2 text-sm text-red-600 flex items-center gap-1 border-t border-red-200 pt-1">
                                       <AlertCircle size={12}/> {turn.reason}
                                   </div>
                               )}
                           </div>
                       </div>
                   ))}
                   
                   {isThinking && (
                       <div className="flex justify-start">
                           <div className="bg-white p-3 rounded-lg border border-stone-200 flex gap-1">
                               <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                               <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"></div>
                               <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"></div>
                           </div>
                       </div>
                   )}
                   <div ref={bottomRef} />
               </div>
           )}

           {gameState === 'gameover' && (
               <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur p-6 border-t border-stone-200 flex flex-col items-center z-20 animate-slide-up">
                   <h3 className="text-2xl font-serif font-bold text-stone-800 mb-2">本局得分: {score}</h3>
                   <button 
                       onClick={startGame}
                       className="px-6 py-2 bg-stone-900 text-white rounded font-serif hover:bg-stone-700 flex items-center gap-2"
                   >
                       <RefreshCw size={18} /> 再来一局
                   </button>
               </div>
           )}
       </div>

       {/* Input Area */}
       {gameState === 'playing' && (
           <div className="p-4 bg-white border-t border-stone-200">
               {hint && (
                   <div className="mb-2 text-sm text-stone-500 bg-stone-50 p-2 rounded border border-stone-100 flex justify-between items-center animate-fade-in">
                       <span>提示：{hint}</span>
                       <button onClick={() => setHint(null)}><AlertCircle size={14} className="text-stone-300"/></button>
                   </div>
               )}
               <div className="flex gap-2">
                   <button 
                       onClick={handleGetHint}
                       disabled={isThinking}
                       className="p-3 text-stone-400 hover:text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50"
                       title="提示"
                   >
                       <HelpCircle size={20} />
                   </button>
                   <input 
                       type="text" 
                       value={input}
                       onChange={e => setInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleSend()}
                       placeholder={`请输入含有“${keyword}”字的诗句...`}
                       className="flex-1 p-3 border border-stone-300 rounded-lg font-serif focus:outline-none focus:ring-2 focus:ring-stone-500"
                   />
                   <button 
                       onClick={handleSend}
                       disabled={!input.trim() || isThinking}
                       className="p-3 bg-stone-900 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
                   >
                       <Send size={20} />
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default FlyingFlower;
