
import React, { useState, useEffect } from 'react';
import { User, Seal } from '../types';
import { dataService } from '../services/dataService';
import { Save, Trash2, PenTool, Box, Circle, Square } from 'lucide-react';

interface SealStudioProps {
  user: User;
}

const SealStudio: React.FC<SealStudioProps> = ({ user }) => {
  const [seals, setSeals] = useState<Seal[]>([]);
  
  // Design State
  const [text, setText] = useState<string>(user.name.substring(0, 2));
  const [style, setStyle] = useState<'zhuwen' | 'baiwen'>('baiwen');
  const [shape, setShape] = useState<'square' | 'circle' | 'oval'>('square');
  const [font, setFont] = useState<'zhuanshu' | 'lishu' | 'kaishu'>('zhuanshu');
  const [wearLevel, setWearLevel] = useState<number>(30);

  useEffect(() => {
    loadSeals();
  }, [user.id]);

  const loadSeals = async () => {
    const data = await dataService.getSeals(user.id);
    setSeals(data);
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    const newSeal: Seal = {
      id: Date.now().toString(),
      text,
      style,
      shape,
      font,
      wearLevel,
      createdAt: new Date().toISOString()
    };
    await dataService.saveSeal(user.id, newSeal);
    setSeals([...seals, newSeal]);
    alert("印章已刻成！");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("确定要磨去此印吗？")) {
      await dataService.deleteSeal(user.id, id);
      setSeals(seals.filter(s => s.id !== id));
    }
  };

  // Helper to render seal visually
  const renderSeal = (s: Seal | { text: string, style: string, shape: string, font: string, wearLevel: number }, size: number = 120) => {
    const bgColor = s.style === 'baiwen' ? '#9f1239' : 'transparent';
    const fgColor = s.style === 'baiwen' ? '#ffffff' : '#9f1239';
    const borderColor = '#9f1239';

    const fontClass = 
      s.font === 'zhuanshu' ? 'font-zhi-mang' : 
      s.font === 'lishu' ? 'font-xiaowei' : 'font-calligraphy';
    
    const borderRadius = s.shape === 'circle' ? '50%' : s.shape === 'oval' ? '40% / 50%' : '4px';

    // Font size calculation adjustment to prevent clipping
    const fontSize = size / (s.text.length === 1 ? 1.8 : s.text.length === 2 ? 2.4 : 2.6);

    return (
      <div 
        className={`relative flex items-center justify-center overflow-hidden select-none ${fontClass}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: bgColor,
          color: fgColor,
          borderRadius: borderRadius,
          border: s.style === 'zhuwen' ? `4px solid ${borderColor}` : 'none',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
        }}
      >
        {/* Layout Grid based on char count */}
        {/* Changed 2 chars to grid-cols-2 for better circle fit, added p-4 padding */}
        <div className={`grid w-full h-full p-4
           ${s.text.length === 1 ? 'place-items-center' : 
             s.text.length === 2 ? 'grid-cols-2' : 
             s.text.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}
        `}>
             {/* Character Slicing for layout */}
             {s.text.split('').slice(0, 4).map((char, i) => (
               <div key={i} className="flex items-center justify-center text-center w-full h-full leading-none" style={{fontSize: `${fontSize}px`}}>
                 {char}
               </div>
             ))}
        </div>

        {/* SVG Overlay for Texture/Wear */}
        <div 
            className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60"
            style={{
                filter: `url(#seal-roughness) contrast(${150 - s.wearLevel}%)`,
                background: `rgba(255,255,255, ${s.wearLevel / 100})`
            }}
        />
        <div 
            className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-40"
            style={{ filter: 'url(#seal-erosion)' }}
        />
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-10 max-w-6xl mx-auto animate-fade-in flex flex-col min-h-full lg:h-full">
       <header className="mb-8 text-center shrink-0">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">金石篆刻 · 印章工坊</h2>
          <p className="text-stone-500">方寸之间，气象万千。雕琢一枚属于你的印信。</p>
       </header>

       <div className="flex flex-col lg:flex-row gap-8 flex-1 lg:overflow-hidden">
          {/* Editor Panel (Preview) */}
          <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-lg flex flex-col items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] shrink-0 lg:flex-1 min-h-[300px]">
              <div className="mb-8 transform scale-150">
                  {renderSeal({ text, style, shape, font, wearLevel }, 160)}
              </div>
              <div className="text-center font-serif text-stone-400 text-sm mt-4">
                  预览图
              </div>
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-96 bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:overflow-y-auto shrink-0">
              <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
                  <PenTool size={18}/> 刻印台
              </h3>
              
              <div className="space-y-6">
                  {/* Text Input */}
                  <div>
                      <label className="block text-sm font-bold text-stone-600 mb-2">印文 (1-4字)</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="w-full p-3 border border-stone-300 rounded font-serif text-lg focus:ring-2 focus:ring-red-800 focus:outline-none"
                      />
                  </div>

                  {/* Style (Zhu/Bai) */}
                  <div>
                      <label className="block text-sm font-bold text-stone-600 mb-2">阴阳</label>
                      <div className="flex gap-2">
                          <button 
                             onClick={() => setStyle('zhuwen')}
                             className={`flex-1 py-2 border rounded text-sm ${style === 'zhuwen' ? 'bg-red-50 border-red-800 text-red-900' : 'bg-white text-stone-600'}`}
                          >
                             朱文 (阳刻)
                          </button>
                          <button 
                             onClick={() => setStyle('baiwen')}
                             className={`flex-1 py-2 border rounded text-sm ${style === 'baiwen' ? 'bg-red-50 border-red-800 text-red-900' : 'bg-white text-stone-600'}`}
                          >
                             白文 (阴刻)
                          </button>
                      </div>
                  </div>

                  {/* Shape */}
                  <div>
                      <label className="block text-sm font-bold text-stone-600 mb-2">形制</label>
                      <div className="flex gap-4 justify-center">
                          <button onClick={() => setShape('square')} className={`p-3 rounded border ${shape === 'square' ? 'border-red-800 bg-red-50' : 'border-stone-200'}`} title="方印"><Square size={20}/></button>
                          <button onClick={() => setShape('circle')} className={`p-3 rounded-full border ${shape === 'circle' ? 'border-red-800 bg-red-50' : 'border-stone-200'}`} title="圆印"><Circle size={20}/></button>
                          <button onClick={() => setShape('oval')} className={`p-3 rounded-[40%] border ${shape === 'oval' ? 'border-red-800 bg-red-50' : 'border-stone-200'}`} title="随形"><Box size={20}/></button>
                      </div>
                  </div>

                  {/* Font */}
                  <div>
                      <label className="block text-sm font-bold text-stone-600 mb-2">字体</label>
                      <select 
                        value={font}
                        onChange={(e) => setFont(e.target.value as any)}
                        className="w-full p-2 border border-stone-300 rounded font-serif"
                      >
                          <option value="zhuanshu">摹印篆 (古朴)</option>
                          <option value="lishu">汉隶 (端庄)</option>
                          <option value="kaishu">楷书 (工整)</option>
                      </select>
                  </div>

                  {/* Wear Level */}
                  <div>
                      <label className="block text-sm font-bold text-stone-600 mb-2">金石残破度: {wearLevel}%</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="80" 
                        value={wearLevel}
                        onChange={e => setWearLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-red-800"
                      />
                  </div>

                  <button 
                    onClick={handleSave}
                    className="w-full py-3 bg-red-900 text-white rounded font-bold font-serif shadow-lg hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
                  >
                      <Save size={18} /> 刻制入库
                  </button>
              </div>
          </div>
       </div>

       {/* Gallery */}
       <div className="mt-10 pb-10 shrink-0">
           <h3 className="font-serif font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
               <Box size={18} /> 我的印匣
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {seals.map(seal => (
                   <div key={seal.id} className="bg-white p-4 border border-stone-200 rounded-lg flex flex-col items-center group relative hover:shadow-md transition-all">
                       <button 
                         onClick={() => handleDelete(seal.id)}
                         className="absolute top-2 right-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                           <Trash2 size={16} />
                       </button>
                       <div className="mb-2">
                           {renderSeal(seal, 64)}
                       </div>
                       <p className="text-xs text-stone-500 font-serif">{seal.text}</p>
                       <p className="text-[10px] text-stone-300">{new Date(seal.createdAt).toLocaleDateString()}</p>
                   </div>
               ))}
               {seals.length === 0 && (
                   <div className="col-span-full py-8 text-center text-stone-400 font-serif border-2 border-dashed border-stone-200 rounded-lg">
                       暂无印章，请先刻制一枚。
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default SealStudio;
