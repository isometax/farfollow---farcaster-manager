
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { farcasterService } from './services/farcasterService';
import { geminiService } from './services/geminiService';
import { FarcasterUser, AIInsight } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import sdk from '@farcaster/frame-sdk';

// --- Sub-components ---

const Header: React.FC<{ isFrame?: boolean }> = ({ isFrame }) => (
  <header className={`${isFrame ? 'py-4' : 'py-6'} farcaster-purple text-white px-4 shadow-lg mb-6`}>
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-user-minus text-xl md:text-2xl"></i>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">FarFollow</h1>
      </div>
      {!isFrame && (
        <div className="hidden md:block text-sm opacity-80">
          Clean up your Farcaster social graph with AI
        </div>
      )}
    </div>
  </header>
);

const UserStats: React.FC<{ user: FarcasterUser; following: FarcasterUser[]; unfollowers: FarcasterUser[] }> = ({ user, following, unfollowers }) => {
  const data = [
    { name: 'Follow Back', value: following.length - unfollowers.length, color: '#10b981' },
    { name: 'Non-Reciprocal', value: unfollowers.length, color: '#f43f5e' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="glass p-5 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500 flex-shrink-0">
          <img src={user.pfpUrl} alt={user.username} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base truncate">@{user.username}</h3>
          <p className="text-gray-500 text-xs">FID: {user.fid}</p>
        </div>
      </div>
      
      <div className="glass p-5 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-center">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm font-medium">Following</span>
          <span className="text-xl font-bold farcaster-text">{user.followingCount}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div className="farcaster-purple h-1.5 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      <div className="glass p-5 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-4">
        <div className="h-16 w-16 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={18} outerRadius={28} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 text-sm">Follow Graph</h4>
          <p className="text-xs text-rose-500 font-bold">{unfollowers.length} Unfollowers</p>
        </div>
      </div>
    </div>
  );
};

const UserCard: React.FC<{ 
  user: FarcasterUser; 
  insight?: AIInsight; 
  onUnfollow: (fid: number) => void 
}> = ({ user, insight, onUnfollow }) => {
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  const handleUnfollow = () => {
    setIsUnfollowing(true);
    setTimeout(() => {
      onUnfollow(user.fid);
      setIsUnfollowing(false);
    }, 800);
  };

  const badgeColor = insight?.recommendation === 'keep' ? 'bg-green-100 text-green-700' : 
                     insight?.recommendation === 'unfollow' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
      <div className="flex items-start gap-3 mb-3">
        <img src={user.pfpUrl} alt={user.username} className="w-12 h-12 rounded-full border border-purple-50) flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate text-sm">@{user.username}</h4>
          <p className="text-[10px] text-gray-400">{user.followerCount} followers</p>
          {insight && (
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${badgeColor}`}>
              AI: {insight.recommendation}
            </span>
          )}
        </div>
        <button 
          onClick={handleUnfollow}
          disabled={isUnfollowing}
          className="flex-shrink-0 w-9 h-9 rounded-full border border-rose-100 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          {isUnfollowing ? <i className="fa-solid fa-spinner fa-spin text-sm"></i> : <i className="fa-solid fa-user-xmark text-sm"></i>}
        </button>
      </div>
      
      <p className="text-xs text-gray-600 line-clamp-2 mb-3 italic flex-1">
        "{user.bio}"
      </p>

      {insight && (
        <div className="mt-auto p-2.5 bg-purple-50 rounded-xl text-[10px] text-purple-800 border border-purple-100">
          <p className="font-bold mb-1">AI Insight:</p>
          <p className="leading-tight opacity-90">{insight.reason}</p>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [username, setUsername] = useState('');
  const [targetUser, setTargetUser] = useState<FarcasterUser | null>(null);
  const [following, setFollowing] = useState<FarcasterUser[]>([]);
  const [unfollowers, setUnfollowers] = useState<FarcasterUser[]>([]);
  const [insights, setInsights] = useState<Record<string, AIInsight>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFrame, setIsFrame] = useState(false);

  // Initialize Farcaster SDK
  useEffect(() => {
    const initFrame = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setIsFrame(true);
          // Auto-fetch for the current user in Frame
          fetchUserGraph(context.user.username || context.user.fid.toString());
        }
        sdk.actions.ready();
      } catch (e) {
        console.log("Not running in a Farcaster Frame context");
      }
    };
    initFrame();
  }, []);

  const fetchUserGraph = async (name: string) => {
    if (!name) return;
    setIsLoading(true);
    setError(null);
    try {
      const user = await farcasterService.fetchUserData(name);
      setTargetUser(user);
      
      const followList = await farcasterService.fetchFollowing(user.fid);
      setFollowing(followList);
      
      const nonReciprocal = followList.filter(u => !u.isFollowingBack);
      setUnfollowers(nonReciprocal);
      setInsights({});
    } catch (err) {
      setError("Farcaster data error. Check username.");
    } finally {
      setIsLoading(false);
    }
  };

  const runAiAnalysis = async () => {
    if (unfollowers.length === 0) return;
    setIsAnalyzing(true);
    try {
      const newInsights = await geminiService.analyzeUnfollowers(unfollowers.slice(0, 10));
      setInsights(newInsights);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUnfollowUser = useCallback((fid: number) => {
    setUnfollowers(prev => prev.filter(u => u.fid !== fid));
    setFollowing(prev => prev.filter(u => u.fid !== fid));
  }, []);

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${isFrame ? 'p-0' : ''}`}>
      <Header isFrame={isFrame} />
      
      <main className="max-w-6xl mx-auto px-4 pb-12 w-full flex-1">
        {/* Search Input - Hidden in Frame if user is already detected */}
        {(!isFrame || !targetUser) && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Farcaster handle..."
                className="w-full px-5 py-3.5 rounded-full bg-white shadow-md border-2 border-transparent focus:border-purple-400 outline-none transition-all text-base pl-12"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUserGraph(username)}
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <button 
                onClick={() => fetchUserGraph(username)}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 farcaster-purple text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Analyze'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {targetUser && (
          <>
            <UserStats user={targetUser} following={following} unfollowers={unfollowers} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Unfollowers</h2>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-tight">Non-reciprocal: {unfollowers.length}</p>
              </div>
              
              <button 
                onClick={runAiAnalysis}
                disabled={isAnalyzing || unfollowers.length === 0}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><i className="fa-solid fa-wand-magic-sparkles fa-spin"></i> Thinking...</>
                ) : (
                  <><i className="fa-solid fa-wand-magic-sparkles"></i> AI Filter</>
                )}
              </button>
            </div>

            {unfollowers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unfollowers.map(user => (
                  <UserCard 
                    key={user.fid} 
                    user={user} 
                    insight={insights[user.username]}
                    onUnfollow={handleUnfollowUser}
                  />
                ))}
              </div>
            ) : !isLoading && (
              <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                <div className="text-4xl mb-3 text-green-400">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-800">All Good!</h3>
                <p className="text-gray-500 text-sm">You have perfect reciprocity.</p>
              </div>
            )}
          </>
        )}

        {!targetUser && !isLoading && (
          <div className="text-center py-16">
            <div className="text-5xl text-purple-200 mb-5">
              <i className="fa-solid fa-users-viewfinder"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-400">Scan Your Social Graph</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2 italic">Identify and manage non-reciprocal follows instantly.</p>
          </div>
        )}
      </main>

      {!isFrame && (
        <footer className="py-8 border-t border-gray-100 text-center text-gray-400 text-[10px] uppercase tracking-widest">
          <p>Powered by Farcaster & Gemini AI</p>
        </footer>
      )}
    </div>
  );
}
