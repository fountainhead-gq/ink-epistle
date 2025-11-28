import React, { useState } from 'react';
import { X, Check, Crown, Zap, Sparkles } from 'lucide-react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpgradeSuccess: (updatedUser: User) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, user, onUpgradeSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updatedUser = await dataService.upgradeUser(user.id);
      if (updatedUser) {
        onUpgradeSuccess(updatedUser);
      }
    } catch (e) {
      console.error(e);
      alert("升级失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/50 rounded-full hover:bg-stone-200 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Left Side: Art & Value */}
        <div className="w-full md:w-2/5 bg-stone-900 text-stone-100 p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/shattered-island.png")'}}></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-serif font-bold text-amber-500 mb-2 flex items-center gap-2">
              <Crown size={28} /> 墨客会员
            </h2>
            <p className="text-stone-400 text-sm mb-8">解锁文言尺牍的全部潜能</p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded bg-stone-800 flex items-center justify-center shrink-0 text-amber-500"><Zap size={20}/></div>
                 <div>
                   <h4 className="font-bold text-stone-200">无限 AI 额度</h4>
                   <p className="text-xs text-stone-500 mt-1">不再受每日 20 次对话限制，畅享文言导师与润色服务。</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded bg-stone-800 flex items-center justify-center shrink-0 text-amber-500"><Sparkles size={20}/></div>
                 <div>
                   <h4 className="font-bold text-stone-200">深度图谱分析</h4>
                   <p className="text-xs text-stone-500 mt-1">解锁书简体验馆全部名篇，获取更精准的“一信一图谱”解读。</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-8 relative z-10">
             <div className="text-3xl font-bold font-serif">¥ 18 <span className="text-sm font-normal text-stone-500">/ 月</span></div>
             <p className="text-xs text-stone-500 mt-1">一杯茶钱，习得一生文气。</p>
          </div>
        </div>

        {/* Right Side: Features Comparison */}
        <div className="w-full md:w-3/5 p-8 bg-white flex flex-col">
          <h3 className="text-xl font-serif font-bold text-stone-800 mb-6 text-center">权益对比</h3>
          
          <div className="flex-1 space-y-4">
             {/* Header Row */}
             <div className="grid grid-cols-3 text-sm font-bold border-b border-stone-100 pb-2">
               <div className="text-stone-400">功能特权</div>
               <div className="text-center text-stone-500">普通学士</div>
               <div className="text-center text-amber-600">墨客会员</div>
             </div>

             <div className="grid grid-cols-3 text-sm py-2 items-center">
               <div className="text-stone-600 font-serif">每日 AI 对话</div>
               <div className="text-center text-stone-500">20 次</div>
               <div className="text-center text-amber-600 font-bold flex justify-center gap-1"><Zap size={14} fill="currentColor"/> 无限</div>
             </div>

             <div className="grid grid-cols-3 text-sm py-2 items-center bg-stone-50 rounded px-2">
               <div className="text-stone-600 font-serif">文言导师</div>
               <div className="text-center text-stone-500">基础建议</div>
               <div className="text-center text-amber-600 font-bold">全历史记忆</div>
             </div>

             <div className="grid grid-cols-3 text-sm py-2 items-center">
               <div className="text-stone-600 font-serif">书简体验馆</div>
               <div className="text-center text-stone-500">限免 3 篇</div>
               <div className="text-center text-amber-600 font-bold">全库 100+</div>
             </div>

             <div className="grid grid-cols-3 text-sm py-2 items-center bg-stone-50 rounded px-2">
               <div className="text-stone-600 font-serif">多端同步</div>
               <div className="text-center text-stone-500"><Check size={16} className="mx-auto"/></div>
               <div className="text-center text-amber-600 font-bold"><Check size={16} className="mx-auto"/></div>
             </div>
          </div>

          <button 
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold font-serif text-lg shadow-lg hover:shadow-amber-200 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? '支付处理中...' : '立即开通会员'}
          </button>
          <p className="text-center text-[10px] text-stone-400 mt-3">
             点击即代表同意《会员服务协议》。支持微信/支付宝支付。
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
