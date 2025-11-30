import React, { useState } from 'react';

interface TemplateLibraryProps {
  onUseTemplate: (content: string) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onUseTemplate }) => {
  const [filter, setFilter] = useState('all');

  const templates = [
    // --- 问候 ---
    {
      id: 'greet-1',
      title: '岁末问安',
      category: '问候',
      desc: '岁暮天寒，致友人以问候。',
      content: '某启：\n\n岁暮天寒，想维兴居佳胜。久疏笺候，驰系良深。近况如何？伏惟珍摄。\n\n临书仓卒，不尽欲言。\n\n某再拜。'
    },
    {
      id: 'greet-2',
      title: '春日忆旧',
      category: '问候',
      desc: '春回大地，思念故人。',
      content: '某白：\n\n春风骀荡，万物昭苏。遥想足下风神爽朗，定当胜常。阔别经年，思积日深。何时重逢，共话巴山夜雨？\n\n顺颂\n\n春祺。'
    },
    {
      id: 'greet-3',
      title: '旅途报安',
      category: '问候',
      desc: '向家人报平安。',
      content: '大人膝下：\n\n儿已于昨日平安抵京，寓居某处，诸事顺遂。惟念双亲春秋已高，务祈保重。儿定当勤勉修业，以报养育之恩。\n\n肃此敬禀。\n\n儿 某某 叩上。'
    },

    // --- 求教 ---
    {
      id: 'ask-1',
      title: '借书求教',
      category: '求教',
      desc: '向师长借阅典籍并请教。',
      content: '夫子函丈：\n\n久钦高风，恨未亲炙。近读大作，如拨云雾而见青天。闻先生藏有古本《庄子》，不知可否借阅数日？敢祈恩准。\n\n专此奉恳，敬请\n\n道安。\n\n门生 某某 顿首。'
    },
    {
      id: 'ask-2',
      title: '请益解惑',
      category: '求教',
      desc: '读书遇阻，致函求师指点。',
      content: '某启：\n\n近读《史记》，至某篇处，颇多疑义，百思不得其解。先生学贯天人，乞赐指南，以开茅塞。若蒙教诲，感荷无既。\n\n肃此敬达。\n\n受业 某某 拜。'
    },
    {
      id: 'ask-3',
      title: '诗文求斧正',
      category: '求教',
      desc: '呈送拙作，请前辈指正。',
      content: '某顿首：\n\n向蒙奖掖，感铭五内。近成拙作数篇，未敢自珍，特呈钧鉴。伏乞不吝珠玉，严加斧正，幸甚幸甚。\n\n谨禀。\n\n后学 某某 上。'
    },

    // --- 致谢 ---
    {
      id: 'thank-1',
      title: '谢礼复函',
      category: '致谢',
      desc: '答谢友人赠礼。',
      content: '某顿首：\n\n惠书敬悉，承赐厚礼，感谢之至。愧不敢当，然长者赐，少者不敢辞，谨拜受之。他日当图报效。\n\n顺颂\n\n时绥。\n\n弟 某某 谨启。'
    },
    {
      id: 'thank-2',
      title: '谢荐举函',
      category: '致谢',
      desc: '感谢长辈推荐工作或机会。',
      content: '某启：\n\n蒙公大力吹嘘，得列门墙，实出望外。知遇之恩，没齿难忘。今后定当陨首结草，以报高厚。\n\n肃此鸣谢。\n\n晚 某某 拜。'
    },
    {
      id: 'thank-3',
      title: '谢款待函',
      category: '致谢',
      desc: '作客归来，致函感谢款待。',
      content: '某白：\n\n昨承盛馔，且聆清诲，快慰平生。归途回味，犹觉余香满口。隆情厚谊，铭感无已。\n\n专此申谢。\n\n弟 某某 顿首。'
    },

    // --- 赠别 ---
    {
      id: 'part-1',
      title: '送友远行',
      category: '赠别',
      desc: '送别友人赴任或远游。',
      content: '某白：\n\n闻君将作万里游，壮志可嘉，然离情别绪，难以言表。长亭更短亭，何日是归程？愿君一路珍重，早奏肤功。\n\n临歧执手，不尽依依。'
    },
    {
      id: 'part-2',
      title: '留别同窗',
      category: '赠别',
      desc: '毕业或结业，留别同窗。',
      content: '同窗足下：\n\n聚散无常，云萍偶迹。数载同窗，情逾骨肉。今兹一别，天各一方，尚祈毋忘旧雨。他日功成名就，倒屣相迎。\n\n珍重珍重。'
    },
    {
      id: 'part-3',
      title: '赠言勉别',
      category: '赠别',
      desc: '以言相赠，互相勉励。',
      content: '某启：\n\n海内存知己，天涯若比邻。君此去鹏程万里，前途无量。惟愿坚守初衷，勿忘在莒。后会有期，善自珍摄。\n\n弟 某某 拜手。'
    },

    // --- 致歉 ---
    {
      id: 'apology-1',
      title: '失约致歉',
      category: '致歉',
      desc: '因事未能赴约，致函道歉。',
      content: '某顿首：\n\n前承招宴，原本拟趋前请益。奈俗务羁身，不克分身，遂负雅意。中心惶恐，特此函告，乞赐原谅。\n\n容日登门谢罪。'
    },
    {
      id: 'apology-2',
      title: '迟复致歉',
      category: '致歉',
      desc: '回信太晚，表示歉意。',
      content: '某启：\n\n惠书早悉，只因琐事纷繁，未即裁答，致劳悬望，罪甚罪甚。今特修函奉复，尚祈海涵。\n\n悚息悚息。'
    },
    {
      id: 'apology-3',
      title: '误会致歉',
      category: '致歉',
      desc: '消除误会，请求宽恕。',
      content: '某白：\n\n顷闻流言，恐生芥蒂。弟素以此心质天日，绝无他意。尚望吾兄明察秋毫，勿信谗言。以此剖白，伏乞垂鉴。\n\n弟 某某 顿首。'
    },

    // --- 道贺 ---
    {
      id: 'congrats-1',
      title: '贺新婚',
      category: '道贺',
      desc: '祝贺朋友喜结连理。',
      content: '某某仁兄妆次：\n\n欣闻令郎完婚，秦晋联姻，珠联璧合。谨备薄仪，聊表芹献。愿佳偶天成，白头偕老。\n\n顺颂\n\n燕喜。'
    },
    {
      id: 'congrats-2',
      title: '贺高升',
      category: '道贺',
      desc: '祝贺升职或高中。',
      content: '某公阁下：\n\n欣闻荣升，实至名归。云程发轫，可喜可贺。伫看大展宏图，福国利民。\n\n专此驰贺。\n\n晚 某某 拜上。'
    },
    {
      id: 'congrats-3',
      title: '贺乔迁',
      category: '道贺',
      desc: '祝贺搬入新居。',
      content: '某启：\n\n闻君乔迁华厦，莺迁乔木，德必有邻。此时正如旭日东升，气象万千。特函奉贺，以志喜庆。\n\n顺颂\n\n安祺。'
    },

    // --- 探病 ---
    {
      id: 'sick-1',
      title: '闻病慰问',
      category: '探病',
      desc: '听说朋友生病，致函慰问。',
      content: '某启：\n\n惊闻贵体违和，系念殊深。吉人天相，定能勿药有喜。务祈安心静养，善自珍摄，早日康复。\n\n遥祝\n\n痊安。'
    },
    {
      id: 'sick-2',
      title: '病愈致贺',
      category: '探病',
      desc: '听说朋友病愈，去信祝贺。',
      content: '某白：\n\n闻足下沉疴顿愈，精神复旧，喜不自胜。此乃苍天庇佑，亦君善养之功。早春乍暖还寒，仍祈保重。\n\n顺颂\n\n近佳。'
    },

    // --- 劝勉 ---
    {
      id: 'encourage-1',
      title: '劝学',
      category: '劝勉',
      desc: '劝导晚辈勤奋向学。',
      content: '某儿知悉：\n\n韶光易逝，寸阴尺璧。汝正当英年，宜勤勉攻读，勿以嬉游废业。学问之道，贵在有恒。望汝好自为之。\n\n父 字。'
    },
    {
      id: 'encourage-2',
      title: '慰失意友',
      category: '劝勉',
      desc: '安慰考场或职场失意的朋友。',
      content: '某兄如晤：\n\n一时得失，何足挂齿？古之成大事者，莫不经百折而不挠。君才华横溢，终有展翼之时。望重整旗鼓，以此自勉。\n\n弟 某某 顿首。'
    },

    // --- 启事 ---
    {
      id: 'notice-1',
      title: '寻物启事',
      category: '启事',
      desc: '遗失物品，张贴启事寻找。',
      content: '启者：\n\n鄙人昨日于某处遗失折扇一把，扇面绘有兰草，落款某某。系先祖遗物，极具纪念之意。拾获者祈请送至某处，定当重酬。\n\n某某 敬启。'
    }
  ];

  const categories = ['all', '问候', '求教', '致谢', '赠别', '致歉', '道贺', '探病', '劝勉', '启事'];

  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.category === filter);

  return (
    <div className="p-10 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-10">
        <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">墨客文心·模版库</h2>
        <p className="text-stone-500">一眼即用，如武林秘籍之招式谱。</p>
      </header>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full text-sm font-serif transition-all whitespace-nowrap
              ${filter === cat 
                ? 'bg-stone-800 text-stone-50' 
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'}`}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-md font-serif">{template.category}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">{template.title}</h3>
            <p className="text-stone-500 text-sm mb-4 flex-grow">{template.desc}</p>
            
            <div className="bg-stone-50 p-4 rounded border border-stone-100 mb-4 font-serif text-stone-700 text-sm leading-relaxed line-clamp-6 whitespace-pre-wrap">
              {template.content}
            </div>

            <button 
              onClick={() => onUseTemplate(template.content)}
              className="w-full py-2 border border-stone-300 text-stone-800 font-serif rounded hover:bg-stone-900 hover:text-stone-50 transition-colors"
            >
              使用此模版
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateLibrary;