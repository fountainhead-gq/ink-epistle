import { User, UserActivity, DraftSnapshot, ChatMessage, QuizResult, Seal, CommunityPost, Comment, FlyingFlowerGame } from '../types';
import { supabase } from '../lib/supabase';

// Local Storage Keys
const KEYS = {
  CURRENT_USER: 'ink_currentUser',
  ACTIVITY_PREFIX: 'ink_activity_',
  DRAFT_CURRENT: 'ink_draft_current',
  DRAFT_HISTORY: 'ink_draft_history',
  CHAT_PREFIX: 'ink_chat_',
  QUIZ_HISTORY: 'ink_quiz_history',
  BOOTCAMP_PROGRESS: 'ink_bootcamp_progress',
  STORY_PREFIX: 'ink_story_',
  SEALS: 'ink_seals',
  POSTS: 'ink_posts',
  FF_GAMES: 'ink_ff_games',
};

class DataService {
  get isCloudMode(): boolean {
    return !!supabase;
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<User | null> {
    if (this.isCloudMode && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            if (profile) {
                const user = {
                    id: profile.id,
                    name: profile.name,
                    styleName: profile.style_name,
                    avatarColor: profile.avatar_color,
                    joinedDate: profile.joined_date,
                    isPro: profile.is_pro
                };
                localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
                return user;
            }
        }
        return null;
    } else {
        const stored = localStorage.getItem(KEYS.CURRENT_USER);
        if (stored) return JSON.parse(stored);
        return null;
    }
  }

  async loginWithPhone(phone: string, password: string): Promise<User | null> {
      // Keep legacy password login for phone if needed, but primary is OTP now
      if (this.isCloudMode && supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ phone, password });
          if (error) {
              if (error.message.includes("provider") || error.message.includes("disabled")) {
                  throw new Error("手机号登录功能暂未启用，请使用验证码登录");
              }
              throw error;
          }
          if (data.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            if (profile) {
                const user = {
                    id: profile.id,
                    name: profile.name,
                    styleName: profile.style_name,
                    avatarColor: profile.avatar_color,
                    joinedDate: profile.joined_date,
                    isPro: profile.is_pro
                };
                localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
                return user;
            }
          }
      }
      // Local Mode Simulation
      const stored = localStorage.getItem(KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
      throw new Error("本地记录不存在");
  }

  async sendPhoneOtp(phone: string): Promise<string> {
      // Validation: Check if it's a valid 11-digit Chinese phone number
      if (!/^1[3-9]\d{9}$/.test(phone)) {
          throw new Error("手机号码格式不正确");
      }

      // 1. 生成 6 位随机验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expireAt = Date.now() + 15 * 60 * 1000; // 15分钟有效

      // 2. 存储验证码到本地 (用于后续校验)
      localStorage.setItem(`ink_otp_${phone}`, JSON.stringify({ code, expireAt }));

      if (this.isCloudMode) {
          console.log(`[Cloud] Preparing SMS for ${phone}`);
          try {
              // 3. 调用 Spug 推送服务
              const spugUrl = 'https://push.spug.cc/send/zk9qMjwAdZ8BRgQp';
              const params = new URLSearchParams({
                  code: code,
                  name: '墨客文心',
                  targets: phone // Changed from phone to targets
              });

              // Send request (no-cors to avoid browser blocking, though we can't read response)
              fetch(`${spugUrl}?${params.toString()}`, { method: 'GET', mode: 'no-cors' })
                .then(() => console.log("Spug request sent"))
                .catch(e => console.warn("Spug trigger failed", e));
              
                console.log(`%c[开发调试] 手机号 ${phone} 的验证码是: ${code}`, "color: #10b981; font-weight: bold; font-size: 12px;");
              // Return friendly message
              return `验证码已发往 ${phone}，请留意手机短信。`;

          } catch (e) {
              console.warn("SMS Send Warning:", e);
              return `网络连接微恙，请使用测试码：${code}`;
          }
      } else {
          // 本地模式
          console.log(`[Local] OTP for ${phone}: ${code}`);
          return `[本地模式] 模拟发送验证码: ${code}`;
      }
  }

  async verifyPhoneOtp(phone: string, token: string, extra?: any): Promise<User | null> {
      // 1. 优先校验本地生成的验证码 (Spug Flow)
      const record = localStorage.getItem(`ink_otp_${phone}`);
      
      if (record) {
          const { code, expireAt } = JSON.parse(record);
          
          if (Date.now() > expireAt) {
              localStorage.removeItem(`ink_otp_${phone}`);
              throw new Error("验证码已过期，请重新获取");
          }
          
          if (code !== token && token !== '123456') { // 保留 123456 作为测试后门
              throw new Error("验证码错误");
          }
          
          // 验证通过，清除缓存
          localStorage.removeItem(`ink_otp_${phone}`);

          // 2. 获取或创建用户
          let user: User | null = null;

          if (this.isCloudMode && supabase) {
              try {
                  // 尝试查找现有用户档案
                  const { data: existingProfile } = await supabase.from('profiles').select('*').eq('phone', phone).single();
                  
                  if (existingProfile) {
                      user = {
                          id: existingProfile.id,
                          name: existingProfile.name,
                          styleName: existingProfile.style_name,
                          avatarColor: existingProfile.avatar_color,
                          joinedDate: existingProfile.joined_date,
                          isPro: existingProfile.is_pro
                      };
                  } else {
                      // 新用户，尝试创建档案
                      const newId = `u_${phone}_${Date.now()}`;
                      const newProfile = {
                          id: newId,
                          phone: phone,
                          name: extra?.name || `墨客${phone.slice(-4)}`,
                          style_name: extra?.styleName || '新晋学士',
                          avatar_color: extra?.avatarColor || 'bg-stone-700',
                          is_pro: false,
                          joined_date: new Date().toISOString()
                      };
                      
                      const { error } = await supabase.from('profiles').insert(newProfile);
                      if (!error) {
                          user = {
                              id: newId,
                              name: newProfile.name,
                              styleName: newProfile.style_name,
                              avatarColor: newProfile.avatar_color,
                              joinedDate: newProfile.joined_date,
                              isPro: false
                          };
                      } else {
                          console.warn("Cloud profile creation restricted (RLS):", error.message);
                      }
                  }
              } catch (e) {
                  console.error("Cloud user sync failed", e);
              }
          }

          // 如果云端获取失败（或处于本地模式），构建本地用户对象
          if (!user) {
              user = {
                  id: 'spug_user_' + phone,
                  name: extra?.name || `墨客${phone.slice(-4)}`,
                  styleName: extra?.styleName || '白衣秀士',
                  avatarColor: 'bg-stone-700',
                  joinedDate: new Date().toISOString(),
                  isPro: false
              };
          }
          
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
          return user;
      }

      // 如果本地没有记录，且使用了云端模式，尝试调用 Supabase 原生验证（兼容旧逻辑/Legacy）
      if (this.isCloudMode && supabase) {
          const { data, error } = await supabase.auth.verifyOtp({
              phone,
              token,
              type: 'sms'
          });
          
          if (error) {
              // 再次检查万能码
              if (token === '123456') {
                  // Fallback for testing
              } else {
                  throw error;
              }
          }
          
          if (data?.user) {
              let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
              if (!profile) {
                  const newProfile = {
                      id: data.user.id,
                      phone: phone,
                      name: extra?.name || `墨客${phone.slice(-4)}`,
                      style_name: extra?.styleName || '新晋学士',
                      avatar_color: extra?.avatarColor || 'bg-stone-700',
                      is_pro: false
                  };
                  await supabase.from('profiles').insert(newProfile);
                  profile = newProfile;
              }
              const user = {
                  id: profile.id,
                  name: profile.name,
                  styleName: profile.style_name,
                  avatarColor: profile.avatar_color,
                  joinedDate: profile.joined_date || new Date().toISOString(),
                  isPro: profile.is_pro
              };
              localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
              return user;
          }
      }

      throw new Error("验证码无效或已过期");
  }

  async register(email: string, password: string | undefined, extra: any): Promise<{user: User | null, requireConfirmation: boolean}> {
    if (this.isCloudMode && supabase && password) {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    display_name: extra.name,
                    avatar_color: extra.avatarColor
                }
            }
        });
        if (error) throw error;
        
        const requireConfirmation = !!(data.user && !data.session);

        if (data.user) {
            const newProfile = {
                id: data.user.id,
                email: email,
                name: extra.name,
                style_name: extra.styleName,
                avatar_color: extra.avatarColor,
                is_pro: false
            };
            
            const { error: profileError } = await supabase.from('profiles').insert(newProfile);
            if (profileError && !requireConfirmation && !profileError.message.includes('duplicate')) {
                 console.error("Profile creation error", profileError);
            }

            const user = {
                id: newProfile.id,
                name: newProfile.name,
                styleName: newProfile.style_name,
                avatarColor: newProfile.avatar_color,
                joinedDate: new Date().toISOString(),
                isPro: false
            };
            
            if (!requireConfirmation) {
                localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
            }
            
            return { user, requireConfirmation };
        }
        return { user: null, requireConfirmation: false };
    } else {
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(extra));
        return { user: extra, requireConfirmation: false };
    }
  }
  
  async registerWithPhone(phone: string, password: string, extra: any): Promise<{user: User | null, requireConfirmation: boolean}> {
      return this.register(phone + "@placeholder.com", password, extra);
  }

  async resetPassword(email: string): Promise<void> {
      if (this.isCloudMode && supabase) {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin, 
          });
          if (error) throw error;
      } else {
          throw new Error("本地模式不支持重置密码");
      }
  }

  async updateUserPassword(password: string): Promise<void> {
      if (this.isCloudMode && supabase) {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
      }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
      if (this.isCloudMode && supabase) {
          return supabase.auth.onAuthStateChange(callback);
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
  }

  async logout(): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.auth.signOut();
    }
    localStorage.removeItem(KEYS.CURRENT_USER);
  }

  // --- Profile & Stats ---
  async getUserStats(userId: string): Promise<{ minutes: number, words: number, days: number }> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('user_activity').select('*').eq('user_id', userId);
        if (data) {
            const minutes = data.reduce((acc, curr) => acc + (curr.minutes || 0), 0);
            const words = data.reduce((acc, curr) => acc + (curr.words_written || 0), 0);
            return { minutes, words, days: data.length };
        }
        return { minutes: 0, words: 0, days: 0 };
    } else {
        const history = await this.getRecentActivity(userId, 365);
        const minutes = history.reduce((acc, curr) => acc + curr.minutes, 0);
        const words = history.reduce((acc, curr) => acc + curr.wordsWritten, 0);
        return { minutes, words, days: history.length };
    }
  }

  async getRecentActivity(userId: string, days: number): Promise<UserActivity[]> {
    const today = new Date();
    const result: UserActivity[] = [];

    if (this.isCloudMode && supabase) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const { data } = await supabase.from('user_activity')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });
        
        const dbMap = new Map();
        data?.forEach(d => dbMap.set(d.date, {
            date: d.date, minutes: d.minutes, wordsWritten: d.words_written, 
            lettersSent: d.letters_sent, loginCount: d.login_count, aiCalls: d.ai_calls
        }));

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (dbMap.has(dateStr)) {
                result.push(dbMap.get(dateStr));
            } else if (i === 0) {
                result.push({ date: dateStr, minutes: 0, wordsWritten: 0, lettersSent: 0, loginCount: 1, aiCalls: 0 });
            }
        }
        return result.reverse();
    } else {
        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const key = `${KEYS.ACTIVITY_PREFIX}${userId}_${dateStr}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                result.push(JSON.parse(stored));
            } else if (i === 0) {
                result.push({ date: dateStr, minutes: 0, wordsWritten: 0, lettersSent: 0, loginCount: 1, aiCalls: 0 });
            }
        }
        return result.reverse();
    }
  }

  async updateActivity(userId: string, partial: Partial<UserActivity>): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('user_activity').select('*').eq('user_id', userId).eq('date', todayStr).single();
        const current = data || { minutes: 0, words_written: 0, letters_sent: 0, login_count: 0, ai_calls: 0 };
        
        const updatePayload = {
            user_id: userId,
            date: todayStr,
            minutes: partial.minutes !== undefined ? partial.minutes : current.minutes,
            words_written: partial.wordsWritten !== undefined ? partial.wordsWritten : current.words_written,
            letters_sent: partial.lettersSent !== undefined ? partial.lettersSent : current.letters_sent,
            login_count: partial.loginCount !== undefined ? partial.loginCount : current.login_count,
            ai_calls: partial.aiCalls !== undefined ? partial.aiCalls : current.ai_calls
        };
        
        await supabase.from('user_activity').upsert(updatePayload, { onConflict: 'user_id,date' });
    } else {
        const key = `${KEYS.ACTIVITY_PREFIX}${userId}_${todayStr}`;
        const stored = localStorage.getItem(key);
        let current = stored 
        ? JSON.parse(stored) 
        : { date: todayStr, minutes: 0, wordsWritten: 0, lettersSent: 0, loginCount: 1, aiCalls: 0 };
        
        current = { ...current, ...partial };
        localStorage.setItem(key, JSON.stringify(current));
    }
  }

  async getReferralCode(userId: string): Promise<string> {
    return `INK-${userId.substring(0, 4).toUpperCase()}-2024`;
  }

  async redeemLicenseKey(userId: string, key: string): Promise<{ success: boolean, message: string }> {
    const upperKey = key.trim().toUpperCase();
    let duration = '';
    
    if (upperKey.startsWith('INK-M-')) duration = '月度';
    else if (upperKey.startsWith('INK-Q-')) duration = '季度';
    else if (upperKey.startsWith('INK-Y-')) duration = '年度';
    else if (upperKey === 'INK-VIP-TEST') duration = '体验';
    else return { success: false, message: "无效的兑换码" };

    await this.upgradeUser(userId);
    return { success: true, message: `兑换成功！${duration}会员权益已激活。` };
  }

  async redeemReferral(_userId: string, _code: string): Promise<{ success: boolean, message: string }> {
    return { success: true, message: "兑换成功！会员权益已延长。" };
  }

  async checkDailyQuota(userId: string): Promise<boolean> {
    const user = JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || '{}');
    const LIMIT = user.isPro ? 200 : 10;

    const todayStr = new Date().toISOString().split('T')[0];
    
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('user_activity').select('ai_calls').eq('user_id', userId).eq('date', todayStr).single();
        return (data?.ai_calls || 0) < LIMIT;
    } else {
        const key = `${KEYS.ACTIVITY_PREFIX}${userId}_${todayStr}`;
        const stored = localStorage.getItem(key);
        if (!stored) return true;
        const activity = JSON.parse(stored);
        return (activity.aiCalls || 0) < LIMIT;
    }
  }

  async incrementAiUsage(userId: string): Promise<void> {
     const todayStr = new Date().toISOString().split('T')[0];
     if (this.isCloudMode && supabase) {
         const { data } = await supabase.from('user_activity').select('ai_calls').eq('user_id', userId).eq('date', todayStr).single();
         const currentCalls = data?.ai_calls || 0;
         await this.updateActivity(userId, { aiCalls: currentCalls + 1 });
     } else {
         const key = `${KEYS.ACTIVITY_PREFIX}${userId}_${todayStr}`;
         const stored = localStorage.getItem(key);
         const current = stored ? JSON.parse(stored) : { aiCalls: 0 };
         await this.updateActivity(userId, { aiCalls: (current.aiCalls || 0) + 1 });
     }
  }

  async upgradeUser(userId: string): Promise<User | null> {
      const userStr = localStorage.getItem(KEYS.CURRENT_USER);
      if(!userStr) return null;
      const user = JSON.parse(userStr);
      user.isPro = true;
      
      if (this.isCloudMode && supabase) {
          await supabase.from('profiles').update({ is_pro: true }).eq('id', userId);
      }
      
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
  }

  async getCurrentDraft(userId: string): Promise<string> {
    return localStorage.getItem(`${KEYS.DRAFT_CURRENT}_${userId}`) || '';
  }

  async saveCurrentDraft(userId: string, content: string): Promise<void> {
    localStorage.setItem(`${KEYS.DRAFT_CURRENT}_${userId}`, content);
  }

  async getDraftHistory(userId: string): Promise<DraftSnapshot[]> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('draft_snapshots').select('*').eq('user_id', userId).order('created_at', {ascending: false});
        return data?.map(d => ({ id: d.id, content: d.content, summary: d.summary, timestamp: d.created_at })) || [];
    }
    const key = `${KEYS.DRAFT_HISTORY}_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async saveDraftSnapshot(userId: string, content: string): Promise<void> {
    const summary = content.substring(0, 50) + '...';
    
    if (this.isCloudMode && supabase) {
        await supabase.from('draft_snapshots').insert({
            user_id: userId,
            content,
            summary
        });
    } else {
        const key = `${KEYS.DRAFT_HISTORY}_${userId}`;
        const history: DraftSnapshot[] = JSON.parse(localStorage.getItem(key) || '[]');
        const newSnapshot: DraftSnapshot = {
            id: Date.now().toString(),
            content,
            timestamp: new Date().toISOString(),
            summary
        };
        localStorage.setItem(key, JSON.stringify([newSnapshot, ...history]));
    }
  }

  async getChatHistory(userId: string, characterId: string): Promise<ChatMessage[]> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('chat_histories').select('messages').eq('user_id', userId).eq('target_id', characterId).single();
        return data?.messages || [];
    }
    const key = `${KEYS.CHAT_PREFIX}${userId}_${characterId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async saveChatHistory(userId: string, characterId: string, messages: ChatMessage[]): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.from('chat_histories').upsert({
            user_id: userId,
            target_id: characterId,
            messages: messages
        }, { onConflict: 'user_id,target_id' });
    } else {
        const key = `${KEYS.CHAT_PREFIX}${userId}_${characterId}`;
        localStorage.setItem(key, JSON.stringify(messages));
    }
  }

  async getQuizHistory(userId: string): Promise<QuizResult[]> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('quiz_history').select('*').eq('user_id', userId);
        return data?.map(d => ({ questionId: d.question_id, isCorrect: d.is_correct, timestamp: d.timestamp, tags: d.tags })) || [];
    }
    const key = `${KEYS.QUIZ_HISTORY}_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async saveQuizResult(userId: string, result: QuizResult): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.from('quiz_history').insert({
            user_id: userId,
            question_id: result.questionId,
            is_correct: result.isCorrect,
            tags: result.tags
        });
    } else {
        const key = `${KEYS.QUIZ_HISTORY}_${userId}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([...history, result]));
    }
  }

  async getBootcampProgress(userId: string): Promise<any> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('bootcamp_progress').select('*').eq('user_id', userId).single();
        if (data) return { completedDays: data.completed_days, submissions: data.submissions };
        return { completedDays: [], submissions: {} };
    }
    const key = `${KEYS.BOOTCAMP_PROGRESS}_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '{"completedDays":[], "submissions":{}}');
  }

  async saveBootcampProgress(userId: string, progress: any): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.from('bootcamp_progress').upsert({
            user_id: userId,
            completed_days: progress.completedDays,
            submissions: progress.submissions
        });
    } else {
        const key = `${KEYS.BOOTCAMP_PROGRESS}_${userId}`;
        localStorage.setItem(key, JSON.stringify(progress));
    }
  }

  async getStoryProgress(userId: string, scenarioId: string): Promise<any[]> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('story_progress').select('history').eq('user_id', userId).eq('scenario_id', scenarioId).single();
        return data?.history || [];
    }
    const key = `${KEYS.STORY_PREFIX}${userId}_${scenarioId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async saveStoryProgress(userId: string, scenarioId: string, history: any[]): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.from('story_progress').upsert({
            user_id: userId,
            scenario_id: scenarioId,
            history: history
        }, { onConflict: 'user_id,scenario_id' });
    } else {
        const key = `${KEYS.STORY_PREFIX}${userId}_${scenarioId}`;
        localStorage.setItem(key, JSON.stringify(history));
    }
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('community_posts').select(`*, comments:community_comments(*)`).order('created_at', { ascending: false });
        if (data) {
            return data.map(p => ({
                id: p.id,
                userId: p.user_id,
                authorName: p.author_name,
                authorAvatar: p.author_avatar,
                content: p.content,
                likes: p.likes,
                likedBy: p.liked_by || [],
                createdAt: p.created_at,
                comments: p.comments?.map((c:any) => ({
                    id: c.id, postId: c.post_id, userId: c.user_id, authorName: c.author_name, content: c.content, createdAt: c.created_at
                })) || []
            }));
        }
        return [];
    } else {
        const posts = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
        if (posts.length === 0) {
            const seed: CommunityPost[] = [{
                id: 'p1', userId: 'u1', authorName: '东坡门下走狗', authorAvatar: 'bg-amber-700',
                content: '今日初试文言尺牍，仿苏子瞻语，写罢觉胸中浩然之气顿生。文言之美，在乎韵律，亦在乎情致。',
                likes: 12, likedBy: [], comments: [], createdAt: new Date(Date.now() - 86400000).toISOString()
            }];
            localStorage.setItem(KEYS.POSTS, JSON.stringify(seed));
            return seed;
        }
        return posts;
    }
  }

  async toggleLike(userId: string, postId: string): Promise<void> {
      if (this.isCloudMode && supabase) {
          const { data } = await supabase.from('community_posts').select('likes, liked_by').eq('id', postId).single();
          if (data) {
              const hasLiked = data.liked_by?.includes(userId);
              const newLikes = hasLiked ? data.likes - 1 : data.likes + 1;
              const newLikedBy = hasLiked ? data.liked_by.filter((id:string) => id !== userId) : [...(data.liked_by || []), userId];
              await supabase.from('community_posts').update({ likes: newLikes, liked_by: newLikedBy }).eq('id', postId);
          }
      } else {
          const posts: CommunityPost[] = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
          const updated = posts.map(p => {
              if (p.id === postId) {
                  const hasLiked = p.likedBy.includes(userId);
                  return {
                      ...p,
                      likes: hasLiked ? p.likes - 1 : p.likes + 1,
                      likedBy: hasLiked ? p.likedBy.filter(id => id !== userId) : [...p.likedBy, userId]
                  };
              }
              return p;
          });
          localStorage.setItem(KEYS.POSTS, JSON.stringify(updated));
      }
  }

  async addComment(userId: string, postId: string, content: string, authorName: string): Promise<Comment | null> {
      if (this.isCloudMode && supabase) {
          const { data } = await supabase.from('community_comments').insert({
              post_id: postId, user_id: userId, author_name: authorName, content
          }).select().single();
          
          if (data) return { id: data.id, postId, userId, authorName, content, createdAt: data.created_at };
          return null;
      } else {
          const posts: CommunityPost[] = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
          let newComment: Comment | null = null;
          const updated = posts.map(p => {
              if (p.id === postId) {
                  newComment = { id: Date.now().toString(), postId, userId, authorName, content, createdAt: new Date().toISOString() };
                  return { ...p, comments: [...(p.comments || []), newComment] };
              }
              return p;
          });
          localStorage.setItem(KEYS.POSTS, JSON.stringify(updated));
          return newComment;
      }
  }

  async createPost(userId: string, content: string, authorInfo: {name: string, avatar: string}): Promise<boolean> {
      if (this.isCloudMode && supabase) {
          const { error } = await supabase.from('community_posts').insert({
              user_id: userId, author_name: authorInfo.name, author_avatar: authorInfo.avatar, content
          });
          return !error;
      } else {
          const posts: CommunityPost[] = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
          const newPost: CommunityPost = {
              id: Date.now().toString(), userId, authorName: authorInfo.name, authorAvatar: authorInfo.avatar,
              content, likes: 0, likedBy: [], comments: [], createdAt: new Date().toISOString()
          };
          localStorage.setItem(KEYS.POSTS, JSON.stringify([newPost, ...posts]));
          return true;
      }
  }

  async getSeals(userId: string): Promise<Seal[]> {
    if (this.isCloudMode && supabase) {
        const { data } = await supabase.from('user_seals').select('*').eq('user_id', userId);
        return data?.map(s => ({ 
            id: s.id, text: s.text, style: s.style, shape: s.shape, font: s.font, wearLevel: s.wear_level, createdAt: s.created_at 
        })) || [];
    }
    const key = `${KEYS.SEALS}_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async saveSeal(userId: string, seal: Seal): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.from('user_seals').insert({
            user_id: userId, text: seal.text, style: seal.style, shape: seal.shape, font: seal.font, wear_level: seal.wearLevel
        });
    } else {
        const key = `${KEYS.SEALS}_${userId}`;
        const seals = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([...seals, seal]));
    }
  }

  async deleteSeal(userId: string, sealId: string): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.from('user_seals').delete().eq('id', sealId);
    } else {
        const key = `${KEYS.SEALS}_${userId}`;
        const seals = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(seals.filter((s: Seal) => s.id !== sealId)));
    }
  }
  
  async getFavorites(userId: string): Promise<number[]> {
      if (this.isCloudMode && supabase) {
          const { data } = await supabase.from('user_favorites').select('phrase_id').eq('user_id', userId);
          return data?.map(f => f.phrase_id) || [];
      }
      const key = `ink_favs_${userId}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
  }
  
  async saveFavorites(userId: string, favs: number[]): Promise<void> {
      if (this.isCloudMode && supabase) {
          await supabase.from('user_favorites').delete().eq('user_id', userId);
          if (favs.length > 0) {
              await supabase.from('user_favorites').insert(favs.map(fid => ({ user_id: userId, phrase_id: fid })));
          }
      } else {
          const key = `ink_favs_${userId}`;
          localStorage.setItem(key, JSON.stringify(favs));
      }
  }

  async saveFlyingFlowerGame(userId: string, game: FlyingFlowerGame): Promise<void> {
    if (this.isCloudMode && supabase) {
        await supabase.from('flying_flower_games').insert({
            user_id: userId, keyword: game.keyword, score: game.score, turns: game.turns
        });
    } else {
        const key = `${KEYS.FF_GAMES}_${userId}`;
        const history: FlyingFlowerGame[] = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([game, ...history]));
    }
  }

  async getFlyingFlowerHighscore(userId: string): Promise<number> {
      if (this.isCloudMode && supabase) {
          const { data } = await supabase.from('flying_flower_games').select('score').eq('user_id', userId).order('score', { ascending: false }).limit(1).single();
          return data?.score || 0;
      }
      return parseInt(localStorage.getItem(`u_${userId}_ff_highscore`) || '0');
  }

  async exportUserData(userId: string): Promise<string> {
    const data: any = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(userId) || key === KEYS.CURRENT_USER)) {
            data[key] = localStorage.getItem(key);
        }
    }
    return JSON.stringify(data);
  }

  async importUserData(jsonString: string): Promise<boolean> {
    try {
        const data = JSON.parse(jsonString);
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (typeof value === 'string') {
              localStorage.setItem(key, value);
            }
        });
        return true;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
  }
}

export const dataService = new DataService();