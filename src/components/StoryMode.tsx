
import React, { useState, useEffect, useRef } from 'react';
import { User, StoryStep, Scenario } from '../types';
import { continueStory, generateScenario } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { Send, Scroll, RefreshCw, Save, Sparkles, Loader2 } from 'lucide-react';
import { useUpgradeModal } from './UpgradeContext';

interface StoryModeProps {
  user: User;
}

const StoryMode: React.FC<StoryModeProps> = ({ user }) => {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<StoryStep[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { triggerUpgrade } = useUpgradeModal();

  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 's1',
      title: '寄远人',
      role: '游学士子',
      desc: '你离家万里游学，家中老父来信，言语间似有隐忧。',
      npcName: '家父',
      openingNarrative: '时值深秋，你在京城客栈苦读。忽得家书一封，见字迹潦草，不似父亲往日严谨。',
      initialLetter: '吾儿如晤：\n\n京城苦寒，不知衣食足否？家中近来有些变故，田产之事颇费周折，乡邻亦多口舌。为父老矣，力不从心。惟愿儿早日成名，归乡主持大局。\n\n切切。'
    },
    {
      id: 's2',
      title: '隐士山居',
      role: '寻访者',
      desc: '你听闻终南山有高人隐居，欲致信求见。',
      npcName: '无名隐士',
      openingNarrative: '终南山云深不知处，你多次寻访未果，只得在山脚茅亭留下一封书信，希望能打动隐士。',
      initialLetter: '（你尚未收到回信，你需要先写一封信去叩门...）' 
    },
    {
      id: 's3',
      title: '边关告急',
      role: '守关将领',
      desc: '边关粮草将尽，你需写信向朝廷求援，却又要顾及朝中权斗。',
      npcName: '兵部尚书',
      openingNarrative: '烽火连三月，大雪封山。粮仓已见底，将士们只能煮雪充饥。朝廷的援军迟迟未到。',
      initialLetter: '（你需要主动上书求援...）'
    }
  ]);

  // Load progress when scenario is selected
  useEffect(() => {
    if (activeScenario && user) {
        dataService.getStoryProgress(user.id, activeScenario.id).then(savedHistory => {
            if (savedHistory && savedHistory.length > 0) {
                setHistory(savedHistory);
            } else {
                // Initialize new scenario
                const initialSteps: StoryStep[] = [
                    { type: 'narrative', content: activeScenario.openingNarrative }
                ];
                if (activeScenario.id === 's1' || activeScenario.isGenerated) {
                   if (activeScenario.initialLetter && !activeScenario.initialLetter.startsWith('（')) {
                        initialSteps.push({ type: 'letter', content: activeScenario.initialLetter, sender: activeScenario.npcName });
                   }
                }
                setHistory(initialSteps);
            }
        });
    }
  }, [activeScenario, user]);

  // Auto-save history
  useEffect(() => {
    if (activeScenario && history.length > 0 && user) {
        dataService.saveStoryProgress(user.id, activeScenario.id, history);
        setLastSaved(new Date());
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, activeScenario, user]);

  const handleSend = async () => {
    if (!input.trim() || !activeScenario) return;

    // Check Quota
    const allowed = await dataService.checkDailyQuota(user.id);
    if (!allowed) {
        triggerUpgrade();
        return;
    }

    // Add User Letter
    const userStep: StoryStep = { type: 'letter', content: input, sender: user.name };
    const newHistory = [...history, userStep];
    setHistory(newHistory);
    setInput('');
    setIsThinking(true);
    await dataService.incrementAiUsage(user.id);

    // Call AI
    const result = await continueStory(
      activeScenario.role,
      activeScenario.title,
      newHistory,
      input
    );

    // Add Narrative
    const narrativeStep: StoryStep = { type: 'narrative', content: result.narrative };
    // Add NPC Letter
    const letterStep: StoryStep = { type: 'letter', content: result.replyLetter, sender: activeScenario.npcName };

    setHistory(prev => [...prev, narrativeStep, letterStep]);
    setIsThinking(false);
  };

  const handleReset = async () => {
    if (!activeScenario || !user) return;
    if (window.confirm("确定要重置当前剧本进度吗？此操作无法撤销。")) {
        await dataService.saveStoryProgress(user.id, activeScenario.id, []);
        // Re-init
        const initialSteps: StoryStep[] = [
            { type: 'narrative', content: activeScenario.openingNarrative }
        ];
        if (activeScenario.id === 's1' || activeScenario.isGenerated) {
           if (activeScenario.initialLetter && !activeScenario.initialLetter.startsWith('（')) {
             initialSteps.push({ type: 'letter', content: activeScenario.initialLetter, sender: activeScenario.npcName });
           }
        }
        setHistory(initialSteps);
    }
  };

  const handleGenerateScenario = async () => {
      // Check Quota
      const allowed = await dataService.checkDailyQuota(user.id);
      if (!allowed) {
          triggerUpgrade();
          return;
      }

      setIsGeneratingScenario(true);
      try {
          const newScenario = await generateScenario();
          newScenario.isGenerated = true;
          setScenarios([newScenario, ...scenarios]);
          await dataService.incrementAiUsage(user.id);
      } catch (e) {
          alert("剧本生成失败，请重试");
      } finally {
          setIsGeneratingScenario(false);
      }
  };

  if (!activeScenario) {
    return (
      <div className="p-10 max-w-6xl mx-auto animate-fade-in">
        <header className="mb-10 text-center">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">剧情尺牍 · Story Letters</h2>
          <p className="text-stone-500">以信推演命运，在笔墨间经历悲欢离合。</p>
        </header>

        <div className="flex justify-end mb-6">
            <button 
              onClick={handleGenerateScenario}
              disabled={isGeneratingScenario}
              className="px-6 py-2 bg-stone-900 text-white rounded-full flex items-center gap-2 hover:bg-stone-700 shadow-lg transition-all"
            >
                {isGeneratingScenario ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                生成新剧本
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {scenarios.map(s => (
            <button 
              key={s.id}
              onClick={() => setActiveScenario(s)}
              className={`bg-white p-8 rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-xl transition-all text-left group relative overflow-hidden ${s.isGenerated ? 'ring-2 ring-amber-100' : ''}`}
            >
              <div className="absolute top-0 right-0 bg-stone-100 px-3 py-1 rounded-bl text-xs text-stone-500 uppercase tracking-wider">
                扮演：{s.role}
              </div>
              <h3 className="text-2xl font-serif font-bold text-stone-900 mb-3 group-hover:text-red-800 transition-colors">{s.title}</h3>
              <p className="text-stone-600 font-serif leading-relaxed line-clamp-3">{s.desc}</p>
              <div className="mt-6 flex items-center text-stone-400 text-sm group-hover:text-stone-900">
                 <Scroll size={16} className="mr-2"/> 开始剧情
              </div>
              {s.isGenerated && (
                  <div className="absolute bottom-2 right-2 text-[10px] text-amber-500 flex items-center gap-1">
                      <Sparkles size={10} /> AI Generated
                  </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto bg-[#f5f5f4] relative">
       {/* Header */}
       <div className="bg-white px-6 py-4 border-b border-stone-200 flex justify-between items-center sticky top-0 z-20 shadow-sm">
         <div>
           <h2 className="text-xl font-serif font-bold text-stone-800">{activeScenario.title}</h2>
           <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>扮演：{activeScenario.role} | 对方：{activeScenario.npcName}</span>
              {lastSaved && <span className="text-stone-400 flex items-center gap-1"><Save size={10}/> 进度已保存</span>}
           </div>
         </div>
         <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="text-stone-400 hover:text-red-600 font-serif flex items-center gap-2 px-3 py-1"
                title="重置剧情"
            >
                <RefreshCw size={16} />
            </button>
            <button 
                onClick={() => setActiveScenario(null)}
                className="text-stone-500 hover:text-stone-800 font-serif px-3 py-1 border border-stone-200 rounded"
            >
                返回目录
            </button>
         </div>
       </div>

       {/* Story Stream */}
       <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-8" style={{backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
         {history.map((step, idx) => {
           if (step.type === 'narrative') {
             return (
               <div key={idx} className="flex justify-center animate-fade-in">
                 <div className="bg-stone-200/50 text-stone-600 text-sm font-serif px-6 py-2 rounded-full shadow-inner italic border border-stone-300/50 max-w-2xl text-center backdrop-blur-sm">
                   {step.content}
                 </div>
               </div>
             );
           } else {
             const isUser = step.sender === user.name;
             return (
               <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                 <div className={`max-w-2xl w-full p-8 shadow-lg relative ${isUser ? 'bg-white' : 'bg-[#fffdf5] border-t-4 border-red-800'}`}>
                   {/* Sender Label */}
                   <div className={`absolute -top-3 ${isUser ? 'right-4' : 'left-4'} bg-stone-800 text-white text-xs px-2 py-1 rounded shadow`}>
                     {step.sender}
                   </div>
                   <div className="font-serif text-lg leading-loose whitespace-pre-wrap text-stone-800">
                     {step.content}
                   </div>
                   {/* Paper Texture Overlay (CSS Pattern) */}
                   <div className="absolute inset-0 pointer-events-none opacity-5" style={{backgroundImage: 'radial-gradient(#44403c 0.5px, transparent 0.5px)', backgroundSize: '12px 12px'}}></div>
                 </div>
               </div>
             );
           }
         })}

         {isThinking && (
            <div className="flex justify-center">
               <div className="flex items-center gap-2 text-stone-400 font-serif animate-pulse bg-white/50 px-4 py-2 rounded-full">
                 <div className="w-2 h-2 bg-stone-400 rounded-full"></div>
                 <span>对方正在研墨构思...</span>
               </div>
            </div>
         )}
         <div ref={bottomRef} />
       </div>

       {/* Input Area */}
       <div className="absolute bottom-0 left-0 right-0 bg-white p-6 border-t border-stone-200 shadow-lg z-20">
         <div className="max-w-4xl mx-auto relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="在此书写回信（系统将自动生成文言回复剧情）..."
              className="w-full h-32 p-4 pr-14 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 font-serif text-lg resize-none"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="absolute bottom-4 right-4 p-3 bg-stone-900 text-white rounded-full hover:bg-stone-700 disabled:opacity-50 transition-all shadow-lg"
            >
              <Send size={20} />
            </button>
         </div>
       </div>
    </div>
  );
};

export default StoryMode;
