
import React from 'react';
import { ViewState, User } from '../types';
import { BookOpen, PenTool, Layout, Activity, Feather, MessageSquare, Map, LogOut, Clock, Scroll, Sparkles, GraduationCap, Crown, Users, X, Stamp, Flower, LucideIcon } from 'lucide-react';
import { useUpgradeModal } from './UpgradeContext';

interface NavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User;
  onLogout: () => void;
  todayMinutes: number;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id?: ViewState;
  label?: string;
  icon?: LucideIcon;
  type?: 'divider';
}

const Nav: React.FC<NavProps> = ({ currentView, setView, user, onLogout, todayMinutes, isOpen, onClose }) => {
  const { triggerUpgrade } = useUpgradeModal();

  const navItems: NavItem[] = [
    { id: ViewState.DASHBOARD, label: '书斋概览', icon: Activity },
    { id: ViewState.AI_TUTOR, label: '文言导师', icon: GraduationCap },
    { id: ViewState.TEMPLATES, label: '尺牍模版', icon: Layout },
    { id: ViewState.PHRASE_ATLAS, label: '辞藻典库', icon: BookOpen },
    { id: ViewState.PRACTICE, label: '习练工坊', icon: PenTool },
    { id: ViewState.EDITOR, label: '挥毫更张', icon: Feather },
    { type: 'divider' },
    { id: ViewState.BOOTCAMP, label: '七日特训', icon: Map },
    { id: ViewState.SIMULATOR, label: '古人投壶', icon: MessageSquare },
    { id: ViewState.FLYING_FLOWER, label: '飞花令', icon: Flower },
    { id: ViewState.STORY_MODE, label: '剧情尺牍', icon: Sparkles },
    { id: ViewState.MUSEUM, label: '书简体验馆', icon: Scroll },
    { id: ViewState.COMMUNITY, label: '文友圈', icon: Users },
    { id: ViewState.SEAL_STUDIO, label: '印章工坊', icon: Stamp },
  ];

  const handleNavClick = (view: ViewState) => {
    setView(view);
    onClose(); // Close mobile nav on selection
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-stone-900 text-stone-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="p-8 border-b border-stone-800 flex justify-between items-center">
          <div>
            <h1 className="font-calligraphy text-3xl text-stone-50 tracking-widest">文言尺牍</h1>
            <p className="text-xs text-stone-500 mt-2 tracking-widest uppercase">Ink & Epistle</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-stone-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`divider-${index}`} className="h-px bg-stone-800 my-4 mx-2" />;
            }
            
            if (!item.id || !item.icon) return null;

            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.id && handleNavClick(item.id)}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-300 font-serif tracking-wide text-left
                  ${isActive 
                    ? 'bg-stone-800 text-white border-l-4 border-red-800 shadow-md' 
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User & Stats Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/50">
          
          {/* Upgrade Callout (if not Pro) */}
          {!user.isPro && (
             <button 
               onClick={() => { triggerUpgrade(); onClose(); }}
               className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs font-bold py-2 rounded mb-4 flex items-center justify-center gap-2 shadow hover:brightness-110 transition-all"
             >
               <Crown size={14} fill="currentColor" /> 升级墨客会员
             </button>
          )}

          {/* Daily Timer */}
          <div className="bg-stone-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="flex items-center gap-1"><Clock size={12}/> 今日修习</span>
              <span className="text-green-700">进行中</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xl font-serif text-stone-200">{todayMinutes} <span className="text-xs">分钟</span></span>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center text-stone-100 font-bold text-xs border border-stone-600 relative`}>
                 {user.name[0]}
                 {user.isPro && (
                   <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-[2px] border border-stone-900">
                      <Crown size={8} fill="white" className="text-white"/>
                   </div>
                 )}
               </div>
               <div className="overflow-hidden">
                 <div className="flex items-center gap-1">
                   <p className="text-stone-200 text-sm font-serif font-bold truncate max-w-[80px]">{user.name}</p>
                   {user.isPro && <span className="text-[10px] text-amber-500 font-bold px-1 bg-amber-900/30 rounded">PRO</span>}
                 </div>
                 <p className="text-stone-500 text-xs truncate max-w-[80px]">{user.styleName}</p>
               </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-stone-500 hover:text-red-400 transition-colors p-2" 
              title="退出书斋"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Nav;
