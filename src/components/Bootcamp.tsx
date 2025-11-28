
import React, { useState, useEffect } from 'react';
import { CheckCircle, Lock, Book, PenTool, ChevronRight, Loader2, Save } from 'lucide-react';
import { evaluateExercise } from '../services/geminiService';
import { User } from '../types';
import { dataService } from '../services/dataService';
import { useUpgradeModal } from './UpgradeContext';

interface DayTask {
  day: number;
  title: string;
  topic: string;
  lesson: string;
  taskPrompt: string;
}

interface UserProgress {
  completedDays: number[];
  submissions: Record<number, {
    input: string;
    feedback: { pass: boolean; feedback: string } | null;
  }>;
}

interface BootcampProps {
  user: User;
}

const Bootcamp: React.FC<BootcampProps> = ({ user }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [input, setInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{pass: boolean, feedback: string} | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({ completedDays: [], submissions: {} });
  const { triggerUpgrade } = useUpgradeModal();

  const curriculum: DayTask[] = [
    {
      day: 1,
      title: '开篇之礼',
      topic: '提称与寒暄',
      lesson: '尺牍之始，必先正名。对师长用“函丈”，对平辈用“足下”。寒暄需结合时令，如“秋色方深，伏惟珍摄”。',
      taskPrompt: '请写一段给老师的信件开头，包含提称（函丈）和关于春天的寒暄。'
    },
    {
      day: 2,
      title: '叙事之简',
      topic: '叙事',
      lesson: '文言叙事，贵在“省净”。多用单音节词，少用虚词。如“我想买本书”可作“欲购一书”。',
      taskPrompt: '将“我最近生病了，好久没出门”改写为文言短句。'
    },
    {
      day: 3,
      title: '情深意重',
      topic: '抒情',
      lesson: '尺牍之魂在情。表达思念常用“驰系良深”、“寤寐求之”。切忌直白大喊，宜委婉含蓄。',
      taskPrompt: '写两句表达对远方朋友思念的话。'
    },
    {
      day: 4,
      title: '求人之道',
      topic: '请托',
      lesson: '求人办事，语气需谦恭。常用“敢祈”、“幸甚”、“不情之请”。',
      taskPrompt: '试写一句请求朋友帮忙借钱或借物的委婉语。'
    },
    {
      day: 5,
      title: '感荷之心',
      topic: '致谢',
      lesson: '受人恩惠，必由衷致谢。如“深荷厚意”、“铭感五内”。',
      taskPrompt: '收到朋友送的茶叶，写一句致谢辞。'
    },
    {
      day: 6,
      title: '收束有力',
      topic: '结语',
      lesson: '信末不可突然中断。常用“临书仓卒”、“不尽欲言”作为过渡，再接“敬颂教安”等祝词。',
      taskPrompt: '写一段给长辈的信件结尾，包含自谦和祝颂。'
    },
    {
      day: 7,
      title: '完满出师',
      topic: '全篇创作',
      lesson: '综合运用前六日所学，完成一封完整的短札。',
      taskPrompt: '写一封短信给同窗，邀其春日踏青。'
    }
  ];

  const currentDayData = curriculum.find(c => c.day === activeDay) || curriculum[0];
  
  // Load initial progress
  useEffect(() => {
    const loadProgress = async () => {
        const progress = await dataService.getBootcampProgress(user.id);
        setUserProgress(progress);
    };
    loadProgress();
    setActiveDay(1);
  }, [user.id]);

  // Load input and feedback when active day changes
  useEffect(() => {
    const savedData = userProgress.submissions[activeDay];
    if (savedData) {
      setInput(savedData.input);
      setFeedback(savedData.feedback);
    } else {
      setInput('');
      setFeedback(null);
    }
  }, [activeDay, userProgress.submissions]); 

  const handleSubmit = async () => {
    if (!input.trim()) return;

    // Check Quota (Fix for Monetization Loophole)
    const allowed = await dataService.checkDailyQuota(user.id);
    if (!allowed) {
        triggerUpgrade();
        return;
    }

    setIsEvaluating(true);
    
    const result = await evaluateExercise(currentDayData.taskPrompt, input);
    
    setFeedback(result);
    setIsEvaluating(false);

    // Update Progress State
    const newProgress = { ...userProgress };
    
    // Add to completed days if passed
    if (result.pass && !newProgress.completedDays.includes(activeDay)) {
        newProgress.completedDays = [...newProgress.completedDays, activeDay];
    }
    
    // Update submissions
    newProgress.submissions = {
        ...newProgress.submissions,
        [activeDay]: {
            input: input,
            feedback: result
        }
    };
    
    setUserProgress(newProgress);
    await dataService.saveBootcampProgress(user.id, newProgress);

    // Track usage
    await dataService.incrementAiUsage(user.id);

    // Update Global Activity (Writing count)
    const recent = await dataService.getRecentActivity(user.id, 1);
    const todayData = recent[0];
    await dataService.updateActivity(user.id, {
        wordsWritten: todayData.wordsWritten + input.length
    });
  };

  return (
    <div className="flex h-full max-w-7xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden border border-stone-200 my-4">
      {/* Sidebar - Roadmap */}
      <div className="w-64 bg-stone-50 border-r border-stone-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-xl font-serif font-bold text-stone-800">七日文言特训</h2>
          <p className="text-xs text-stone-500 mt-1">从入门到精通</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {curriculum.map((item) => {
            const isDone = userProgress.completedDays.includes(item.day);
            const isLocked = item.day > 1 && !userProgress.completedDays.includes(item.day - 1) && !isDone;
            const isActive = activeDay === item.day;

            return (
              <button
                key={item.day}
                disabled={isLocked}
                onClick={() => setActiveDay(item.day)}
                className={`w-full flex items-center p-3 rounded-lg border text-left transition-all
                  ${isActive ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-600'}
                  ${isLocked ? 'opacity-50 cursor-not-allowed bg-stone-50' : ''}
                `}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 text-sm font-bold font-serif
                  ${isActive ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-600'}
                `}>
                  {item.day}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold font-serif">{item.title}</p>
                  <p className="text-xs opacity-80">{item.topic}</p>
                </div>
                {isDone && <CheckCircle size={16} className="text-green-600 ml-2" />}
                {isLocked && <Lock size={16} className="text-stone-400 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - Lesson & Task */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Roadmap Toggle - Simple dropdown for mobile users could be added here, currently defaulting to first available */}
        <div className="md:hidden p-4 bg-stone-100 border-b border-stone-200 flex overflow-x-auto gap-2">
           {curriculum.map(item => {
               const isDone = userProgress.completedDays.includes(item.day);
               const isLocked = item.day > 1 && !userProgress.completedDays.includes(item.day - 1) && !isDone;
               return (
                   <button 
                    key={item.day}
                    disabled={isLocked}
                    onClick={() => setActiveDay(item.day)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border 
                        ${activeDay === item.day ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-300'}
                        ${isLocked ? 'opacity-50' : ''}
                    `}
                   >
                       {isDone ? <CheckCircle size={14} /> : item.day}
                   </button>
               )
           })}
        </div>

        {/* Lesson Header */}
        <div className="p-8 border-b border-stone-200 bg-stone-50/50">
           <div className="flex items-center space-x-2 text-stone-500 text-sm font-bold uppercase tracking-wider mb-2">
              <Book size={16} />
              <span>Day {currentDayData.day} Lesson</span>
           </div>
           <h3 className="text-3xl font-serif font-bold text-stone-900 mb-4">{currentDayData.topic}</h3>
           <div className="prose prose-stone prose-lg font-serif leading-relaxed text-stone-700 max-w-none">
             {currentDayData.lesson}
           </div>
        </div>

        {/* Task Area */}
        <div className="flex-1 p-8 bg-white flex flex-col overflow-y-auto">
           <div className="flex items-center space-x-2 text-stone-500 text-sm font-bold uppercase tracking-wider mb-4">
              <PenTool size={16} />
              <span>Daily Task</span>
           </div>
           
           <div className="bg-stone-50 border border-stone-200 p-4 rounded-lg mb-6">
             <p className="font-serif text-stone-800 font-bold">{currentDayData.taskPrompt}</p>
           </div>

           <textarea
             value={input}
             onChange={(e) => setInput(e.target.value)}
             className="w-full flex-1 p-6 border border-stone-300 rounded-xl font-serif text-lg focus:ring-2 focus:ring-stone-900 focus:outline-none resize-none mb-4"
             placeholder="在此处完成今日作业..."
           />

           {feedback && (
             <div className={`p-4 rounded-lg mb-4 flex items-start gap-3 ${feedback.pass ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                {feedback.pass ? <CheckCircle className="text-green-700 shrink-0 mt-1" /> : <Loader2 className="text-amber-700 shrink-0 mt-1 animate-spin" />} 
                <div>
                  <h4 className={`font-bold text-sm ${feedback.pass ? 'text-green-800' : 'text-amber-800'}`}>
                    {feedback.pass ? '考核通过' : '需改进'}
                  </h4>
                  <p className="text-sm text-stone-700 mt-1">{feedback.feedback}</p>
                </div>
             </div>
           )}

           <div className="flex justify-end">
             <button 
               onClick={handleSubmit}
               disabled={isEvaluating || !input.trim()}
               className="px-8 py-3 bg-stone-900 text-white rounded-lg font-serif hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2"
             >
               {isEvaluating ? (
                 <>
                   <Loader2 size={18} className="animate-spin" /> 评阅中...
                 </>
               ) : (
                 <>
                   {feedback ? '保存并重新提交' : '提交作业'} <ChevronRight size={18} />
                 </>
               )}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Bootcamp;
