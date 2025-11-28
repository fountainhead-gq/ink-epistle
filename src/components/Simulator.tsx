
import React, { useState, useRef, useEffect } from 'react';
import { HistoricalFigure, ChatMessage, User } from '../types';
import { replyToLetter } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { useUpgradeModal } from './UpgradeContext';
import { Send, Trash2 } from 'lucide-react';

interface SimulatorProps {
  user: User;
}

const Simulator: React.FC<SimulatorProps> = ({ user }) => {
  const { triggerUpgrade } = useUpgradeModal();
  
  const figures: HistoricalFigure[] = [
    {
      id: 'sushi',
      name: '苏轼',
      title: '东坡居士',
      description: '豪放旷达，喜好美食与诗酒。',
      avatarColor: 'bg-amber-700',
      initialMessage: '东坡白：\n\n某虽老拙，幸得优游林下。今日天气清和，偶思前尘往事，不知足下近况何如？\n\n临风怀想，不尽欲言。'
    },
    {
      id: 'liqingzhao',
      name: '李清照',
      title: '易安居士',
      description: '婉约词宗，才情卓绝。',
      avatarColor: 'bg-rose-700',
      initialMessage: '易安敛衽：\n\n乍暖还寒时候，最难将息。窗前芭蕉，点滴霖霪，正添愁绪。足下鸿雁传书，可慰寂寥否？\n\n特此修函。'
    },
    {
      id: 'zengguofan',
      name: '曾国藩',
      title: '曾文正公',
      description: '治学严谨，修身齐家。',
      avatarColor: 'bg-stone-700',
      initialMessage: '涤生手启：\n\n凡人做一事，便须全副精神注在此一事，首尾不懈。足下近日修业，有何进益？\n\n望如实道来。'
    },
    {
      id: 'libai',
      name: '李白',
      title: '青莲居士',
      description: '诗仙，浪漫豪放，唯爱酒与月。',
      avatarColor: 'bg-blue-600',
      initialMessage: '太白顿首：\n\n人生得意须尽欢，莫使金樽空对月。吾辈岂是蓬蒿人？足下若有奇闻美酒，速速道来！'
    },
    {
      id: 'dufu',
      name: '杜甫',
      title: '少陵野老',
      description: '诗圣，忧国忧民，沉郁顿挫。',
      avatarColor: 'bg-stone-600',
      initialMessage: '子美致意：\n\n国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。足下身处盛世，不知民间疾苦几何？'
    },
    {
      id: 'wangxizhi',
      name: '王羲之',
      title: '书圣',
      description: '飘若浮云，矫若惊龙。',
      avatarColor: 'bg-emerald-700',
      initialMessage: '逸少白：\n\n永和九年，岁在癸丑。暮春之初，会于会稽山阴之兰亭。足下若有闲暇，可愿同修流觞曲水之雅？'
    },
    {
      id: 'kongzi',
      name: '孔子',
      title: '万世师表',
      description: '循循善诱，仁义礼智信。',
      avatarColor: 'bg-red-900',
      initialMessage: '丘谨对：\n\n学而时习之，不亦说乎？有朋自远方来，不亦乐乎？足下于修身齐家之道，有何困惑？'
    },
    {
      id: 'zhuangzi',
      name: '庄子',
      title: '南华真人',
      description: '逍遥无为，道法自然。',
      avatarColor: 'bg-teal-600',
      initialMessage: '庄周梦蝶：\n\n北冥有鱼，其名为鲲。子非鱼，安知鱼之乐？世间万物，齐同为一，足下何必执着于俗务？'
    },
    {
      id: 'caozhi',
      name: '曹植',
      title: '陈思王',
      description: '才高八斗，七步成诗。',
      avatarColor: 'bg-purple-700',
      initialMessage: '子建顿首：\n\n翩若惊鸿，婉若游龙。本是同根生，相煎何太急？感念身世，不禁涕零。足下可有知音之语？'
    },
    {
      id: 'zhugeliang',
      name: '诸葛亮',
      title: '卧龙先生',
      description: '鞠躬尽瘁，死而后已。',
      avatarColor: 'bg-indigo-800',
      initialMessage: '孔明上书：\n\n臣本布衣，躬耕于南阳。受任于败军之际，奉命于危难之间。足下若有定国安邦之策，亮愿洗耳恭听。'
    },
    {
      id: 'simaqian',
      name: '司马迁',
      title: '太史公',
      description: '究天人之际，通古今之变。',
      avatarColor: 'bg-amber-900',
      initialMessage: '太史公言：\n\n人固有一死，或重于泰山，或轻于鸿毛。仆虽遭腐刑，然史笔如铁，不敢稍懈。足下如何看待千秋功罪？'
    },
    {
      id: 'taoyuanming',
      name: '陶渊明',
      title: '五柳先生',
      description: '采菊东篱，不为五斗米折腰。',
      avatarColor: 'bg-green-600',
      initialMessage: '元亮白：\n\n结庐在人境，而无车马喧。采菊东篱下，悠然见南山。足下久在樊笼里，可愿复得返自然？'
    },
    {
      id: 'wangwei',
      name: '王维',
      title: '摩诘居士',
      description: '诗中有画，画中有诗，禅意盎然。',
      avatarColor: 'bg-lime-700',
      initialMessage: '摩诘合十：\n\n行到水穷处，坐看云起时。明月松间照，清泉石上流。足下心中，可有一片净土？'
    },
    {
      id: 'xinqiji',
      name: '辛弃疾',
      title: '稼轩居士',
      description: '醉里挑灯看剑，梦回吹角连营。',
      avatarColor: 'bg-red-700',
      initialMessage: '稼轩白：\n\n醉里挑灯看剑，梦回吹角连营。八百里分麾下炙，五十弦翻塞外声。足下可见我胸中块垒？'
    },
    {
      id: 'liuyuxi',
      name: '刘禹锡',
      title: '诗豪',
      description: '沉舟侧畔千帆过，病树前头万木春。',
      avatarColor: 'bg-cyan-800',
      initialMessage: '梦得白：\n\n山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。足下以为然否？'
    },
    {
      id: 'quyuan',
      name: '屈原',
      title: '三闾大夫',
      description: '路漫漫其修远兮，吾将上下而求索。',
      avatarColor: 'bg-orange-800',
      initialMessage: '灵均叹曰：\n\n举世皆浊我独清，众人皆醉我独醒。路漫漫其修远兮，吾将上下而求索。足下亦愿同行乎？'
    }
  ];

  const [selectedFigure, setSelectedFigure] = useState<HistoricalFigure | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasHistoryMap, setHasHistoryMap] = useState<Record<string, boolean>>({});

  // Fetch history for all figures to show indicators
  useEffect(() => {
    const checkHistories = async () => {
        const map: Record<string, boolean> = {};
        for (const f of figures) {
            const hist = await dataService.getChatHistory(user.id, f.id);
            if (hist && hist.length > 0) map[f.id] = true;
        }
        setHasHistoryMap(map);
    };
    checkHistories();
  }, [user.id]);

  // When selectedFigure changes, load their specific history
  useEffect(() => {
    if (selectedFigure) {
      const fetchHistory = async () => {
        const history = await dataService.getChatHistory(user.id, selectedFigure.id);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              id: 'init',
              sender: 'ai',
              content: selectedFigure.initialMessage,
              timestamp: new Date()
            }
          ]);
        }
      };
      fetchHistory();
    }
  }, [selectedFigure, user.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedFigure) return;

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

    // Optimistic update
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);
    
    // Save User Msg
    await dataService.saveChatHistory(user.id, selectedFigure.id, newMessages);

    // Prepare history for AI context
    const history = newMessages.map(m => ({
      sender: m.sender,
      content: m.content
    }));

    const replyText = await replyToLetter(selectedFigure.name, input, history);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      content: replyText,
      timestamp: new Date()
    };

    const finalMessages = [...newMessages, aiMsg];
    setMessages(finalMessages);
    await dataService.saveChatHistory(user.id, selectedFigure.id, finalMessages);
    setIsThinking(false);

    // Update Letters Sent Stats & AI Usage
    await dataService.incrementAiUsage(user.id);
    
    const recent = await dataService.getRecentActivity(user.id, 1);
    const todayData = recent[0];
    await dataService.updateActivity(user.id, {
        lettersSent: todayData.lettersSent + 1
    });
  };

  const clearHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedFigure && window.confirm('确定要清除与此人的通信记录吗？')) {
      await dataService.saveChatHistory(user.id, selectedFigure.id, []);
      setMessages([{
        id: 'init',
        sender: 'ai',
        content: selectedFigure.initialMessage,
        timestamp: new Date()
      }]);
    }
  };

  if (!selectedFigure) {
    return (
      <div className="p-10 max-w-7xl mx-auto animate-fade-in">
        <header className="mb-10 text-center">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">古人投壶 · 信件模拟</h2>
          <p className="text-stone-500">穿越时空，与先贤笔谈，体悟古人之风骨。</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {figures.map(figure => {
            const hasHistory = hasHistoryMap[figure.id];
            
            return (
              <div 
                key={figure.id}
                onClick={() => setSelectedFigure(figure)}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 relative"
              >
                 {hasHistory && (
                  <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10" title="有往来信件"></div>
                )}
                <div className={`h-24 ${figure.avatarColor} relative flex items-center justify-center`}>
                  <div className="w-16 h-16 rounded-full border-4 border-white bg-stone-100 flex items-center justify-center text-xl font-calligraphy text-stone-800 shadow-lg">
                    {figure.name[0]}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-serif font-bold text-stone-900">{figure.name}</h3>
                  <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-2">{figure.title}</p>
                  <p className="text-stone-600 font-serif text-xs line-clamp-2">{figure.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto bg-[#f5f5f4]">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedFigure(null)}
            className="text-sm text-stone-500 hover:text-stone-900 underline font-serif"
          >
            返回
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${selectedFigure.avatarColor} text-white flex items-center justify-center font-calligraphy`}>
              {selectedFigure.name[0]}
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900">{selectedFigure.name}</h3>
              <span className="text-xs text-stone-500">正在展卷阅读...</span>
            </div>
          </div>
        </div>
        <button onClick={clearHistory} className="text-stone-400 hover:text-red-600" title="清空对话">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f5f5f4]" style={{backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-2xl p-8 rounded shadow-md font-serif text-lg leading-loose tracking-wide whitespace-pre-wrap relative
                ${msg.sender === 'user' 
                  ? 'bg-white text-stone-800 border border-stone-200' 
                  : 'bg-[#fffdf5] text-stone-900 border-t-4 border-t-red-800 border-x border-b border-stone-200'
                }`}
            >
               {msg.sender === 'ai' && (
                 <div className="absolute bottom-4 right-4 opacity-20 transform -rotate-12 pointer-events-none">
                   <div className="border-2 border-red-800 w-16 h-16 rounded-sm flex items-center justify-center text-red-800 font-calligraphy text-sm p-1 text-center leading-none">
                     {selectedFigure.name}<br/>印信
                   </div>
                 </div>
               )}
               {msg.content}
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-[#fffdf5] p-6 rounded border border-stone-200 flex items-center gap-2">
               <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-stone-200">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此处挥毫回信（支持白话或文言）..."
            className="w-full h-32 p-4 pr-12 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent resize-none font-serif text-stone-800"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="absolute bottom-4 right-4 p-2 bg-stone-900 text-white rounded hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-xs text-stone-400 mt-2 font-serif">AI 模拟历史人物语境，回复仅供参考。</p>
      </div>
    </div>
  );
};

export default Simulator;
