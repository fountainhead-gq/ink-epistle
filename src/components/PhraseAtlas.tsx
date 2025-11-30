
import React, { useState, useEffect } from 'react';
import { Search, Copy, BookOpen, AlignLeft, Check, Star } from 'lucide-react';
import { dataService } from '../services/dataService';
import { User } from '../types';

type Tab = 'vocab' | 'syntax' | 'favorites';

interface PhraseAtlasProps {
  user?: User; // Optional, might be used in future or current context
}

const PhraseAtlas: React.FC<PhraseAtlasProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('vocab');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
        const loadFavs = async () => {
            const favs = await dataService.getFavorites(user.id);
            setFavorites(favs);
        };
        loadFavs();
    }
  }, [user]);

  const toggleFavorite = async (id: number | string) => {
    if (!user) return;
    const numId = typeof id === 'string' ? parseInt(id.replace('p', '1000')) : id;
    
    let newFavs;
    if (favorites.includes(numId)) {
        newFavs = favorites.filter(fid => fid !== numId);
        setToastMessage('已取消收藏');
    } else {
        newFavs = [...favorites, numId];
        setToastMessage('已加入“我的常用式”');
    }
    
    setFavorites(newFavs);
    await dataService.saveFavorites(user.id, newFavs);
    
    setTimeout(() => setToastMessage(null), 2000);
  };

  const isFavorite = (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id.replace('p', '1000')) : id;
    return favorites.includes(numId);
  };

  const phrases = [
    // --- 敬辞 ---
    { id: 1, text: '伏惟', category: '敬辞', meaning: '俯伏思惟，表示恭敬的开头词。', example: '伏惟珍摄。' },
    { id: 4, text: '惠书', category: '敬辞', meaning: '对他人的来信的尊称。', example: '惠书敬悉。' },
    { id: 9, text: '敬启', category: '敬辞', meaning: '恭敬地陈述。', example: '某某敬启。' },
    { id: 10, text: '拜稽', category: '敬辞', meaning: '叩头致敬。', example: '某某拜稽。' },
    { id: 11, text: '钧鉴', category: '敬辞', meaning: '请尊长或上级过目。', example: '特呈钧鉴。' },
    { id: 12, text: '台鉴', category: '敬辞', meaning: '请平辈过目。', example: '某某台鉴。' },
    { id: 13, text: '赐教', category: '敬辞', meaning: '请求对方给予指教。', example: '恳请赐教。' },
    { id: 14, text: '斧正', category: '敬辞', meaning: '请人修改文章。', example: '拙作呈祈斧正。' },
    
    // --- 寒暄 ---
    { id: 2, text: '久疏笺候', category: '寒暄', meaning: '很久没有写信问候了。', example: '久疏笺候，甚以为歉。' },
    { id: 15, text: '阔别经年', category: '寒暄', meaning: '分别已经很多年了。', example: '阔别经年，思积日深。' },
    { id: 16, text: '别来无恙', category: '寒暄', meaning: '分别以来身体还好吗？', example: '不知足下别来无恙否？' },
    { id: 17, text: '春寒料峭', category: '寒暄', meaning: '早春微寒，多用于时令问候。', example: '春寒料峭，善自珍重。' },
    { id: 18, text: '金风送爽', category: '寒暄', meaning: '秋风吹来让人感觉舒爽。', example: '金风送爽，正是读书好时节。' },

    // --- 称谓 ---
    { id: 3, text: '如晤', category: '提称', meaning: '如同见面一样，用于平辈或晚辈。', example: '某某弟如晤。' },
    { id: 7, text: '青眼', category: '称谓', meaning: '表示对人的喜爱或重视。', example: '蒙君青眼。' },
    { id: 19, text: '足下', category: '提称', meaning: '对朋友的尊称。', example: '足下近况如何？' },
    { id: 20, text: '函丈', category: '提称', meaning: '对老师的尊称。', example: '夫子函丈。' },
    { id: 21, text: '膝下', category: '提称', meaning: '对父母的称呼。', example: '父母亲膝下。' },

    // --- 情感 ---
    { id: 22, text: '感激涕零', category: '情感', meaning: '感激得流下眼泪。', example: '蒙君相助，感激涕零。' },
    { id: 23, text: '铭感五内', category: '情感', meaning: '比喻恩情深厚，永远铭记在心。', example: '大恩大德，铭感五内。' },
    { id: 24, text: '中心藏之', category: '情感', meaning: '心里怀藏着对人的思念或敬意。', example: '中心藏之，何日忘之。' },
    { id: 25, text: '歉仄', category: '情感', meaning: '抱歉、惭愧。', example: '未能赴约，深感歉仄。' },

    // --- 结语 ---
    { id: 5, text: '临书仓卒', category: '结语', meaning: '写信的时候很匆忙。', example: '临书仓卒，不尽欲言。' },
    { id: 6, text: '顺颂时绥', category: '祝颂', meaning: '顺便祝你时时平安。', example: '顺颂时绥。' },
    { id: 8, text: '顿首', category: '落款', meaning: '磕头，古时书信末尾常用的敬辞。', example: '某某顿首。' },
    { id: 26, text: '谨启', category: '落款', meaning: '恭敬地陈述。', example: '某某谨启。' },
    { id: 27, text: '不宣', category: '结语', meaning: '书信末尾用语，意为意思说不完。', example: '余言面陈，不宣。' },
    { id: 28, text: '珍重', category: '祝颂', meaning: '保重身体。', example: '临纸依依，惟珍重。' }
  ];

  const patterns = [
    { id: 'p1', text: '久疏……，驰系……', category: '开篇', meaning: '表示很久没联系，非常想念。', example: '久疏笺候，驰系良深。' },
    { id: 'p2', text: '顷者……', category: '开篇', meaning: '刚才、最近……（用于引出正题）。', example: '顷者接读手书，知君近况。' },
    { id: 'p3', text: '兹因……，特……', category: '过渡', meaning: '现在因为……，特别……', example: '兹因家中有事，特向先生请假。' },
    { id: 'p4', text: '是以……', category: '过渡', meaning: '因此……', example: '是以修函奉恳，望祈玉成。' },
    { id: 'p5', text: '若蒙……，则……', category: '过渡', meaning: '如果能够……，那么……', example: '若蒙俯允，则感荷无既。' },
    { id: 'p6', text: '临书……，不尽……', category: '结语', meaning: '写信结束时，觉得还有话没说完。', example: '临书依依，不尽欲言。' },
    { id: 'p7', text: '余言……', category: '结语', meaning: '剩下的事情见面再说。', example: '余言面陈，不宣。' },
    { id: 'p8', text: '伏惟……', category: '套语', meaning: '俯伏思惟（表示敬意）。', example: '伏惟珍摄。' },
    { id: 'p9', text: '仰慕久之', category: '开篇', meaning: '敬仰很久了。', example: '闻名遐迩，仰慕久之。' },
    { id: 'p10', text: '幸甚幸甚', category: '结语', meaning: '非常荣幸/高兴。', example: '倘蒙见许，幸甚幸甚。' }
  ];

  let currentData: any[] = [];
  if (activeTab === 'vocab') {
    currentData = phrases;
  } else if (activeTab === 'syntax') {
    currentData = patterns;
  } else if (activeTab === 'favorites') {
    currentData = [...phrases, ...patterns].filter(item => isFavorite(item.id));
  }
  
  const filteredData = currentData.filter(p => 
    p.text.includes(searchTerm) || p.meaning.includes(searchTerm) || p.category.includes(searchTerm)
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`已复制：${text}`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <div className="p-4 lg:p-10 max-w-6xl mx-auto h-full flex flex-col relative animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-stone-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <Check size={18} className="text-green-400" />
          <span className="font-serif">{toastMessage}</span>
        </div>
      )}

      <header className="mb-6 lg:mb-8">
        <h2 className="text-2xl lg:text-3xl font-serif font-bold text-stone-800 mb-2">辞藻典库</h2>
        <p className="text-stone-500">墨客文心的“弹药库”，随查随用。</p>
      </header>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex items-center gap-6 mb-6 border-b border-stone-200 overflow-x-auto">
         <button 
           onClick={() => setActiveTab('vocab')}
           className={`flex items-center gap-2 pb-3 transition-colors font-serif text-lg whitespace-nowrap ${activeTab === 'vocab' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
         >
           <BookOpen size={20} /> 常用词汇
         </button>
         <button 
           onClick={() => setActiveTab('syntax')}
           className={`flex items-center gap-2 pb-3 transition-colors font-serif text-lg whitespace-nowrap ${activeTab === 'syntax' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
         >
           <AlignLeft size={20} /> 句式模版
         </button>
         <button 
           onClick={() => setActiveTab('favorites')}
           className={`flex items-center gap-2 pb-3 transition-colors font-serif text-lg whitespace-nowrap ${activeTab === 'favorites' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
         >
           <Star size={20} className={activeTab === 'favorites' ? 'fill-yellow-400 text-yellow-400' : ''} /> 我的常用式
         </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
        <input 
          type="text" 
          placeholder={`搜索${activeTab === 'vocab' ? '词汇' : activeTab === 'syntax' ? '句式' : '收藏'}...`}
          className="w-full pl-12 pr-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 font-serif"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredData.length === 0 && activeTab === 'favorites' ? (
        <div className="text-center py-20">
           <Star className="mx-auto text-stone-300 mb-4" size={48} />
           <p className="text-stone-500 font-serif">暂无收藏，快去词库中挑选喜欢的表达吧。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pb-10 flex-1">
          {filteredData.map(item => (
            <div key={item.id} className="bg-white border border-stone-200 p-5 rounded-lg hover:shadow-md transition-all group relative flex flex-col">
              <div className="absolute top-4 right-4 flex gap-2">
                 <button 
                    onClick={() => toggleFavorite(item.id)} 
                    className={`transition-colors ${isFavorite(item.id) ? 'text-yellow-400' : 'text-stone-300 hover:text-stone-500'}`} 
                    title="收藏"
                 >
                   <Star size={16} className={isFavorite(item.id) ? 'fill-yellow-400' : ''} />
                 </button>
                 <button onClick={() => copyToClipboard(item.text)} className="text-stone-400 hover:text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity" title="复制">
                   <Copy size={16} />
                 </button>
              </div>
              <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded mb-2 w-fit">{item.category}</span>
              <h3 className="text-2xl font-serif font-bold text-stone-800 mb-2">{item.text}</h3>
              <p className="text-sm text-stone-600 mb-3 flex-grow">{item.meaning}</p>
              <div className="pt-3 border-t border-stone-100 mt-auto">
                <p className="text-xs text-stone-400 font-serif italic">例：{item.example}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhraseAtlas;
