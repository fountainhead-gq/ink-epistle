
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { chatWithTutor } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { useUpgradeModal } from './UpgradeContext';
import { Send, GraduationCap, User as UserIcon, Trash2 } from 'lucide-react';

interface AiTutorProps {
  user: User;
}

const AiTutor: React.FC<AiTutorProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { triggerUpgrade } = useUpgradeModal();

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
        const history = await dataService.getChatHistory(user.id, 'tutor_main');
        if (history && history.length > 0) {
            setMessages(history);
        } else {
            // Initial greeting
            setMessages([{
                id: 'init',
                sender: 'ai',
                content: `欢迎来到书斋，${user.name}。\n\n我是你的文言修辞导师。我记得你的写作习惯，也随时准备为你解答关于章法、句式或节奏的疑惑。\n\n今日想从何处谈起？`,
                timestamp: new Date()
            }]);
        }
    };
    loadHistory();
  }, [user.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check Quota
    const allowed = await dataService.checkDailyQuota(user.id);
    if (!allowed) {
        triggerUpgrade();
        return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);
    
    // Save User Msg
    await dataService.saveChatHistory(user.id, 'tutor_main', newMessages);

    // Get Total Historical Stats
    const stats = await dataService.getUserStats(user.id);

    // Get Current Draft
    const currentDraft = await dataService.getCurrentDraft(user.id);

    // Prepare history for API
    const historyContext = newMessages.slice(-10).map(m => ({
      sender: m.sender,
      content: m.content
    }));

    const reply = await chatWithTutor(
      input, 
      historyContext, 
      stats,
      currentDraft
    );

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      content: reply,
      timestamp: new Date()
    };

    const finalMessages = [...newMessages, aiMsg];
    setMessages(finalMessages);
    await dataService.saveChatHistory(user.id, 'tutor_main', finalMessages);
    setIsThinking(false);
    
    // Track usage
    await dataService.incrementAiUsage(user.id);
  };

  const clearHistory = async () => {
    if (window.confirm('确定要重置导师记忆吗？')) {
      await dataService.saveChatHistory(user.id, 'tutor_main', []);
      setMessages([{
        id: 'init',
        sender: 'ai',
        content: `记忆已重置。${user.name}，我们重新开始吧。`,
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
            <GraduationCap className="text-stone-600" size={32} /> 
            文言导师
          </h2>
          <p className="text-stone-500 mt-2">你的私人修辞顾问，知你风格，伴你成长。</p>
        </div>
        <button onClick={clearHistory} className="text-stone-400 hover:text-red-500 text-sm flex items-center gap-1">
           <Trash2 size={14} /> 重置记忆
        </button>
      </header>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fdfbf7]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
                  ${msg.sender === 'user' ? user.avatarColor : 'bg-stone-800 text-white'}
                `}>
                  {msg.sender === 'user' ? <UserIcon size={18} /> : <GraduationCap size={18} />}
                </div>

                {/* Bubble */}
                <div className={`p-5 rounded-2xl font-serif text-lg leading-relaxed whitespace-pre-wrap shadow-sm
                  ${msg.sender === 'user' 
                    ? 'bg-white border border-stone-200 text-stone-800 rounded-tr-none' 
                    : 'bg-stone-100 text-stone-800 rounded-tl-none'}
                `}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {isThinking && (
             <div className="flex justify-start">
               <div className="flex items-center gap-3 ml-14">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-stone-200">
           <div className="relative">
             <textarea
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
               placeholder="向导师提问：关于句法、风格建议、或仅仅是聊聊写作..."
               className="w-full p-4 pr-14 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none h-24 font-serif text-lg"
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim() || isThinking}
               className="absolute bottom-4 right-4 p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-all"
             >
               <Send size={20} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
