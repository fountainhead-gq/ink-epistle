
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Feather, Loader2, Cloud, HardDrive, AlertCircle, ArrowLeft, KeyRound, Mail, Eye, EyeOff, Smartphone,  CheckCircle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface LoginProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'update_password';
type LoginMethod = 'email' | 'phone';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login'); 
  const [method, setMethod] = useState<LoginMethod>('email');
  const [showPassword, setShowPassword] = useState(false);
  
  // Local Fields
  const [name, setName] = useState('');
  const [styleName, setStyleName] = useState('');
  
  // Cloud Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // OTP Hint State (Inline)
  const [otpHint, setOtpHint] = useState('');
  
  // OTP Timer
  const [countdown, setCountdown] = useState(0);

  // Listen for Password Recovery events
  useEffect(() => {
    const { data } = dataService.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
            setAuthMode('update_password');
            setSuccessMsg("验证成功，请设置新密码");
        }
    });
    return () => {
        data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
      let interval: any;
      if (countdown > 0) {
          interval = setInterval(() => setCountdown(c => c - 1), 1000);
      }
      return () => clearInterval(interval);
  }, [countdown]);

  const isValidPhone = (p: string) => /^1[3-9]\d{9}$/.test(p);

  const handleSendCode = async () => {
      if (!phone) {
          setErrorMsg("请输入手机号码");
          return;
      }
      if (!isValidPhone(phone)) {
          setErrorMsg("请输入有效的11位手机号码");
          return;
      }

      setErrorMsg('');
      setSuccessMsg('');
      setOtpHint('');
      
      try {
          const msg = await dataService.sendPhoneOtp(phone);
          setOtpHint(msg);
          setCountdown(60);
      } catch (e: any) {
          console.error("Send OTP failed", e);
          setErrorMsg(e.message || "验证码发送失败");
      }
  };

  const handleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // 1. Forgot Password Flow
      if (authMode === 'forgot_password') {
          if (!email) throw new Error("请输入注册邮箱");
          await dataService.resetPassword(email);
          setSuccessMsg("重置邮件已发送，请查收邮箱");
          setIsLoading(false);
          return;
      }

      // 2. Update Password Flow
      if (authMode === 'update_password') {
          if (!password || password.length < 6) throw new Error("新密码长度需至少 6 位");
          await dataService.updateUserPassword(password);
          setSuccessMsg("密码修改成功！请重新登录");
          setTimeout(() => setAuthMode('login'), 2000);
          setIsLoading(false);
          return;
      }

      // 3. Login/Register Flow
      let user: User | null = null;
      let requireConfirmation = false;

      if (dataService.isCloudMode) {
        if (method === 'phone') {
            if (!phone) throw new Error("请输入手机号");
            if (!isValidPhone(phone)) throw new Error("请输入有效的11位手机号码");
            if (!otp) throw new Error("请输入验证码");
            
            let extra = undefined;
            if (authMode === 'register') {
                if (!name) throw new Error("注册需填写昵称");
                extra = {
                    name: name,
                    styleName: styleName || '新晋学士',
                    avatarColor: ['bg-amber-700', 'bg-rose-700', 'bg-emerald-700', 'bg-indigo-700', 'bg-stone-700'][Math.floor(Math.random() * 5)]
                };
            }
            
            user = await dataService.verifyPhoneOtp(phone, otp, extra);
        } else {
            // Email Flow
            if (!email) throw new Error("请输入邮箱");
            if (!password) throw new Error("请输入密码");

            if (authMode === 'login') {
               user = await dataService.login(email, password);
            } else {
               if (!name) throw new Error("注册需填写昵称");
               const extra = {
                 name: name,
                 styleName: styleName || '新晋学士',
                 avatarColor: ['bg-amber-700', 'bg-rose-700', 'bg-emerald-700', 'bg-indigo-700', 'bg-stone-700'][Math.floor(Math.random() * 5)]
               };
               
               const res = await dataService.register(email, password, extra);
               user = res.user;
               requireConfirmation = res.requireConfirmation;
            }
        }
      } else {
        // Local Mode
        if (!name.trim()) throw new Error("请输入尊姓大名");
        
        const newUser: User = {
          id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000),
          name: name,
          styleName: styleName || '白衣秀士',
          avatarColor: ['bg-amber-700', 'bg-rose-700', 'bg-emerald-700', 'bg-indigo-700', 'bg-stone-700'][Math.floor(Math.random() * 5)],
          joinedDate: new Date().toISOString()
        };
        
        const res = await dataService.register(name, undefined, newUser);
        user = res.user;
      }

      if (user && !requireConfirmation) {
        await dataService.updateActivity(user.id, { loginCount: 1 });
        onLogin(user);
      } else if (requireConfirmation) {
        setSuccessMsg("注册成功！请前往邮箱/手机查收确认信息以激活账号。");
        setAuthMode('login'); 
      } else {
        if (!user && method === 'phone' && authMode === 'login') {
             throw new Error("认证失败，请检查验证码是否过期");
        }
        if (!user) throw new Error("认证失败，请检查凭证");
      }

    } catch (e: any) {
      console.error("Auth failed", e);
      let message = e.message || "登录失败";
      
      if (message.includes("User already registered") || message.includes("user_already_exists")) {
        message = "该账号已注册，请直接登录";
      } else if (message.includes("Invalid login credentials") || message.includes("invalid_grant") || message.includes("Token has expired")) {
        message = method === 'phone' ? "验证码错误或已过期" : "账号或密码错误";
      } else if (message.includes("Password should be at least")) {
        message = "密码长度需至少 6 位";
      } else if (message.includes("Database error")) {
        message = "服务器繁忙，请稍后再试";
      } else if (message.includes("Rate limit exceeded")) {
        message = "请求过于频繁，请稍后再试";
      } else if (message.includes("Email not found")) {
        message = "该账号未注册";
      } else if (message.includes("Signups not allowed for this")) {
         message = "该方式注册暂未开放";
      }

      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setErrorMsg('');
      setSuccessMsg('');
      setOtpHint('');
      if (authMode === 'login') setAuthMode('register');
      else setAuthMode('login');
  };

  const goToForgot = () => {
      setErrorMsg('');
      setSuccessMsg('');
      setAuthMode('forgot_password');
  };

  const backToLogin = () => {
      setErrorMsg('');
      setSuccessMsg('');
      setAuthMode('login');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center p-4" style={{backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '30px 30px'}}>
      <div className="bg-white p-10 rounded-xl shadow-xl max-w-md w-full border border-stone-200 relative overflow-hidden animate-fade-in">
        <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none select-none">
           <span className="text-[12rem] font-calligraphy">墨</span>
        </div>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            {authMode === 'forgot_password' || authMode === 'update_password' ? <KeyRound size={32} /> : <Feather size={32} />}
          </div>
          <h1 className="text-4xl font-calligraphy text-stone-900 mb-2">墨客文心</h1>
          <p className="text-stone-500 font-serif tracking-widest uppercase text-xs">Ink & Mind</p>
          
          <div className="absolute top-4 right-4 text-[10px] text-stone-300 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity cursor-help" title={dataService.isCloudMode ? '当前为云端同步模式' : '当前为本地单机模式'}>
             {dataService.isCloudMode ? <Cloud size={10} /> : <HardDrive size={10} />}
             {dataService.isCloudMode ? 'CLOUD' : 'LOCAL'}
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center gap-2">
               <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-3 rounded text-sm flex items-center gap-2">
               <Mail size={16} /> {successMsg}
            </div>
          )}

          {authMode === 'forgot_password' ? (
             <>
                <div>
                  <label className="block text-sm font-serif font-bold text-stone-700 mb-2">注册邮箱</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-4 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif"
                    placeholder="name@example.com"
                  />
                  <p className="text-xs text-stone-400 mt-2">目前仅支持通过邮箱找回密码。</p>
                </div>
                <button 
                    onClick={handleAuth}
                    disabled={isLoading}
                    className="w-full py-4 bg-stone-900 text-stone-50 rounded-lg hover:bg-stone-800 transition-colors font-serif text-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : '发送重置链接'}
                </button>
                <button 
                    onClick={backToLogin}
                    className="w-full text-center text-stone-500 text-sm hover:text-stone-800 flex items-center justify-center gap-1"
                >
                    <ArrowLeft size={14} /> 返回登录
                </button>
             </>
          ) : authMode === 'update_password' ? (
             <>
                <div className="bg-amber-50 p-4 rounded text-sm text-amber-800 mb-4 font-serif">
                    请设置您的新密码。
                </div>
                <div>
                  <label className="block text-sm font-serif font-bold text-stone-700 mb-2">新密码</label>
                  <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 pr-12 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
                </div>
                <button 
                    onClick={handleAuth}
                    disabled={isLoading}
                    className="w-full py-4 bg-stone-900 text-stone-50 rounded-lg hover:bg-stone-800 transition-colors font-serif text-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : '更新密码'}
                </button>
             </>
          ) : (
            <>
              {dataService.isCloudMode ? (
                <>
                   {/* Method Toggle */}
                   <div className="flex bg-stone-100 p-1 rounded-lg mb-2">
                      <button
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${method === 'email' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}
                        onClick={() => { setMethod('email'); setOtpHint(''); }}
                      >
                        <Mail size={16} /> 邮箱
                      </button>
                      <button
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${method === 'phone' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}
                        onClick={() => setMethod('phone')}
                      >
                        <Smartphone size={16} /> 手机号
                      </button>
                   </div>

                   {authMode === 'register' && (
                     <div>
                       <label className="block text-sm font-serif font-bold text-stone-700 mb-2">尊姓大名</label>
                       <input 
                         type="text" 
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full p-4 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif"
                         placeholder="昵称"
                       />
                     </div>
                   )}
                   
                   {method === 'email' ? (
                       // Email Inputs
                       <>
                           <div>
                              <label className="block text-sm font-serif font-bold text-stone-700 mb-2">电子邮箱</label>
                              <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif"
                                placeholder="name@example.com"
                              />
                           </div>
                           <div>
                              <div className="flex justify-between items-center mb-2">
                                  <label className="block text-sm font-serif font-bold text-stone-700">密码</label>
                                  {authMode === 'login' && (
                                      <button onClick={goToForgot} className="text-xs text-stone-400 hover:text-stone-600 hover:underline">
                                          忘记密码？
                                      </button>
                                  )}
                              </div>
                              <div className="relative">
                                  <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-4 pr-12 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif"
                                    placeholder="••••••••"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                  >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                              </div>
                           </div>
                       </>
                   ) : (
                       // Phone Inputs
                       <>
                           <div>
                              <label className="block text-sm font-serif font-bold text-stone-700 mb-2">手机号码</label>
                              <input 
                                type="tel" 
                                value={phone}
                                onChange={(e) => {
                                    // Restrict input to digits and max 11 chars
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                    setPhone(val);
                                }}
                                className="w-full p-4 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif"
                                placeholder="13800000000"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-serif font-bold text-stone-700 mb-2">验证码</label>
                              <div className="relative">
                                  <input 
                                    type="text" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full p-4 pr-32 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif"
                                    placeholder="6位数字"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={countdown > 0 || !phone}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 text-xs font-bold rounded transition-colors
                                        ${countdown > 0 || !phone ? 'text-stone-400 bg-stone-100 cursor-not-allowed' : 'text-white bg-stone-800 hover:bg-stone-700'}
                                    `}
                                  >
                                    {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                                  </button>
                              </div>
                              
                              {/* Inline OTP Hint */}
                              {otpHint && (
                                <div className="mt-3 p-3 bg-[#fffdf5] border border-stone-200 rounded-lg text-xs text-stone-600 font-serif leading-relaxed flex items-start gap-2 animate-fade-in">
                                    <div className="shrink-0 mt-0.5 text-stone-400">
                                        <CheckCircle size={14} />
                                    </div>
                                    <span className="whitespace-pre-wrap">{otpHint}</span>
                                </div>
                              )}
                           </div>
                       </>
                   )}
                </>
              ) : (
                // Local Mode Inputs
                <>
                  <div>
                    <label className="block text-sm font-serif font-bold text-stone-700 mb-2">尊姓大名</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-4 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif text-lg placeholder-stone-400"
                      placeholder="请输入您的名字"
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-serif font-bold text-stone-700 mb-2">雅号（选填）</label>
                    <input 
                      type="text" 
                      value={styleName}
                      onChange={(e) => setStyleName(e.target.value)}
                      className="w-full p-4 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-none font-serif text-lg placeholder-stone-400"
                      placeholder="如：东坡居士"
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />
                  </div>
                </>
              )}

              <button 
                onClick={handleAuth}
                disabled={isLoading}
                className="w-full py-4 bg-stone-900 text-stone-50 rounded-lg hover:bg-stone-800 transition-colors font-serif text-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? '进入书斋' : '注册并进入')}
              </button>
              
              {dataService.isCloudMode && (
                 <p className="text-center text-sm font-serif">
                   {authMode === 'login' ? '还没有账号？' : '已有账号？'}
                   <button 
                     onClick={toggleMode}
                     className="ml-2 underline text-stone-800 font-bold hover:text-stone-600"
                   >
                     {authMode === 'login' ? '立即注册' : '直接登录'}
                   </button>
                 </p>
              )}
            </>
          )}

          <p className="text-center text-xs text-stone-400 font-serif mt-4">
            习文练字，修身养性
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
