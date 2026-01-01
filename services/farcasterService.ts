
import { FarcasterUser } from '../types';

// This simulates a Farcaster API (like Neynar)
export const farcasterService = {
  async fetchUserData(username: string): Promise<FarcasterUser> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      fid: Math.floor(Math.random() * 10000),
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      pfpUrl: `https://picsum.photos/seed/${username}/200`,
      bio: "Farcaster enthusiast exploring the decentralized web. Building the future of social.",
      followerCount: 1240,
      followingCount: 850,
      isFollowingBack: true
    };
  },

  async fetchFollowing(fid: number): Promise<FarcasterUser[]> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUsers: string[] = [
      'dwr.eth', 'vgr', 'pushix', 'linda', 'jacob', 'vitalik', 'jesse', 'cassie', 
      'ted', 'ben', 'sarah_farcaster', 'degen_king', 'purple_pfp', 'frames_dev',
      'warpcast_fan', 'zk_wizard', 'base_builder', 'optimism_maxi'
    ];

    return mockUsers.map((name, index) => ({
      fid: index + 100,
      username: name,
      displayName: name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      pfpUrl: `https://picsum.photos/seed/${name}/150`,
      bio: `Digital nomad and web3 developer. Excited about ${index % 2 === 0 ? 'Farcaster' : 'Ethereum'}.`,
      followerCount: Math.floor(Math.random() * 5000),
      followingCount: Math.floor(Math.random() * 2000),
      isFollowingBack: Math.random() > 0.4 // 60% don't follow back for the demo
    }));
  }
};
