
import React, { useEffect, useState, useRef } from 'react';
import { User, UserActivity } from '../types';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell
} from 'recharts';
import { Trophy, Flame, Book, PenTool, Download, Upload } from 'lucide-react';
import { dataService } from '../services/dataService';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activityHistory, setActivityHistory] = useState<UserActivity[]>([]);
  const [totalStats, setTotalStats] = useState({
    minutes: 0,
    words: 0,
    days: 0
  });
  // const [referralCode, setReferralCode] = useState('');
  // const [inputCode, setInputCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        // Fetch 7 days history
        const history = await dataService.getRecentActivity(user.id, 7);
        setActivityHistory(history);

        // Fetch Total Stats
        const stats = await dataService.getUserStats(user.id);
        setTotalStats(stats);

        // Fetch Referral - Hidden for now
        // const code = await dataService.getReferralCode(user.id);
        // setReferralCode(code);
    };

    fetchData();
  }, [user.id]);

  /* 
  const handleRedeem = async () => {
     if (!inputCode) return;
     const res = await dataService.redeemReferral(user.id, inputCode);
     alert(res.message);
     setInputCode('');
  };
  */
  
  const handleBackup = async () => {
    try {
        const jsonStr = await dataService.exportUserData(user.id);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ink_epistle_backup_${user.name}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Backup failed", e);
        alert("备份失败，请重试");
    }
  };

  const handleRestore = () => {
      fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const text = await file.text();
          const success = await dataService.importUserData(text);
          if (success) {
              alert("数据恢复成功！页面即将刷新...");
              window.location.reload();
          } else {
              alert("数据文件格式错误或损坏");
          }
      } catch (err) {
          console.error("Import Error", err);
          alert("导入失败");
      }
  };

  const skillData = [
    { subject: '辞藻', A: Math.min(80 + (totalStats.words / 100), 150), fullMark: 150 },
    { subject: '句式', A: Math.min(60 + (totalStats.minutes / 10), 150), fullMark: 150 },
    { subject: '情感', A: 70, fullMark: 150 },
    { subject: '典故', A: 50 + (activityHistory.filter(d => d.minutes > 0).length * 5), fullMark: 150 },
    { subject: '礼仪', A: 85, fullMark: 150 },
    { subject: '书法', A: 40, fullMark: 150 },
  ];

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-6 gap-6">
        <div>
            <h2 className="text-4xl font-serif font-bold text-stone-800 mb-2">墨客文心</h2>
            <p className="text-stone-500 font-serif">
              欢迎，<span className="font-bold text-stone-900">{user.name}</span> 
              <span className="text-xs ml-2 bg-stone-100 px-2 py-1 rounded text-stone-600">{user.styleName}</span>
            </p>
        </div>
        <div className="text-left md:text-right flex flex-col items-start md:items-end gap-4 flex-wrap w-full md:w-auto">
             <div className="flex gap-2 flex-wrap">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={onFileChange} 
                    accept="application/json" 
                    className="hidden" 
                />
                <button 
                onClick={handleRestore}
                className="text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm font-serif border border-stone-200 px-3 py-1 rounded hover:bg-stone-50"
                title="从备份文件恢复数据"
                >
                <Upload size={14} /> 导入恢复
                </button>
                <button 
                onClick={handleBackup}
                className="text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm font-serif border border-stone-200 px-3 py-1 rounded hover:bg-stone-50"
                title="导出个人数据备份"
                >
                <Download size={14} /> 数据备份
                </button>
             </div>
            <div>
                <p className="text-sm text-stone-400 uppercase tracking-widest mb-1">Current Level</p>
                <p className="text-3xl font-serif font-bold text-stone-900 flex items-center md:justify-end justify-start gap-2">
                <Trophy className="text-amber-600" size={24}/> 
                Lv. {Math.floor(totalStats.minutes / 60) + 1} 
                <span className="text-lg font-normal text-stone-400">
                    {totalStats.minutes < 60 ? '初学乍练' : totalStats.minutes < 300 ? '入室弟子' : '登堂入室'}
                </span>
                </p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">总修习时长</p>
            <p className="text-2xl font-serif font-bold text-stone-800">{totalStats.minutes} <span className="text-xs font-normal text-stone-400">分钟</span></p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-700">
            <Book size={24} />
          </div>
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">活跃天数</p>
            <p className="text-2xl font-serif font-bold text-stone-800">{totalStats.days} <span className="text-xs font-normal text-stone-400">天</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
            <PenTool size={24} />
          </div>
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">累计撰文</p>
            <p className="text-2xl font-serif font-bold text-stone-800">{totalStats.words} <span className="text-xs font-normal text-stone-400">字</span></p>
          </div>
        </div>

        <div className="bg-stone-900 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
             <Trophy size={80} />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase mb-1">文言等级</p>
          <div className="w-full bg-stone-700 h-2 rounded-full mb-2 mt-4">
            <div 
              className="bg-amber-500 h-2 rounded-full" 
              style={{width: `${Math.min((totalStats.minutes % 60) / 60 * 100, 100)}%`}}
            ></div>
          </div>
          <p className="text-xs text-stone-400 text-right">距离下一级还需 {60 - (totalStats.minutes % 60)} 分钟</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-serif font-bold text-stone-700 mb-6">近七日·修习时长</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityHistory} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                    <XAxis dataKey="date" stroke="#a8a29e" tick={{fontFamily: 'serif', fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#a8a29e" tick={{fontFamily: 'serif', fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f5f5f4'}}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', fontFamily: 'serif', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                      {activityHistory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === activityHistory.length - 1 ? '#1c1917' : '#d6d3d1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h3 className="text-lg font-serif font-bold text-stone-700 mb-6">能力六维</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                  <PolarGrid stroke="#e7e5e4" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#57534e', fontSize: 12, fontFamily: 'Noto Serif SC' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="My Skill"
                    dataKey="A"
                    stroke="#9f1239"
                    strokeWidth={2}
                    fill="#9f1239"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Referral Widget Hidden as requested */}
          {/* 
          <div className="bg-gradient-to-br from-stone-100 to-stone-200 p-6 rounded-xl border border-stone-300">
             <div className="flex items-center gap-2 mb-4 text-stone-800">
               <Ticket size={20} />
               <h3 className="font-serif font-bold">同袍招募</h3>
             </div>
             ...
          </div> 
          */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
