
import React from 'react';
import { RhythmData } from '../types';

interface RhythmVisualizerProps {
  data: RhythmData;
}

const RhythmVisualizer: React.FC<RhythmVisualizerProps> = ({ data }) => {
  if (!data || !data.sentences || data.sentences.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-stone-200 h-full overflow-y-auto">
      <h3 className="font-serif font-bold text-stone-800 mb-4 border-b border-stone-200 pb-2 flex items-center justify-between">
        <span>文言节奏引擎</span>
        <span className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-500">错落度: {data.varianceScore}</span>
      </h3>

      {/* Legend */}
      <div className="flex gap-4 mb-6 text-xs font-serif text-stone-500 justify-center">
        <div className="flex items-center gap-1"><span className="w-3 h-3 border border-stone-400 rounded-full bg-white"></span> 平 (Ping)</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 border border-stone-800 bg-stone-800 rounded-full"></span> 仄 (Ze)</div>
      </div>

      {/* Sentences & Tones */}
      <div className="space-y-6">
        {data.sentences.map((sent, idx) => (
          <div key={idx} className="flex flex-col items-center">
            {/* Tone Dots */}
            <div className="flex gap-2 mb-1">
              {sent.tones.map((tone, tIdx) => (
                <div 
                  key={tIdx}
                  className={`w-3 h-3 rounded-full border transition-all
                    ${tone === 'ping' ? 'border-stone-400 bg-white' : tone === 'ze' ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-transparent'}
                  `}
                  title={tone}
                ></div>
              ))}
            </div>
            
            {/* Text */}
            <div className="flex gap-2 font-serif text-xl text-stone-800 tracking-widest">
              {sent.text.split('').map((char, cIdx) => {
                 const isRhyme = data.rhymeScheme.includes(char);
                 return (
                   <span key={cIdx} className={`relative ${isRhyme ? 'text-red-800 font-bold' : ''}`}>
                     {char}
                     {isRhyme && <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-800 rounded-full"></span>}
                   </span>
                 );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Rhythm Bar Chart (Visualization of Cuo Luo) */}
      <div className="mt-10">
        <p className="text-xs font-bold text-stone-400 uppercase mb-2 text-center">长短句势 (Sentence Length)</p>
        <div className="flex items-end justify-center gap-1 h-24 border-b border-stone-200 pb-1 px-4">
           {data.sentences.map((s, i) => (
             <div 
               key={i} 
               className="bg-stone-300 hover:bg-stone-500 transition-colors w-4 rounded-t-sm"
               style={{ height: `${Math.min((s.text.length / 20) * 100, 100)}%` }}
               title={`${s.text.length}字`}
             ></div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default RhythmVisualizer;
