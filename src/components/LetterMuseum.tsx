

import React, { useState } from 'react';
import { Music, Loader2, ArrowLeft, BookOpen, Type } from 'lucide-react';
import { annotatePinyin } from '../services/geminiService';

interface ClassicLetter {
  id: string;
  title: string;
  author: string;
  recipient: string;
  content: string;
  translation: string;
  analysis: string;
}

const LetterMuseum: React.FC = () => {
  const [activeLetterId, setActiveLetterId] = useState('l1');
  const [tab, setTab] = useState<'original' | 'translation' | 'analysis'>('original');
  const [isPinyinMode, setIsPinyinMode] = useState(false);
  const [pinyinCache, setPinyinCache] = useState<Record<string, string>>({});
  const [isLoadingPinyin, setIsLoadingPinyin] = useState(false);
  const [fontSize, setFontSize] = useState<'text-lg' | 'text-xl' | 'text-2xl'>('text-lg');
  
  // Mobile View State: 'list' or 'detail'
  // On Desktop (lg), this state is ignored as both are shown
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const letters: ClassicLetter[] = [
    {
      id: 'l1',
      title: '与吴质书',
      author: '曹丕',
      recipient: '吴质',
      content: `二月三日，丕白。\n\n岁月易得，别来行复四年。三年不见，东山犹叹其远，况乃过河朔，在其北乎！\n\n昔日游处，行则连舆，止则接席，何曾须臾相失。每至觞酌流行，丝竹并奏，酒酣耳热，仰而赋诗。当此之时，忽然不自知乐也。谓百年己分，可长共相保，何图数年之间，零落略尽，言之伤心。\n\n顷撰其遗文，都为一集。观其姓名，已为鬼录。追思昔游，犹在心目，而此诸子化为粪土，可复道哉！\n\n少壮真当努力，年一过往，何可攀援？古人思秉烛夜游，良有以也。`,
      translation: `二月三日，曹丕报告。\n\n岁月流逝得真快，离别以来，又已过了四年。三年不见，东山人还感叹分离之远，何况您去了河朔，在更远的北方呢！\n\n回想往日交游，出行时车子连着车子，休息时座席接着座席，何曾片刻分离。每当酒杯流转，琴瑟齐奏，喝得酣畅，耳热面红，仰头赋诗。在那个时候，忽然不知道什么是快乐（因为快乐到了极致）。本以为我们这一生，可以长久相聚，哪知道数年之间，老友们凋零殆尽，说起来真让人伤心。\n\n最近我编纂了他们的遗文，汇成文集。看着他们的名字，都已是鬼录上的人。追思往日游乐，历历在目，而这些人已化为粪土，还能再说什么呢！\n\n少壮真当努力，岁月一过，怎能留得住？古人说要秉烛夜游，确实是有道理的。`,
      analysis: `【结构之美】\n此信以“悲”贯穿全文。先叹别离之久，再忆往昔之乐，以乐衬悲，最后感叹人生无常，勉励及时行乐（实为努力建功立业）。\n\n【名句赏析】\n“少壮真当努力，年一过往，何可攀援？”\n不仅是感叹时光易逝，更体现了建安风骨中那种积极进取、不甘沉沦的精神。\n\n【用典】\n“东山犹叹其远”：引用《诗经·豳风·东山》，表达离别之苦。`
    },
    {
      id: 'l2',
      title: '山中与佩秀才书',
      author: '王维',
      recipient: '裴迪',
      content: `近腊月下，景气和畅，故山殊可过。足下方温经，猥不敢相烦，辄便往山中，憩感配寺，与山僧饭讫而去。\n\n北涉玄灞，清月映郭。夜登华子冈，辋水沦涟，与月上下。寒山远火，明灭林外。深巷寒犬，吠声如豹。村墟夜舂，复与疏钟相间。此时独坐，僮仆静默，多思曩昔携手赋诗，步仄径，临清流也。\n\n当待春中，草木蔓发，春山可望，轻鲦出水，白鸥矫翼，露湿青皋，麦陇朝雊，斯之不远，倘能从我游乎？非子天机清妙者，岂能以此不急之务相邀。然是中有深趣矣！无忽。\n\n因驮黄柏人往，不一。山中人王维白。`,
      translation: `临近腊月，气候温和舒畅，旧居的山景真值得一游。您正在温习经书，我不敢轻易打扰，就独自去了山中，在感配寺休息，和山僧吃完饭就离开了。\n\n往北渡过灞水，清冷的月光映照着城郭。夜里登上华子冈，辋水泛起涟漪，波光与月影上下浮动。寒山远处的灯火，在林外忽明忽暗。深巷中寒犬叫声像豹子一样。村落里的舂米声，又与稀疏的钟声相间。此时我独自坐着，僮仆静默，多回想往日我们携手赋诗，走在狭窄的小径，面临清澈的流水。\n\n等到春天，草木蔓延生长，春山在望，轻捷的鲦鱼跃出水面，白鸥张开翅膀，露水打湿青青的泽畔，麦垄间野鸡鸣叫，这光景不远了，您能随我同游吗？如果不是像您这样天性清妙的人，我怎么能拿这（游山玩水）不紧要的事务相邀呢？但这其中有深趣啊！千万不要忽略。\n\n借托运黄柏的人带信给您，不多说了。山中人王维报告。`,
      analysis: `【意境之美】\n全信如一幅流动的山水画。先写冬夜之景，“寒山远火”、“深巷寒犬”，以动衬静，清冷幽绝；再写春日之想，“草木蔓发”、“轻鲦出水”，生机勃勃。\n\n【情致】\n“非子天机清妙者，岂能以此不急之务相邀。”\n点明了两人志趣相投，视山水之乐为人生至乐，这种“不急之务”实则是心灵的急需。`
    },
    {
      id: 'l3',
      title: '答谢中书书',
      author: '陶弘景',
      recipient: '谢中书',
      content: `山川之美，古来共谈。高峰入云，清流见底。两岸石壁，五色交辉。青林翠竹，四时俱备。晓雾将歇，猿鸟乱鸣；夕日欲颓，沉鳞竞跃。实是欲界之仙都。自康乐以来，未复有能与奇者。`,
      translation: `山川景色的美丽，自古以来就是文人雅士共同谈论的。巍峨的山峰耸入云端，明净的溪流清澈见底。两岸的石壁色彩斑斓，交相辉映。青葱的林木，翠绿的竹丛，四季常存。清晨的薄雾将要消散的时候，猿、鸟此起彼伏地鸣叫；夕阳快要落山的时候，潜游在水中的鱼儿争相跳出水面。这里实在是人间的仙境啊。自从南朝的谢灵运以来，就再也没有人能够欣赏这种奇丽的景色了。`,
      analysis: `【写景手法】\n极简极美。全篇仅六十八字，却概括了山川晨昏四季之美。仰视“高峰入云”，俯视“清流见底”，动静结合，色彩鲜明。\n\n【情感】\n最后一句“自康乐以来，未复有能与奇者”，既是对谢灵运的推崇，也流露出作者对自己审美情趣的自负与自得。`
    },
    {
      id: 'l4',
      title: '报任安书（节选）',
      author: '司马迁',
      recipient: '任安',
      content: `太史公牛马走司马迁，再拜言。\n\n少卿足下：曩者辱赐书，教以慎于接物，推贤进士为务，意气勤勤恳恳。\n\n仆窃不逊，近自托于无能之辞，网罗天下放失旧闻，考之行事，稽其成败兴坏之理，上计轩辕，下至于兹，为十表，本纪十二，书八章，世家三十，列传七十，凡百三十篇。亦欲以究天人之际，通古今之变，成一家之言。\n\n草创未就，会遭此祸，惜其不成，是以就极刑而无愠色。仆诚以著此书，藏之名山，传之其人，通邑大都，则仆偿前辱之责，虽万被戮，岂有悔哉！\n\n然此可为智者道，难为俗人言也！`,
      translation: `太史公、像牛马一样供人驱使的司马迁，再拜陈述。\n\n少卿足下：前些时候承蒙您屈尊致信，教导我要谨慎待人，以推举贤能为己任，情意恳切。\n\n我私下不自量力，最近借托于无能的言辞，搜罗天下散失的旧闻，考证历史事件，考察其成败兴亡的道理。上起轩辕黄帝，下至当今，作成十表、本纪十二、书八章、世家三十、列传七十，共一百三十篇。也想以此来探究天道与人事的关系，通晓古今变化的规律，成为一家之言。\n\n初稿尚未完成，正好遭逢这场灾祸（李陵之祸），痛惜全书没有完成，因此即使受极刑（宫刑）也没有怨色。我如果真能写完这部书，将它藏在名山，传之其人，流传于通都大邑，那么我就偿还了以前受辱的债，即使被杀一万次，又有什么后悔的呢！\n\n然而这些话只能对智者说，很难对俗人讲啊！`,
      analysis: `【千古名句】\n“究天人之际，通古今之变，成一家之言。”\n这是司马迁修《史记》的宏伟目标，也是中国史学的最高理想。\n\n【精神内核】\n忍辱负重。司马迁以极大的毅力，在遭受宫刑奇耻大辱后，为了完成《史记》，选择了活下去。这封信是他内心痛苦与坚守的真实写照，读来令人动容。`
    },
    {
      id: 'l5',
      title: '陈情表',
      author: '李密',
      recipient: '晋武帝',
      content: `臣密言：臣以险衅，夙遭闵凶。生孩六月，慈父见背；行年四岁，舅夺母志。祖母刘悯臣孤弱，躬亲抚养。臣少多疾病，九岁不行，零丁孤苦，至于成立。\n\n……\n\n伏惟圣朝以孝治天下，凡在故老，犹蒙矜育，况臣孤苦，特为尤甚。且臣少仕伪朝，历职郎署，本图宦达，不矜名节。今臣亡国贱俘，至微至陋，过蒙拔擢，宠命优渥，岂敢盘桓，有所希冀。但以刘日薄西山，气息奄奄，人命危浅，朝不虑夕。臣无祖母，无以至今日；祖母无臣，无以终余年。母、孙二人，更相为命，是以区区不能废远。\n\n臣之辛苦，非独蜀之人士及二州牧伯所见明知，皇天后土实所共鉴。愿陛下矜悯愚诚，听臣微志，庶刘侥幸，保卒余年。臣生当陨首，死当结草。臣不胜犬马怖惧之情，谨拜表以闻。`,
      translation: `臣李密陈言：我因命运多舛，早遭不幸。生下来六个月，慈父就去世了；长到四岁，舅父强迫母亲改嫁。祖母刘氏怜惜我孤单弱小，亲自抚养。我小时候多病，九岁还不能走路，孤独困苦，直到长大成人。\n\n……\n\n我以此想到圣朝是以孝道治理天下的，凡是故旧老人，尚且受到怜惜抚育，何况我如此孤苦，特为严重。况且我年轻时曾在伪朝（蜀汉）做官，历任郎官，本想图个官职显达，并不自惜名节。现在我是亡国贱俘，卑微鄙陋，承蒙过分提拔，恩命优厚，怎么敢犹豫观望，有什么非分之想呢？只是因为祖母刘氏如夕阳西下，气息微弱，生命垂危，朝不保夕。我如果没有祖母，就活不到今天；祖母如果没有我，也没法度过晚年。我们要相依为命，因此我这一点私情，不能废止而去远方就职。\n\n我的辛酸苦楚，不单是蜀地人士和二州长官所明白知道的，皇天后土也都能作证。希望陛下怜悯我的诚心，准许我微小的志愿，或许祖母刘氏能够侥幸保全余年。我活着应当杀身报效，死后也当结草衔环来报答。我怀着像犬马一样恐惧的心情，恭敬地呈上此表来让您知道。`,
      analysis: `【情理交融】\n李密如果不去应召，会有杀身之祸（被认为不忠）；如果去应召，祖母无人奉养（不孝）。他巧妙地提出了“孝治天下”的大义，将“忠”与“孝”统一起来，不仅化解了危机，还打动了晋武帝。\n\n【语言特色】\n“日薄西山，气息奄奄，人命危浅，朝不虑夕”四字句连用，悲恻动人，成为形容垂危老人的千古名句。`
    }
  ];

  const activeLetter = letters.find(l => l.id === activeLetterId) || letters[0];

  const handleTogglePinyin = async () => {
    if (tab !== 'original') return; // Only annotate original text

    if (isPinyinMode) {
        setIsPinyinMode(false);
        return;
    }

    // Check cache first
    if (pinyinCache[activeLetterId]) {
        setIsPinyinMode(true);
        return;
    }

    setIsLoadingPinyin(true);
    const annotated = await annotatePinyin(activeLetter.content);
    setPinyinCache(prev => ({ ...prev, [activeLetterId]: annotated }));
    setIsPinyinMode(true);
    setIsLoadingPinyin(false);
  };

  const handleSelectLetter = (id: string) => {
    setActiveLetterId(id);
    setIsPinyinMode(false);
    // On Mobile, switch to detail view
    setMobileView('detail');
    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto h-full flex flex-col lg:flex-row gap-8 animate-fade-in">
      {/* Sidebar List - Hidden on Mobile if in Detail view */}
      <div className={`
          w-full lg:w-1/4 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex-col
          ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}
      `}>
         <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center gap-2">
           <BookOpen size={18} className="text-stone-500"/>
           <h2 className="font-serif font-bold text-stone-800">经典书简目录</h2>
         </div>
         <div className="overflow-y-auto flex-1 h-[70vh] lg:h-auto">
           {letters.map(l => (
             <button
               key={l.id}
               onClick={() => handleSelectLetter(l.id)}
               className={`w-full text-left p-4 border-b border-stone-100 transition-colors
                 ${activeLetterId === l.id ? 'bg-stone-900 text-white' : 'hover:bg-stone-50 text-stone-600'}
               `}
             >
               <h3 className="font-serif font-bold text-lg">{l.title}</h3>
               <p className={`text-xs mt-1 ${activeLetterId === l.id ? 'text-stone-400' : 'text-stone-400'}`}>{l.author} 致 {l.recipient}</p>
             </button>
           ))}
         </div>
      </div>

      {/* Main Content - Hidden on Mobile if in List view */}
      <div className={`
          flex-1 bg-white rounded-xl border border-stone-200 shadow-sm flex-col relative overflow-hidden
          ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
      `}>
         {/* Mobile Back Button */}
         <div className="lg:hidden p-2 border-b border-stone-100 flex items-center text-stone-500">
            <button 
              onClick={() => setMobileView('list')}
              className="flex items-center gap-1 px-2 py-1 hover:text-stone-900 transition-colors"
            >
                <ArrowLeft size={18} /> <span className="text-sm font-bold">返回目录</span>
            </button>
         </div>

         {/* Tabs */}
         <div className="flex border-b border-stone-200 overflow-x-auto">
            <button 
              onClick={() => { setTab('original'); setIsPinyinMode(false); }}
              className={`flex-1 min-w-[100px] py-4 font-serif font-bold transition-colors whitespace-nowrap ${tab === 'original' ? 'bg-white text-red-800 border-b-2 border-red-800' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
            >
              原文鉴赏
            </button>
            <button 
              onClick={() => { setTab('translation'); setIsPinyinMode(false); }}
              className={`flex-1 min-w-[100px] py-4 font-serif font-bold transition-colors whitespace-nowrap ${tab === 'translation' ? 'bg-white text-stone-900 border-b-2 border-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
            >
              现代译文
            </button>
            <button 
              onClick={() => { setTab('analysis'); setIsPinyinMode(false); }}
              className={`flex-1 min-w-[100px] py-4 font-serif font-bold transition-colors whitespace-nowrap ${tab === 'analysis' ? 'bg-white text-stone-900 border-b-2 border-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
            >
              深度拆解
            </button>
         </div>
         
         {/* Toolbar for Original Text */}
         <div className="absolute top-14 lg:top-16 right-4 lg:right-6 z-10 flex gap-2">
            {tab === 'original' && (
                 <button 
                    onClick={handleTogglePinyin}
                    disabled={isLoadingPinyin}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs lg:text-sm font-serif border transition-all shadow-sm
                        ${isPinyinMode ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}
                    `}
                 >
                    {isLoadingPinyin ? <Loader2 size={14} className="animate-spin" /> : <Music size={14} />}
                    <span className="hidden sm:inline">{isPinyinMode ? '隐藏注音' : '智能注音'}</span>
                 </button>
             )}
             
             {/* Font Size Toggle */}
             <div className="flex bg-white rounded-full border border-stone-200 shadow-sm overflow-hidden">
                <button 
                    onClick={() => setFontSize('text-lg')} 
                    className={`px-3 py-1 text-xs font-serif ${fontSize === 'text-lg' ? 'bg-stone-800 text-white' : 'hover:bg-stone-50'}`}
                    title="默认"
                >
                   <Type size={12} />
                </button>
                <button 
                    onClick={() => setFontSize('text-xl')} 
                    className={`px-3 py-1 text-sm font-serif ${fontSize === 'text-xl' ? 'bg-stone-800 text-white' : 'hover:bg-stone-50'}`}
                    title="中"
                >
                   <Type size={14} />
                </button>
                <button 
                    onClick={() => setFontSize('text-2xl')} 
                    className={`px-3 py-1 text-base font-serif ${fontSize === 'text-2xl' ? 'bg-stone-800 text-white' : 'hover:bg-stone-50'}`}
                    title="大"
                >
                   <Type size={16} />
                </button>
             </div>
         </div>

         {/* Content Body */}
         <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
               <h1 className="text-2xl lg:text-3xl font-serif font-bold text-center mb-2 text-stone-900">{activeLetter.title}</h1>
               <p className="text-center text-stone-500 font-serif mb-8 lg:mb-10">[{activeLetter.author}]</p>

               <div className="prose prose-lg prose-stone font-serif leading-loose mx-auto">
                 {tab === 'original' && (
                   isPinyinMode && pinyinCache[activeLetterId] ? (
                       <div 
                         className={`${fontSize} relative transition-all`}
                         dangerouslySetInnerHTML={{ __html: pinyinCache[activeLetterId] }}
                       />
                   ) : (
                       <div className={`${fontSize} whitespace-pre-wrap relative transition-all`}>
                          {activeLetter.content}
                       </div>
                   )
                 )}
                 {tab === 'translation' && (
                   <div className="text-stone-700 whitespace-pre-wrap text-lg">
                      {activeLetter.translation}
                   </div>
                 )}
                 {tab === 'analysis' && (
                   <div className="text-stone-700 whitespace-pre-wrap bg-stone-50 p-6 rounded-lg border border-stone-200 text-lg">
                      {activeLetter.analysis}
                   </div>
                 )}
               </div>
            </div>
         </div>

         {/* Decorative Stamp */}
         <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none hidden lg:block">
            <div className="w-32 h-32 border-4 border-red-900 rounded flex items-center justify-center transform -rotate-12">
               <span className="font-calligraphy text-4xl text-red-900 writing-vertical">千古名篇</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default LetterMuseum;
