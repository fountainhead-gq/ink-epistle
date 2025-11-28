
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { X, Download, Loader2 } from 'lucide-react';
import { User, Seal } from '../types';
import { dataService } from '../services/dataService';

interface ShareCardProps {
  content: string;
  user: User;
  onClose: () => void;
  fontFamily?: string;
}

type Theme = 'simple' | 'royal' | 'ink' | 'bamboo';

const ShareCard: React.FC<ShareCardProps> = ({ content, user, onClose, fontFamily = 'serif' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState<Theme>('simple');
  const [userSeals, setUserSeals] = useState<Seal[]>([]);
  const [selectedSeal, setSelectedSeal] = useState<Seal | null>(null);

  useEffect(() => {
    const loadSeals = async () => {
        const seals = await dataService.getSeals(user.id);
        setUserSeals(seals);
        if (seals.length > 0) setSelectedSeal(seals[seals.length - 1]); // Auto select latest
    };
    loadSeals();
  }, [user.id]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      // Fix for html2canvas with vertical text and scrolled pages
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, // Higher resolution
        backgroundColor: null,
        scrollX: 0,
        scrollY: -window.scrollY, // Correct offset for current scroll position
        onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.share-card-container') as HTMLElement;
            if (clonedElement) {
                clonedElement.style.display = 'block';
                clonedElement.style.transform = 'none';
            }
        }
      });
      
      const link = document.createElement('a');
      link.download = `文言尺牍_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Image generation failed", e);
      alert("图片生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFontClass = () => {
    switch(fontFamily) {
      case 'calligraphy': return 'font-calligraphy';
      case 'long-cang': return 'font-long-cang';
      case 'zhi-mang': return 'font-zhi-mang';
      case 'xiaowei': return 'font-xiaowei';
      case 'maocao': return 'font-maocao';
      default: return 'font-serif';
    }
  };

  const getThemeStyles = () => {
      switch(theme) {
          case 'royal':
              return {
                  wrapper: "bg-[#fffdf0] border-t-8 border-b-8 border-amber-800",
                  text: "text-amber-950",
                  accent: "text-amber-700",
                  bgPattern: "radial-gradient(#d97706 0.5px, transparent 0.5px)"
              };
          case 'ink':
              return {
                  wrapper: "bg-[#f5f5f4] border-8 border-stone-800",
                  text: "text-stone-900",
                  accent: "text-stone-600",
                  bgPattern: "linear-gradient(to bottom right, #e7e5e4, #fafaf9)" // Simulating ink wash roughly
              };
          case 'bamboo':
              return {
                  wrapper: "bg-[#f0fdf4] border-x-8 border-green-800",
                  text: "text-green-950",
                  accent: "text-green-700",
                  bgPattern: "radial-gradient(#166534 0.5px, transparent 0.5px)"
              };
          default: // simple
              return {
                  wrapper: "bg-[#fdfbf7] border-t-8 border-b-8 border-stone-800",
                  text: "text-stone-800",
                  accent: "text-stone-500",
                  bgPattern: "radial-gradient(#a8a29e 0.5px, transparent 0.5px)"
              };
      }
  };

  const styles = getThemeStyles();

  const renderSealOnCard = (s: Seal) => {
    const bgColor = s.style === 'baiwen' ? '#9f1239' : 'transparent';
    const fgColor = s.style === 'baiwen' ? '#ffffff' : '#9f1239';
    const borderColor = '#9f1239';
    const fontClass = s.font === 'zhuanshu' ? 'font-zhi-mang' : s.font === 'lishu' ? 'font-xiaowei' : 'font-calligraphy';
    const borderRadius = s.shape === 'circle' ? '50%' : s.shape === 'oval' ? '40% / 50%' : '2px';

    return (
      <div 
        className={`relative flex items-center justify-center overflow-hidden ${fontClass}`}
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: bgColor,
          color: fgColor,
          borderRadius: borderRadius,
          border: s.style === 'zhuwen' ? `2px solid ${borderColor}` : 'none',
        }}
      >
        <div className={`grid w-full h-full p-1 leading-none text-center ${s.text.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
             {s.text.split('').slice(0, 4).map((char, i) => (
               <div key={i} className="flex items-center justify-center w-full h-full" style={{fontSize: '10px'}}>
                 {char}
               </div>
             ))}
        </div>
        {/* Texture Overlay */}
        <div className="absolute inset-0 opacity-30 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-stone-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-2xl flex flex-col items-center h-full max-h-screen" onClick={e => e.stopPropagation()}>
        
        {/* Controls */}
        <div className="w-full flex justify-between items-center mb-4 text-white shrink-0">
            <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                    <button onClick={() => setTheme('simple')} className={`w-6 h-6 rounded-full bg-[#fdfbf7] border-2 ${theme === 'simple' ? 'border-amber-400' : 'border-transparent'}`} title="素雅"></button>
                    <button onClick={() => setTheme('royal')} className={`w-6 h-6 rounded-full bg-[#fffdf0] border-2 ${theme === 'royal' ? 'border-amber-400' : 'border-transparent'}`} title="宫廷"></button>
                    <button onClick={() => setTheme('ink')} className={`w-6 h-6 rounded-full bg-stone-300 border-2 ${theme === 'ink' ? 'border-amber-400' : 'border-transparent'}`} title="水墨"></button>
                    <button onClick={() => setTheme('bamboo')} className={`w-6 h-6 rounded-full bg-green-100 border-2 ${theme === 'bamboo' ? 'border-amber-400' : 'border-transparent'}`} title="竹韵"></button>
                </div>
                
                {userSeals.length > 0 && (
                    <div className="relative group">
                        <button className="text-xs border border-white/30 rounded px-2 py-1 hover:bg-white/10 flex items-center gap-1">
                            {selectedSeal ? selectedSeal.text : '选择印章'}
                        </button>
                        <div className="absolute top-full left-0 mt-2 bg-white rounded p-2 shadow-xl hidden group-hover:grid grid-cols-3 gap-2 w-48 z-50">
                            {userSeals.map(s => (
                                <button key={s.id} onClick={() => setSelectedSeal(s)} className="p-1 hover:bg-stone-100 rounded border border-transparent hover:border-stone-200">
                                    {renderSealOnCard(s)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <button onClick={onClose} className="text-white hover:text-stone-300 p-2"><X size={24} /></button>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="flex-1 w-full overflow-auto bg-stone-800/50 rounded-lg p-4 flex justify-center mb-4">
            <div className="w-full max-w-[400px]">
                {/* The Card to Capture */}
                <div 
                  ref={cardRef}
                  className={`share-card-container w-full p-8 rounded-sm shadow-2xl relative overflow-hidden flex flex-col ${styles.wrapper}`}
                  style={{backgroundImage: styles.bgPattern, backgroundSize: '16px 16px', minHeight: '500px'}}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
                    <span className={`font-calligraphy text-9xl ${styles.text}`}>文</span>
                  </div>

                  <div className={`flex justify-between items-start mb-8 border-b ${theme === 'royal' ? 'border-amber-200' : 'border-stone-300'} pb-4 shrink-0`}>
                    <div>
                       <div className={`${styles.accent} text-xs tracking-[0.2em] uppercase mb-1`}>Ink & Epistle</div>
                       <div className={`font-calligraphy text-2xl ${styles.text}`}>文言尺牍</div>
                    </div>
                    <div className="flex flex-col items-end">
                       {selectedSeal ? renderSealOnCard(selectedSeal) : (
                           <div className="w-8 h-8 rounded-sm bg-red-900 text-white flex items-center justify-center font-calligraphy text-xs leading-none p-1 text-center">
                             {user.name.substring(0, 2)}<br/>印信
                           </div>
                       )}
                    </div>
                  </div>

                  {/* Auto-expanding content area */}
                  <div className="flex-1 relative min-h-[300px] flex justify-end">
                     <div 
                       className={`${getFontClass()} text-lg ${styles.text} leading-loose whitespace-pre-wrap`}
                       style={{
                           writingMode: 'vertical-rl', 
                           textOrientation: 'upright', 
                           width: '100%',
                           minHeight: '100%',
                           letterSpacing: '0.1em',
                           display: 'flex',
                           alignContent: 'flex-start' // Ensure columns start from right
                       }}
                     >
                       {content}
                     </div>
                  </div>

                  <div className={`mt-8 pt-4 border-t ${theme === 'royal' ? 'border-amber-200' : 'border-stone-300'} flex justify-between items-center shrink-0`}>
                     <div className={`text-xs ${styles.accent} font-serif`}>
                       {new Date().toLocaleDateString()} · {user.styleName} 
                     </div>
                     <div className={`text-xs ${styles.accent} font-serif`}>
                        扫码共赏
                     </div>
                  </div>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 mb-2">
           <button 
             onClick={handleDownload}
             disabled={isGenerating}
             className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-serif font-bold shadow-lg flex items-center gap-2 transition-all"
           >
             {isGenerating ? <Loader2 className="animate-spin" /> : <Download size={18} />}
             保存为图片
           </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
