
import React, { useState, useEffect } from 'react';
import { Wand2, Feather, AlignCenter, Download, Languages, Activity, Hexagon, Image as ImageIcon, Share, PanelBottomOpen, PanelBottomClose, Type, Music, History, Save, RotateCcw, Eye, X, Copy, CheckCircle } from 'lucide-react';
import { polishText, generateLetter, checkGrammar, analyzeRhythm, generateSpectrum, annotatePinyin } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { useUpgradeModal } from './UpgradeContext';
import RhythmVisualizer from './RhythmVisualizer';
import SpectrumChart from './SpectrumChart';
import ShareCard from './ShareCard';
import { RhythmData, SpectrumData, User, DraftSnapshot, ViewState } from '../types';

interface EditorProps {
  initialContent?: string;
  user?: User; 
  onNavigate?: (view: ViewState) => void;
}

type SidebarTab = 'feedback' | 'rhythm' | 'spectrum';
type FontFamily = 'serif' | 'calligraphy' | 'long-cang' | 'zhi-mang' | 'xiaowei' | 'maocao';

const Editor: React.FC<EditorProps> = ({ initialContent, user, onNavigate }) => {
  const [content, setContent] = useState(initialContent || '');
  const [isLoading, setIsLoading] = useState(false);
  const { triggerUpgrade } = useUpgradeModal();
  
  // Sidebar States
  const [activeTab, setActiveTab] = useState<SidebarTab>('feedback');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [rhythmData, setRhythmData] = useState<RhythmData | null>(null);
  const [spectrumData, setSpectrumData] = useState<SpectrumData | null>(null);
  
  // Mobile UI State
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  
  // AI Generation States
  const [showGenModal, setShowGenModal] = useState(false);
  const [genScene, setGenScene] = useState('');
  const [genRecipient, setGenRecipient] = useState('友人');
  const [genIntent, setGenIntent] = useState('问候');
  
  // P2: Share States
  const [showShareCard, setShowShareCard] = useState(false);

  // P3+: Deep Experience States
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [isPinyinMode, setIsPinyinMode] = useState(false);
  const [pinyinHtml, setPinyinHtml] = useState<string>('');

  // Draft History
  const [showHistory, setShowHistory] = useState(false);
  const [draftHistory, setDraftHistory] = useState<DraftSnapshot[]>([]);
  const [viewingSnapshot, setViewingSnapshot] = useState<DraftSnapshot | null>(null);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialContent) setContent(initialContent);
  }, [initialContent]);

  // Auto-save draft via DataService
  useEffect(() => {
    if (user) {
        dataService.saveCurrentDraft(user.id, content);
    }
  }, [content, user]);

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 3000);
  };

  const loadHistory = async () => {
    if (!user) return;
    const history = await dataService.getDraftHistory(user.id);
    setDraftHistory(history);
    setShowHistory(true);
  };

  const handleSaveSnapshot = async () => {
    if (!user || !content.trim()) return;
    await dataService.saveDraftSnapshot(user.id, content);
    showToast("草稿已保存至历史记录");
  };

  const handleRestoreSnapshot = (snapshot: DraftSnapshot) => {
    if (window.confirm("恢复历史草稿将覆盖当前内容，确定吗？")) {
        setContent(snapshot.content);
        setShowHistory(false);
        setViewingSnapshot(null);
        // Clear AI cache
        setAiFeedback(null);
        setRhythmData(null);
        setSpectrumData(null);
        showToast("历史版本已恢复");
    }
  };

  const checkQuota = async () => {
    if (!user) return true;
    const allowed = await dataService.checkDailyQuota(user.id);
    if (!allowed) {
        triggerUpgrade();
        return false;
    }
    return true;
  };

  const handlePolish = async () => {
    if (!content.trim() || !(await checkQuota())) return;
    setIsLoading(true);
    const polished = await polishText(content, 'elegant');
    if (user) await dataService.incrementAiUsage(user.id);
    setContent(polished);
    setAiFeedback(null);
    setRhythmData(null);
    setSpectrumData(null);
    setIsLoading(false);
  };

  const handleTranslate = async () => {
    if (!content.trim() || !(await checkQuota())) return;
    setIsLoading(true);
    const classical = await polishText(content, 'simple');
    if (user) await dataService.incrementAiUsage(user.id);
    setContent(classical);
    setAiFeedback(null);
    setRhythmData(null);
    setSpectrumData(null);
    setIsLoading(false);
  };

  const handleAnalyze = async (type: SidebarTab) => {
    if (!content.trim()) return;
    setActiveTab(type);
    setIsMobilePanelOpen(true); 
    
    if (type === 'feedback' && aiFeedback) return;
    if (type === 'rhythm' && rhythmData) return;
    if (type === 'spectrum' && spectrumData) return;

    if (!(await checkQuota())) return;

    setIsLoading(true);

    if (type === 'feedback') {
        const feedback = await checkGrammar(content);
        setAiFeedback(feedback);
    } else if (type === 'rhythm') {
        const rhythm = await analyzeRhythm(content);
        setRhythmData(rhythm);
    } else if (type === 'spectrum') {
        const spectrum = await generateSpectrum(content);
        setSpectrumData(spectrum);
    }
    
    if (user) await dataService.incrementAiUsage(user.id);
    setIsLoading(false);
  };

  const handleGenerate = async () => {
    if (!(await checkQuota())) return;
    setIsLoading(true);
    setShowGenModal(false);
    const result = await generateLetter(genScene, genRecipient, genIntent);
    if (user) await dataService.incrementAiUsage(user.id);
    setContent(result);
    setAiFeedback(null);
    setRhythmData(null);
    setSpectrumData(null);
    setIsLoading(false);
  };

  const handleTogglePinyin = async () => {
    if (isPinyinMode) {
      setIsPinyinMode(false);
      return;
    }
    if (!content.trim()) return;
    if (!(await checkQuota())) return;
    
    setIsLoading(true);
    const annotated = await annotatePinyin(content);
    if (user) await dataService.incrementAiUsage(user.id);
    setPinyinHtml(annotated);
    setIsPinyinMode(true);
    setIsLoading(false);
  };

  const handleExport = () => {
    if (!content) return;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "墨客文心.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const handlePublishToCommunity = async () => {
      if (!user || !content.trim()) return;
      if (!window.confirm("确定要将此文发布到【文友圈】吗？")) return;
      
      const res = await dataService.createPost(user.id, content, {
          name: user.name,
          avatar: user.avatarColor
      });

      if (res) {
          showToast("发布成功！即将跳转至文友圈。");
          setTimeout(() => {
             if (onNavigate) onNavigate(ViewState.COMMUNITY);
          }, 1500);
      } else {
          showToast("发布失败，请稍后重试。");
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      if (aiFeedback) setAiFeedback(null);
      if (rhythmData) setRhythmData(null);
      if (spectrumData) setSpectrumData(null);
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-2 lg:p-6 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
           <div className="bg-stone-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <span className="font-serif text-sm">{toastMsg}</span>
           </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareCard && user && (
        <ShareCard content={content} user={user} onClose={() => setShowShareCard(false)} fontFamily={fontFamily} />
      )}

      {/* History Drawer */}
      {showHistory && (
          <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/50 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
              <div className="w-80 bg-white h-full shadow-2xl overflow-y-auto p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif font-bold text-lg text-stone-800">历史草稿</h3>
                      <button onClick={() => setShowHistory(false)}><PanelBottomClose size={20}/></button>
                  </div>
                  {draftHistory.length === 0 ? (
                      <p className="text-stone-400 text-sm font-serif text-center">暂无历史记录</p>
                  ) : (
                      <div className="space-y-4">
                          {draftHistory.map(snap => (
                              <div key={snap.id} className="p-4 border border-stone-200 rounded hover:bg-stone-50 group">
                                  <p className="text-xs text-stone-400 mb-2">{new Date(snap.timestamp).toLocaleString()}</p>
                                  <p className="font-serif text-stone-800 text-sm line-clamp-3 mb-3">{snap.summary}</p>
                                  <div className="flex gap-2 mt-2">
                                      <button 
                                      onClick={() => setViewingSnapshot(snap)}
                                      className="flex-1 text-xs flex items-center justify-center gap-1 text-stone-600 hover:text-stone-900 border border-stone-200 px-2 py-1.5 rounded hover:bg-stone-100 transition-colors"
                                      >
                                          <Eye size={12} /> 查看全文
                                      </button>
                                      <button 
                                      onClick={() => handleRestoreSnapshot(snap)}
                                      className="flex-1 text-xs flex items-center justify-center gap-1 text-stone-600 hover:text-stone-900 border border-stone-200 px-2 py-1.5 rounded hover:bg-stone-100 transition-colors"
                                      >
                                          <RotateCcw size={12} /> 恢复
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Viewing Snapshot Modal */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setViewingSnapshot(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                    <div>
                        <h3 className="font-serif font-bold text-lg text-stone-800">历史草稿详情</h3>
                        <p className="text-xs text-stone-500 font-serif mt-1">{new Date(viewingSnapshot.timestamp).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setViewingSnapshot(null)} className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-[#fdfbf7] relative">
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#44403c 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                     <div className={`font-serif text-lg leading-loose whitespace-pre-wrap text-stone-800 relative z-10`}>
                         {viewingSnapshot.content}
                     </div>
                </div>
                
                <div className="p-4 border-t border-stone-200 flex justify-end gap-3 bg-white">
                     <button 
                       onClick={() => {
                           navigator.clipboard.writeText(viewingSnapshot.content);
                           showToast("内容已复制");
                       }}
                       className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2 font-serif transition-colors"
                     >
                         <Copy size={16}/> 复制内容
                     </button>
                     <button 
                       onClick={() => handleRestoreSnapshot(viewingSnapshot)}
                       className="px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 flex items-center gap-2 font-serif transition-colors shadow-lg"
                     >
                         <RotateCcw size={16}/> 恢复此版本
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* Toolbar - Responsive */}
      <div className="bg-white p-2 lg:p-4 rounded-t-xl border border-stone-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
           <button 
            onClick={() => setShowGenModal(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-stone-900 text-stone-50 rounded hover:bg-stone-700 transition-colors font-serif text-sm whitespace-nowrap"
           >
             <Wand2 size={16} /> <span className="hidden sm:inline">灵感生成</span>
           </button>
           <button 
             onClick={handlePolish}
             disabled={isLoading || isPinyinMode}
             className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition-colors font-serif text-sm whitespace-nowrap"
           >
             <Feather size={16} /> <span className="hidden sm:inline">润色</span>
           </button>
           <button 
             onClick={handleTranslate}
             disabled={isLoading || isPinyinMode}
             className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition-colors font-serif text-sm whitespace-nowrap"
           >
             <Languages size={16} /> <span className="hidden sm:inline">翻译</span>
           </button>
           
           <div className="h-6 w-px bg-stone-200 mx-1 hidden lg:block"></div>
           
           {/* Font Selector */}
           <div className="relative group">
             <button className="flex items-center gap-1 px-3 py-2 text-stone-600 hover:text-stone-900 font-serif text-sm">
               <Type size={16} /> 字体
             </button>
             <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded shadow-lg hidden group-hover:block w-32 z-30">
               <button onClick={() => setFontFamily('serif')} className="w-full text-left px-4 py-2 hover:bg-stone-50 font-serif">宋体（正）</button>
               <button onClick={() => setFontFamily('xiaowei')} className="w-full text-left px-4 py-2 hover:bg-stone-50 font-xiaowei">小薇（雅）</button>
               <button onClick={() => setFontFamily('calligraphy')} className="w-full text-left px-4 py-2 hover:bg-stone-50 font-calligraphy">马山（楷）</button>
               <button onClick={() => setFontFamily('long-cang')} className="w-full text-left px-4 py-2 hover:bg-stone-50 font-long-cang">长苍（行）</button>
               <button onClick={() => setFontFamily('zhi-mang')} className="w-full text-left px-4 py-2 hover:bg-stone-50 font-zhi-mang">志莽（草）</button>
               <button onClick={() => setFontFamily('maocao')} className="w-full text-left px-4 py-2 hover:bg-stone-50 font-maocao">毛草（狂）</button>
             </div>
           </div>
           
           <button 
             onClick={handleTogglePinyin}
             disabled={isLoading || !content.trim()}
             className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-serif transition-colors
               ${isPinyinMode ? 'bg-amber-100 text-amber-800' : 'text-stone-600 hover:text-stone-900'}
             `}
             title="智能注音"
           >
             <Music size={16} /> 注音
           </button>
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-stone-100">
           <button
            onClick={handleSaveSnapshot}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
            title="保存副本"
           >
               <Save size={20} />
           </button>
           <button
            onClick={loadHistory}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
            title="历史记录"
           >
               <History size={20} />
           </button>
           <button 
            onClick={() => setShowShareCard(true)}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded" 
            title="生成锦书卡片"
           >
             <ImageIcon size={20} />
           </button>
           <button 
            onClick={handlePublishToCommunity}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded" 
            title="发布到文友圈"
           >
             <Share size={20} />
           </button>
           <button 
            onClick={handleExport}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded" 
            title="导出为文本文件"
           >
             <Download size={20} />
           </button>
           
           <button 
             onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
             className={`lg:hidden p-2 rounded ${isMobilePanelOpen ? 'bg-stone-200 text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
           >
             {isMobilePanelOpen ? <PanelBottomClose size={20} /> : <PanelBottomOpen size={20} />}
           </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-2 lg:mt-6 h-full overflow-hidden relative">
        
        {/* Input Area */}
        <div className="flex-1 relative h-full bg-white rounded-xl border border-stone-200 shadow-inner overflow-hidden">
           {isPinyinMode ? (
             <div 
               className={`w-full h-full p-4 lg:p-8 overflow-y-auto text-xl leading-loose text-stone-800 ${getFontClass()}`}
               style={{ backgroundImage: 'linear-gradient(transparent 1.9rem, #f5f5f4 1.9rem)', backgroundSize: '100% 2rem', lineHeight: '2rem' }}
               dangerouslySetInnerHTML={{ __html: pinyinHtml }}
             />
           ) : (
             <textarea
               className={`w-full h-full p-4 lg:p-8 bg-transparent focus:outline-none resize-none text-base lg:text-xl leading-loose text-stone-800 ${getFontClass()}`}
               placeholder="在此输入白话文或尝试写作文言..."
               value={content}
               onChange={handleContentChange}
               style={{ backgroundImage: 'linear-gradient(transparent 1.9rem, #f5f5f4 1.9rem)', backgroundSize: '100% 2rem', lineHeight: '2rem' }}
             />
           )}
           
           {isLoading && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
               <div className="flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-4"></div>
                 <p className="font-serif text-stone-600">AI 翰墨挥毫中...</p>
               </div>
             </div>
           )}
        </div>

        {/* Sidebar Tools */}
        <div className={`
            bg-stone-50 rounded-xl border border-stone-200 overflow-hidden shadow-sm flex flex-col transition-all duration-300 z-20
            ${isMobilePanelOpen ? 'absolute inset-0 top-10 lg:static' : 'hidden lg:flex'}
            lg:w-96 lg:h-full
        `}>
          <div className="lg:hidden flex justify-end p-2 bg-stone-100 border-b border-stone-200">
             <button onClick={() => setIsMobilePanelOpen(false)}><PanelBottomClose size={24} className="text-stone-500"/></button>
          </div>

          <div className="flex border-b border-stone-200 bg-white">
            <button 
              onClick={() => handleAnalyze('feedback')}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors
                ${activeTab === 'feedback' ? 'text-stone-900 bg-stone-50 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}
              `}
            >
              <AlignCenter size={16} /> <span className="hidden sm:inline">评注</span>
            </button>
            <button 
              onClick={() => handleAnalyze('rhythm')}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors
                ${activeTab === 'rhythm' ? 'text-stone-900 bg-stone-50 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}
              `}
            >
              <Activity size={16} /> <span className="hidden sm:inline">节奏</span>
            </button>
            <button 
              onClick={() => handleAnalyze('spectrum')}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors
                ${activeTab === 'spectrum' ? 'text-stone-900 bg-stone-50 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}
              `}
            >
              <Hexagon size={16} /> <span className="hidden sm:inline">图谱</span>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-[#fdfbf7]">
             {activeTab === 'feedback' && (
                aiFeedback ? (
                  <div className="prose prose-stone text-sm font-serif text-stone-600 leading-relaxed whitespace-pre-wrap animate-fade-in">
                    <h4 className="font-bold mb-2 text-stone-800">先生评语：</h4>
                    {aiFeedback}
                  </div>
                ) : (
                  <div className="text-center text-stone-400 mt-20">
                    <AlignCenter className="mx-auto mb-2 w-8 h-8 opacity-50"/>
                    <p className="text-sm font-serif">点击上方标签获取评语</p>
                  </div>
                )
             )}

             {activeTab === 'rhythm' && (
                rhythmData ? (
                  <div className="h-full animate-fade-in">
                    <RhythmVisualizer data={rhythmData} />
                  </div>
                ) : (
                  <div className="text-center text-stone-400 mt-20">
                    <Activity className="mx-auto mb-2 w-8 h-8 opacity-50"/>
                    <p className="text-sm font-serif">分析平仄与长短句</p>
                  </div>
                )
             )}

             {activeTab === 'spectrum' && (
                spectrumData ? (
                  <div className="h-full animate-fade-in">
                    <SpectrumChart data={spectrumData} />
                  </div>
                ) : (
                  <div className="text-center text-stone-400 mt-20">
                    <Hexagon className="mx-auto mb-2 w-8 h-8 opacity-50"/>
                    <p className="text-sm font-serif">生成一信一图谱</p>
                  </div>
                )
             )}
          </div>
        </div>
      </div>

      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white p-6 lg:p-8 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-serif font-bold mb-6 text-stone-900">生成书信初稿</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">情境</label>
                <input 
                  type="text" 
                  value={genScene} 
                  onChange={e => setGenScene(e.target.value)}
                  placeholder="如：深秋登高，思念故人"
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">收信人</label>
                <select 
                  value={genRecipient} 
                  onChange={e => setGenRecipient(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                >
                  <option value="友人">友人</option>
                  <option value="师长">师长</option>
                  <option value="父母">父母</option>
                  <option value="上级">上级</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">意图</label>
                <select 
                  value={genIntent} 
                  onChange={e => setGenIntent(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                >
                  <option value="问候">问候</option>
                  <option value="求教">求教</option>
                  <option value="借物">借物</option>
                  <option value="邀请">邀请</option>
                  <option value="致谢">致谢</option>
                  <option value="致歉">致歉</option>
                  <option value="道贺">道贺</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowGenModal(false)}
                className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded"
              >
                取消
              </button>
              <button 
                onClick={handleGenerate}
                className="px-6 py-2 bg-stone-900 text-white rounded hover:bg-stone-800 font-serif"
              >
                开始生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
