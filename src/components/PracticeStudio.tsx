
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, Sparkles, History, List } from 'lucide-react';
import { generateQuiz } from '../services/geminiService';
import { QuizQuestion, User, QuizResult } from '../types';
import { dataService } from '../services/dataService';

// Large Question Database (Fallback)
const QUESTION_DB: QuizQuestion[] = [
  // Single Choice
  { id: '1', type: 'single', question: '信中开头欲表达“很久没有通信”，下列哪一词最为得体？', options: ['好久不见', '久疏笺候', '没怎么写信', '别来无恙'], correctAnswer: '久疏笺候', explanation: '“久疏笺候”专指书信往来稀疏，甚为得体。', tags: ['greetings'] },
  { id: '2', type: 'single', question: '给老师写信，提称（开头称呼）应使用：', options: ['足下', '膝下', '函丈', '如晤'], correctAnswer: '函丈', explanation: '“函丈”是对师长的尊称。', tags: ['honorifics'] },
  { id: '3', type: 'single', question: '“伏惟珍摄”中的“珍摄”意为：', options: ['珍惜摄影', '保重身体', '珍藏书信', '摄取营养'], correctAnswer: '保重身体', explanation: '“珍摄”意为珍重、保养。', tags: ['vocabulary'] },
  { id: '4', type: 'single', question: '下列哪个词不适合用于结尾祝颂？', options: ['顺颂时绥', '即问近佳', '敬请道安', '久仰大名'], correctAnswer: '久仰大名', explanation: '“久仰大名”是初次见面的客套话，不用于结尾祝颂。', tags: ['closing'] },
  { id: '5', type: 'single', question: '“惠书敬悉”中“惠书”指：', options: ['实惠的书', '智慧的书', '对方的来信', '赠送的书'], correctAnswer: '对方的来信', explanation: '“惠”是敬辞，称对方的来信为“惠书”。', tags: ['honorifics'] },
  // ... (More fallback questions can be added here if needed)
];

const PracticeStudio: React.FC = () => {
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | string[] | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStats, setHistoryStats] = useState<{total: number, correct: number, masteredTags: string[]}>({total: 0, correct: 0, masteredTags: []});

  useEffect(() => {
    const stored = localStorage.getItem('ink_currentUser');
    if (stored) {
        setUser(JSON.parse(stored));
    }
    startNewSession();
  }, []);

  const loadStats = async () => {
    if (!user) return;
    const history = await dataService.getQuizHistory(user.id);
    const correct = history.filter(h => h.isCorrect).length;
    
    // Simple logic to find "mastered" tags (tags appearing in correct answers > 5 times)
    const tagCounts: Record<string, number> = {};
    history.filter(h => h.isCorrect).forEach(h => {
        h.tags?.forEach(t => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
    });
    const mastered = Object.keys(tagCounts).filter(t => tagCounts[t] >= 3);
    
    setHistoryStats({
        total: history.length,
        correct,
        masteredTags: mastered
    });
  };

  const startNewSession = () => {
    // Shuffle and pick 5 questions from DB
    const shuffled = [...QUESTION_DB].sort(() => 0.5 - Math.random());
    setSessionQuestions(shuffled.slice(0, 5));
    resetState();
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    await loadStats(); // Update stats before generating
    
    // Pass mastered topics to filter
    const newQuestions = await generateQuiz(5, historyStats.masteredTags);
    
    if (newQuestions && newQuestions.length > 0) {
        setSessionQuestions(newQuestions);
        resetState();
    } else {
        alert("AI 出题失败，请稍后重试。");
    }
    setIsGenerating(false);
  };

  const resetState = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setTextInput('');
    setShowResult(false);
    setScore(0);
    setIsSessionFinished(false);
  };

  const currentQuestion = sessionQuestions[currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (showResult) return;

    if (currentQuestion.type === 'single') {
      setSelectedOption(option);
    } else if (currentQuestion.type === 'multi') {
      const current = (selectedOption as string[]) || [];
      if (current.includes(option)) {
        setSelectedOption(current.filter(o => o !== option));
      } else {
        setSelectedOption([...current, option]);
      }
    }
  };

  const checkAnswer = async () => {
    let isCorrect = false;
    
    if (currentQuestion.type === 'single') {
      isCorrect = selectedOption === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'multi') {
      const userAns = (selectedOption as string[]) || [];
      const correctAns = currentQuestion.correctAnswer as string[]; 
      if (Array.isArray(correctAns)) {
          isCorrect = userAns.length === correctAns.length && userAns.every(a => correctAns.includes(a));
      }
    } else if (currentQuestion.type === 'fill') {
      isCorrect = textInput.trim() === currentQuestion.correctAnswer;
    }

    if (isCorrect) setScore(s => s + 1);
    setShowResult(true);

    // Save History
    if (user) {
        const result: QuizResult = {
            questionId: currentQuestion.id,
            isCorrect,
            timestamp: new Date().toISOString(),
            tags: currentQuestion.tags
        };
        await dataService.saveQuizResult(user.id, result);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setTextInput('');
      setShowResult(false);
    } else {
      setIsSessionFinished(true);
    }
  };

  const toggleHistory = async () => {
      if (!showHistoryModal) {
          await loadStats();
      }
      setShowHistoryModal(!showHistoryModal);
  };

  if (!currentQuestion) return <div className="p-10 text-center">Loading...</div>;

  if (isSessionFinished) {
    return (
      <div className="p-10 max-w-3xl mx-auto flex flex-col items-center animate-fade-in">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-stone-200 text-center w-full">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-4">修习完成</h2>
          <div className="text-6xl font-bold text-stone-900 mb-4">{score} / {sessionQuestions.length}</div>
          <p className="text-stone-500 mb-8 font-serif">
            {score === sessionQuestions.length ? '独占鳌头，佩服佩服！' : score > sessionQuestions.length / 2 ? '学业有成，仍需精进。' : '勤能补拙，请再接再厉。'}
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={startNewSession}
              className="px-8 py-3 bg-white border border-stone-300 text-stone-800 rounded hover:bg-stone-50 font-serif inline-flex items-center gap-2"
            >
              <RefreshCw size={18} /> 题库重练
            </button>
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-8 py-3 bg-stone-900 text-white rounded hover:bg-stone-800 font-serif inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? '出题中...' : <><Sparkles size={18} /> AI 出题</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 max-w-3xl mx-auto flex flex-col items-center relative">
      <header className="mb-8 text-center flex items-center justify-center gap-4 relative w-full">
        <div>
            <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">习练工坊</h2>
            <p className="text-stone-500">每日一练，积跬步以至千里。</p>
        </div>
        <button 
            onClick={toggleHistory}
            className="absolute right-0 top-0 text-stone-400 hover:text-stone-800 p-2"
            title="查看历史统计"
        >
            <History size={24} />
        </button>
      </header>

      {/* History Stats Modal */}
      {showHistoryModal && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
              <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold font-serif mb-6 text-center">修习记录</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-stone-50 p-4 rounded text-center">
                          <p className="text-xs text-stone-400 uppercase">总答题数</p>
                          <p className="text-3xl font-bold text-stone-800">{historyStats.total}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded text-center">
                          <p className="text-xs text-green-600 uppercase">正确率</p>
                          <p className="text-3xl font-bold text-green-800">
                              {historyStats.total > 0 ? Math.round((historyStats.correct / historyStats.total) * 100) : 0}%
                          </p>
                      </div>
                  </div>
                  <div>
                      <p className="text-sm font-bold text-stone-700 mb-2">已掌握知识点 (AI将自动避开)：</p>
                      <div className="flex flex-wrap gap-2">
                          {historyStats.masteredTags.length > 0 ? historyStats.masteredTags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded-full">{tag}</span>
                          )) : <p className="text-xs text-stone-400 italic">暂无掌握标签，继续努力！</p>}
                      </div>
                  </div>
                  <button onClick={() => setShowHistoryModal(false)} className="w-full mt-6 py-2 bg-stone-900 text-white rounded">关闭</button>
              </div>
          </div>
      )}

      <div className="w-full bg-white p-8 rounded-xl shadow-sm border border-stone-200 relative overflow-hidden transition-all min-h-[500px] flex flex-col">
        {/* Decorative Seal Background */}
        <div className="absolute -top-10 -right-10 w-40 h-40 opacity-5 pointer-events-none">
           <svg viewBox="0 0 100 100" className="fill-stone-900">
             <circle cx="50" cy="50" r="40" />
           </svg>
        </div>

        <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-stone-400">QUESTION {currentQuestionIndex + 1} / {sessionQuestions.length}</span>
            <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded text-xs font-bold uppercase">
              {currentQuestion.type === 'single' ? '单选题' : currentQuestion.type === 'multi' ? '多选题' : '填空题'}
            </span>
        </div>

        <h3 className="text-xl font-serif text-stone-900 mb-8 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Render Options based on type */}
        <div className="space-y-3 mb-8 flex-1">
          {(currentQuestion.type === 'single' || currentQuestion.type === 'multi') && currentQuestion.options?.map((option) => {
            let btnClass = "w-full p-4 text-left rounded-lg border transition-all font-serif relative ";
            
            const isSelected = currentQuestion.type === 'single' 
              ? selectedOption === option 
              : (selectedOption as string[])?.includes(option);

            if (showResult) {
               // Type casting safe check for answer
               const correctArr = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer];
               const isCorrectAns = correctArr.includes(option);

               if (isCorrectAns) {
                 btnClass += "bg-green-50 border-green-500 text-green-800";
               } else if (isSelected) {
                 btnClass += "bg-red-50 border-red-500 text-red-800";
               } else {
                 btnClass += "bg-white border-stone-200 opacity-50";
               }
            } else {
               btnClass += isSelected
                ? "bg-stone-800 border-stone-800 text-white" 
                : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700";
            }

            return (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={btnClass}
                disabled={showResult}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && 
                    ((Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer.includes(option) : currentQuestion.correctAnswer === option)) && 
                    <CheckCircle size={20} className="text-green-600" />
                  }
                  {showResult && isSelected && 
                    !((Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer.includes(option) : currentQuestion.correctAnswer === option)) && 
                    <XCircle size={20} className="text-red-600" />
                  }
                </div>
              </button>
            );
          })}

          {currentQuestion.type === 'fill' && (
            <div>
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={showResult}
                placeholder="在此输入答案..."
                className={`w-full p-4 border rounded-lg font-serif text-lg focus:outline-none focus:ring-2 
                  ${showResult 
                    ? (textInput === currentQuestion.correctAnswer ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900') 
                    : 'border-stone-300 focus:ring-stone-400'}`
                }
              />
              {showResult && textInput !== currentQuestion.correctAnswer && (
                <div className="mt-2 text-green-700 text-sm font-serif flex items-center gap-1">
                  <CheckCircle size={14} /> 正确答案：{currentQuestion.correctAnswer}
                </div>
              )}
            </div>
          )}
        </div>

        {showResult && (
          <div className="mb-6 p-4 bg-stone-50 rounded border-l-4 border-stone-400 text-stone-700 text-sm animate-fade-in">
            <strong className="font-bold block mb-1">解析：</strong>
            {currentQuestion.explanation}
          </div>
        )}

        <div className="flex justify-end">
          {!showResult ? (
            <button 
              onClick={checkAnswer}
              disabled={(currentQuestion.type !== 'fill' && !selectedOption) || (currentQuestion.type === 'fill' && !textInput.trim())}
              className="px-8 py-3 bg-stone-900 text-white rounded hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed font-serif"
            >
              提交
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="px-8 py-3 flex items-center gap-2 bg-stone-900 text-white rounded hover:bg-stone-800 font-serif"
            >
              {currentQuestionIndex < sessionQuestions.length - 1 ? '下一题' : '查看结果'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeStudio;
