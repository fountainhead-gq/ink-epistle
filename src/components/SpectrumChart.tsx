
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SpectrumData } from '../types';
import { Share2, Check } from 'lucide-react';

interface SpectrumChartProps {
  data: SpectrumData;
}

const SpectrumChart: React.FC<SpectrumChartProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const chartData = [
    { subject: '气象 (Warmth)', A: data.temperature, fullMark: 100 },
    { subject: '风格 (Gentle)', A: data.style, fullMark: 100 },
    { subject: '情绪 (Joy)', A: data.emotion, fullMark: 100 },
    { subject: '句法 (Rigid)', A: data.structure, fullMark: 100 },
    { subject: '节奏 (Fast)', A: data.rhythm, fullMark: 100 },
  ];

  // Helper to interpret score
  const getLabel = (key: keyof SpectrumData, val: number) => {
    if (key === 'temperature') return val > 50 ? '暖 (Warm)' : '冷 (Cold)';
    if (key === 'style') return val > 50 ? '温 (Gentle)' : '峻 (Sharp)';
    if (key === 'emotion') return val > 50 ? '喜 (Joy)' : '悲 (Sad)';
    if (key === 'structure') return val > 50 ? '整 (Neat)' : '散 (Loose)';
    if (key === 'rhythm') return val > 50 ? '急 (Fast)' : '缓 (Slow)';
    return '';
  };

  const handleShare = () => {
    const summary = `【文言尺牍光谱分析】
气象：${getLabel('temperature', data.temperature)} (${data.temperature})
风格：${getLabel('style', data.style)} (${data.style})
情绪：${getLabel('emotion', data.emotion)} (${data.emotion})
节奏：${getLabel('rhythm', data.rhythm)} (${data.rhythm})
章法：${getLabel('structure', data.structure)} (${data.structure})

AI评语：${data.summary}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#fffdf5] p-6 rounded-xl border border-stone-200 h-full flex flex-col relative">
      <button 
        onClick={handleShare} 
        className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 flex items-center gap-1 bg-white/50 p-1 rounded" 
        title="复制分析摘要"
      >
        {copied ? <Check size={18} className="text-green-600"/> : <Share2 size={18} />}
        {copied && <span className="text-xs text-green-600 font-serif">已复制</span>}
      </button>

      <h3 className="font-serif font-bold text-stone-800 mb-2 text-center">一信一图谱</h3>
      <p className="text-xs text-stone-500 text-center mb-4 italic font-serif">{data.summary}</p>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#d6d3d1" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#57534e', fontSize: 12, fontFamily: 'Noto Serif SC' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Spectrum"
              dataKey="A"
              stroke="#9f1239"
              strokeWidth={2}
              fill="#9f1239"
              fillOpacity={0.6}
            />
            <Tooltip 
               contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e7e5e4', fontFamily: 'serif'}}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-serif">
         <div className="flex justify-between p-2 bg-white rounded border border-stone-100">
           <span className="text-stone-400">气象</span>
           <span className="font-bold text-stone-700">{getLabel('temperature', data.temperature)}</span>
         </div>
         <div className="flex justify-between p-2 bg-white rounded border border-stone-100">
           <span className="text-stone-400">风格</span>
           <span className="font-bold text-stone-700">{getLabel('style', data.style)}</span>
         </div>
         <div className="flex justify-between p-2 bg-white rounded border border-stone-100">
           <span className="text-stone-400">节奏</span>
           <span className="font-bold text-stone-700">{getLabel('rhythm', data.rhythm)}</span>
         </div>
         <div className="flex justify-between p-2 bg-white rounded border border-stone-100">
           <span className="text-stone-400">章法</span>
           <span className="font-bold text-stone-700">{getLabel('structure', data.structure)}</span>
         </div>
      </div>
    </div>
  );
};

export default SpectrumChart;
