
import React, { useState, useEffect } from 'react';
import { User, CommunityPost } from '../types';
import { dataService } from '../services/dataService';
import { Heart, MessageSquare, Share2, Feather, Send } from 'lucide-react';

interface CommunityProps {
  user?: User;
}

const Community: React.FC<CommunityProps> = ({ user }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await dataService.getCommunityPosts();
    setPosts(data);
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    await dataService.toggleLike(user.id, postId);
    // Optimistic update
    setPosts(posts.map(p => {
        if (p.id === postId) {
            const hasLiked = p.likedBy.includes(user.id);
            return {
                ...p,
                likes: hasLiked ? p.likes - 1 : p.likes + 1,
                likedBy: hasLiked ? p.likedBy.filter(id => id !== user.id) : [...p.likedBy, user.id]
            };
        }
        return p;
    }));
  };

  const toggleComments = (postId: string) => {
      if (expandedPostId === postId) {
          setExpandedPostId(null);
      } else {
          setExpandedPostId(postId);
          setCommentInput('');
      }
  };

  const handleSendComment = async (postId: string) => {
      if (!user || !commentInput.trim()) return;
      setSubmittingComment(true);
      
      const newComment = await dataService.addComment(user.id, postId, commentInput, user.name);
      
      if (newComment) {
          setPosts(posts.map(p => {
              if (p.id === postId) {
                  return {
                      ...p,
                      comments: [...(p.comments || []), newComment]
                  };
              }
              return p;
          }));
          setCommentInput('');
      }
      setSubmittingComment(false);
  };

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto animate-fade-in">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-800 rounded-full text-white mb-4 shadow-lg">
            <Feather size={32} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">文友圈 · 佳作共赏</h2>
        <p className="text-stone-500">奇文共欣赏，疑义相与析。</p>
      </header>

      {loading ? (
         <div className="text-center py-20 text-stone-400">加载中...</div>
      ) : (
         <div className="space-y-8">
           {posts.map(post => {
             const isLiked = user && post.likedBy.includes(user.id);
             const isCommentsExpanded = expandedPostId === post.id;
             
             return (
               <div key={post.id} className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                 {/* Header */}
                 <div className="flex items-center gap-3 mb-6">
                   <div className={`w-10 h-10 rounded-full ${post.authorAvatar} flex items-center justify-center text-white font-bold text-sm`}>
                      {post.authorName[0]}
                   </div>
                   <div>
                      <h3 className="font-bold text-stone-900 font-serif">{post.authorName}</h3>
                      <p className="text-xs text-stone-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                   </div>
                 </div>

                 {/* Content */}
                 <div className="bg-[#fdfbf7] p-6 rounded-lg border border-stone-100 font-serif text-lg leading-loose text-stone-800 whitespace-pre-wrap mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-5 pointer-events-none">
                       <svg viewBox="0 0 100 100" className="fill-stone-900"><circle cx="50" cy="50" r="40"/></svg>
                    </div>
                    {post.content}
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-6 border-t border-stone-100 pt-4 mb-2">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 text-sm font-bold transition-colors ${isLiked ? 'text-red-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      <Heart size={18} className={isLiked ? 'fill-current' : ''} /> 
                      {post.likes} 加印
                    </button>
                    <button 
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-2 text-sm font-bold transition-colors ${isCommentsExpanded ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      <MessageSquare size={18} /> {post.comments?.length || 0} 批注
                    </button>
                    <button className="flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors ml-auto">
                      <Share2 size={18} /> 
                    </button>
                 </div>

                 {/* Comments Section */}
                 {isCommentsExpanded && (
                     <div className="bg-stone-50 rounded-lg p-4 mt-4 animate-fade-in">
                         {/* Comment List */}
                         <div className="space-y-4 mb-4">
                             {(!post.comments || post.comments.length === 0) && (
                                 <p className="text-center text-stone-400 text-xs italic py-2">暂无批注，快来抢占沙发</p>
                             )}
                             {post.comments?.map(comment => (
                                 <div key={comment.id} className="flex gap-3 text-sm border-b border-stone-100 pb-2 last:border-0">
                                     <span className="font-bold text-stone-700 font-serif whitespace-nowrap">{comment.authorName}:</span>
                                     <span className="text-stone-600 leading-relaxed">{comment.content}</span>
                                 </div>
                             ))}
                         </div>
                         
                         {/* Comment Input */}
                         {user && (
                            <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  placeholder="添加你的批注..."
                                  className="flex-1 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-400 font-serif"
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                                />
                                <button 
                                  onClick={() => handleSendComment(post.id)}
                                  disabled={!commentInput.trim() || submittingComment}
                                  className="bg-stone-800 text-white p-2 rounded hover:bg-stone-700 disabled:opacity-50"
                                >
                                  <Send size={16} />
                                </button>
                            </div>
                         )}
                     </div>
                 )}
               </div>
             );
           })}
         </div>
      )}
    </div>
  );
};

export default Community;
