
export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  isFollowingBack: boolean;
}

export interface AIInsight {
  analysis: string;
  recommendation: 'keep' | 'unfollow' | 'maybe';
  reason: string;
}

export interface AppState {
  currentUser: FarcasterUser | null;
  following: FarcasterUser[];
  unfollowers: FarcasterUser[];
  isLoading: boolean;
  error: string | null;
}
