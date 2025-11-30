
import React, { useState, useEffect } from 'react';
import { ViewState, User } from './types';
import Nav from './components/Nav';
import Dashboard from './components/Dashboard';
import TemplateLibrary from './components/TemplateLibrary';
import PhraseAtlas from './components/PhraseAtlas';
import PracticeStudio from './components/PracticeStudio';
import Editor from './components/Editor';
import Simulator from './components/Simulator';
import Bootcamp from './components/Bootcamp';
import Login from './components/Login';
import StoryMode from './components/StoryMode';
import LetterMuseum from './components/LetterMuseum';
import AiTutor from './components/AiTutor';
import UpgradeModal from './components/UpgradeModal';
import Community from './components/Community';
import SealStudio from './components/SealStudio';
import FlyingFlower from './components/FlyingFlower';
import { dataService } from './services/dataService';
import { UpgradeContext } from './components/UpgradeContext';
import { Menu, Feather } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [editorContent, setEditorContent] = useState<string>('');
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Initialize User
  useEffect(() => {
    const storedUser = localStorage.getItem('ink_currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // P3: Dynamic Document Title
  useEffect(() => {
    const titleMap: Record<ViewState, string> = {
      [ViewState.DASHBOARD]: '墨客文心',
      [ViewState.TEMPLATES]: '尺牍模版',
      [ViewState.PHRASE_ATLAS]: '辞藻典库',
      [ViewState.PRACTICE]: '习练工坊',
      [ViewState.EDITOR]: '挥毫更张',
      [ViewState.SIMULATOR]: '古人投壶',
      [ViewState.BOOTCAMP]: '七日特训',
      [ViewState.STORY_MODE]: '剧情尺牍',
      [ViewState.MUSEUM]: '书简体验馆',
      [ViewState.AI_TUTOR]: '文言导师',
      [ViewState.COMMUNITY]: '文友圈',
      [ViewState.SEAL_STUDIO]: '印章工坊',
      [ViewState.FLYING_FLOWER]: '飞花令',
    };
    document.title = `${titleMap[currentView] || '墨客文心'} | Ink & Mind`;
  }, [currentView]);

  // Timer Logic: Track study time
  useEffect(() => {
    if (!user) return;

    // Load today's initial minutes async
    const fetchToday = async () => {
      const recent = await dataService.getRecentActivity(user.id, 1);
      if (recent.length > 0) {
        setTodayMinutes(recent[0].minutes);
      }
    };
    fetchToday();

    const interval = setInterval(async () => {
      const recent = await dataService.getRecentActivity(user.id, 1);
      const todayData = recent[0];
      
      const newMinutes = todayData.minutes + 1;
      await dataService.updateActivity(user.id, {
        ...todayData,
        minutes: newMinutes
      });
      
      setTodayMinutes(newMinutes);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('ink_currentUser', JSON.stringify(newUser));
  };

  const handleLogout = async () => {
    await dataService.logout();
    setUser(null);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleUseTemplate = (content: string) => {
    setEditorContent(content);
    setCurrentView(ViewState.EDITOR);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard user={user} />;
      case ViewState.TEMPLATES:
        return <TemplateLibrary onUseTemplate={handleUseTemplate} />;
      case ViewState.PHRASE_ATLAS:
        return <PhraseAtlas user={user} />;
      case ViewState.PRACTICE:
        return <PracticeStudio />;
      case ViewState.EDITOR:
        return <Editor user={user} initialContent={editorContent} onNavigate={setCurrentView} />;
      case ViewState.SIMULATOR:
        return <Simulator user={user} />;
      case ViewState.BOOTCAMP:
        return <Bootcamp user={user} />;
      case ViewState.STORY_MODE:
        return <StoryMode user={user} />;
      case ViewState.MUSEUM:
        return <LetterMuseum />;
      case ViewState.AI_TUTOR:
        return <AiTutor user={user} />;
      case ViewState.COMMUNITY:
        return <Community user={user} />;
      case ViewState.SEAL_STUDIO:
        return <SealStudio user={user} />;
      case ViewState.FLYING_FLOWER:
        return <FlyingFlower user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <UpgradeContext.Provider value={{ triggerUpgrade: () => setIsUpgradeModalOpen(true) }}>
      <div className="flex min-h-screen bg-stone-50 font-sans text-stone-900">
        <Nav 
          currentView={currentView} 
          setView={setCurrentView} 
          user={user}
          onLogout={handleLogout}
          todayMinutes={todayMinutes}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />

        <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 lg:ml-64 ml-0`}>
          {/* Mobile Header */}
          <div className="lg:hidden bg-stone-900 text-stone-200 p-4 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
               <button onClick={() => setIsMobileNavOpen(true)} className="p-1">
                 <Menu size={24} />
               </button>
               <div className="flex items-center gap-2">
                 <Feather size={18} className="text-stone-400"/>
                 <span className="font-calligraphy text-xl tracking-widest">墨客文心</span>
               </div>
             </div>
             <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center text-xs font-bold border border-stone-600`}>
                {user.name[0]}
             </div>
          </div>

          <div className="flex-1 p-4 lg:p-8 overflow-y-auto relative scroll-smooth">
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0 select-none">
               <h1 className="text-[20rem] font-calligraphy text-stone-900">书</h1>
            </div>
            <div className="relative z-10 h-full">
               {renderView()}
            </div>
          </div>
        </main>

        <UpgradeModal 
           isOpen={isUpgradeModalOpen} 
           onClose={() => setIsUpgradeModalOpen(false)}
           user={user}
           onUpgradeSuccess={(updatedUser) => {
             setUser(updatedUser);
             setIsUpgradeModalOpen(false);
           }}
        />
      </div>
    </UpgradeContext.Provider>
  );
};

export default App;
