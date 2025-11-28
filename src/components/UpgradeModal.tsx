
import React, { useState } from 'react';
import { X, Check, Crown, Zap, Sparkles, Key } from 'lucide-react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpgradeSuccess: (updatedUser: User) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, user, onUpgradeSuccess }) => {
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);
    try {
      const res = await dataService.redeemLicenseKey(user.id, redeemCode);
      if (res.success) {
          const updatedUser = await dataService.upgradeUser(user.id);
          if (updatedUser) {
              alert(res.message);
              onUpgradeSuccess(updatedUser);
          }
      } else {
          alert(res.message);
      }
    } catch (e) {
      console.error(e);
      alert("兑换失败，请重试");
    } finally {
      setIsRedeeming(false);
    }
  };

  const PLANS = [
      { id: 'monthly', name: '月度会员', price: '¥10', original: '¥20', link: 'https://mbd.pub/o/bread/mbd-placeholder-1', tag: '限时优惠' },
      { id: 'quarterly', name: '季度会员', price: '¥27', original: '¥30', link: 'https://mbd.pub/o/bread/mbd-placeholder-2', tag: '9折' },
      { id: 'yearly', name: '年度会员', price: '¥100', original: '¥120', link: 'https://mbd.pub/o/bread/mbd-placeholder-3', tag: '超值' },
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors z-20"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-8 text-center relative overflow-hidden">
           <div className="relative z-10">
                <h2 className="text-3xl font-serif font-bold text-amber-500 mb-2 flex items-center justify-center gap-2">
                <Crown size={32} /> 升级墨客会员
                </h2>
                <p className="text-stone-400 text-sm">解锁高额 AI 额度，畅享深度图谱分析</p>
           </div>
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/shattered-island.png")'}}></div>
        </div>

        <div className="p-8">
            {/* Features */}
            <div className="flex flex-wrap justify-center gap-8 mb-10 text-stone-700">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-700"><Zap size={20}/></div>
                    <div>
                        <h4 className="font-bold text-sm">高额 AI 对话</h4>
                        <p className="text-xs text-stone-500">每日高达 200 次调用</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-700"><Sparkles size={20}/></div>
                    <div>
                        <h4 className="font-bold text-sm">深度图谱分析</h4>
                        <p className="text-xs text-stone-500">解锁全库名篇与高级分析</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-700"><Crown size={20}/></div>
                    <div>
                        <h4 className="font-bold text-sm">尊贵身份标识</h4>
                        <p className="text-xs text-stone-500">专属头像框与印章</p>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {PLANS.map(plan => (
                    <div key={plan.id} className="border border-stone-200 rounded-xl p-6 hover:shadow-lg hover:border-amber-400 transition-all relative group flex flex-col">
                        {plan.tag && <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">{plan.tag}</div>}
                        <h3 className="font-serif font-bold text-lg text-stone-800 mb-2">{plan.name}</h3>
                        <div className="mb-4">
                            <span className="text-3xl font-bold text-amber-600">{plan.price}</span>
                            <span className="text-sm text-stone-400 line-through ml-2">{plan.original}</span>
                        </div>
                        <a 
                          href={plan.link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-auto block w-full py-2 bg-stone-900 text-white text-center rounded hover:bg-stone-700 transition-colors font-serif text-sm"
                        >
                            购买兑换码
                        </a>
                    </div>
                ))}
            </div>

            {/* Redemption Area */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
                <h3 className="font-serif font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Key size={18} /> 已有兑换码？在此激活
                </h3>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={redeemCode}
                      onChange={e => setRedeemCode(e.target.value)}
                      placeholder="请输入卡密 (如: INK-M-XXXX)"
                      className="flex-1 p-3 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm uppercase"
                    />
                    <button 
                      onClick={handleRedeem}
                      disabled={isRedeeming || !redeemCode.trim()}
                      className="px-6 py-3 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 font-bold transition-colors"
                    >
                        {isRedeeming ? '验证中...' : '立即激活'}
                    </button>
                </div>
                <p className="text-xs text-stone-400 mt-2">
                    * 支付成功后，兑换码将自动发送至您的邮箱或在支付页面展示。
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
