
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_type: 'free' | 'premium';
  subscription_expires_at?: string;
  scripts_generated_today: number;
  scripts_generated_total: number;
  last_generation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  user_id: string;
  title: string;
  content: string;
  genre: string;
  age_range: string;
  theme: string;
  custom_idea?: string;
  status: 'draft' | 'published' | 'archived';
  word_count?: number;
  is_public: boolean;
  allow_social_sharing: boolean;
  view_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface PublicScript extends Script {
  author_name: string;
  author_avatar?: string;
}

export interface ScriptLike {
  id: string;
  user_id: string;
  script_id: string;
  created_at: string;
}

export interface CreatorPoint {
  id: string;
  user_id: string;
  total_points: number;
  points_this_month: number;
  complete_reads: number;
  comments_received: number;
  likes_received: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReward {
  id: string;
  user_id: string;
  month_year: string;
  rank: number;
  total_points: number;
  badge_earned: string;
  reward_type: string;
  reward_value?: string;
  created_at: string;
}

export interface FinancialReward {
  id: string;
  user_id: string;
  month_year: string;
  rank: number;
  reward_amount: number;
  premium_subscribers_count: number;
  base_amount: number;
  subscriber_bonus: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

export interface PlagiarismCheck {
  id: string;
  script_id: string;
  user_id: string;
  is_original: boolean;
  similarity_score: number;
  similar_scripts: any[];
  checked_at: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_title: string;
  badge_description?: string;
  earned_at: string;
  month_year?: string;
}

export interface Series {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  genre?: string;
  art_style?: string;
  is_public: boolean;
  episode_count: number;
  status: 'draft' | 'ongoing' | 'completed';
  view_count: number;
  like_count: number;
  follow_count: number;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  series_id: string;
  episode_number: number;
  title?: string;
  script_content?: string;
  comic_panels?: any;
  duration?: number;
  status: 'draft' | 'published';
  view_count: number;
  like_count: number;
  created_at: string;
  published_at?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      scripts: {
        Row: Script;
        Insert: Omit<Script, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Script, 'id' | 'created_at' | 'updated_at'>>;
      };
      series: {
        Row: Series;
        Insert: Omit<Series, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Series, 'id' | 'created_at' | 'updated_at'>>;
      };
      episodes: {
        Row: Episode;
        Insert: Omit<Episode, 'id' | 'created_at'>;
        Update: Partial<Omit<Episode, 'id' | 'created_at'>>;
      };
      script_likes: {
        Row: ScriptLike;
        Insert: Omit<ScriptLike, 'id' | 'created_at'>;
        Update: Partial<Omit<ScriptLike, 'id' | 'created_at'>>;
      };
      creator_points: {
        Row: CreatorPoint;
        Insert: Omit<CreatorPoint, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CreatorPoint, 'id' | 'created_at' | 'updated_at'>>;
      };
      monthly_rewards: {
        Row: MonthlyReward;
        Insert: Omit<MonthlyReward, 'id' | 'created_at'>;
        Update: Partial<Omit<MonthlyReward, 'id' | 'created_at'>>;
      };
      financial_rewards: {
        Row: FinancialReward;
        Insert: Omit<FinancialReward, 'id' | 'created_at'>;
        Update: Partial<Omit<FinancialReward, 'id' | 'created_at'>>;
      };
      plagiarism_checks: {
        Row: PlagiarismCheck;
        Insert: Omit<PlagiarismCheck, 'id' | 'created_at'>;
        Update: Partial<Omit<PlagiarismCheck, 'id' | 'created_at'>>;
      };
      user_badges: {
        Row: UserBadge;
        Insert: Omit<UserBadge, 'id' | 'earned_at'>;
        Update: Partial<Omit<UserBadge, 'id' | 'earned_at'>>;
      };
    };
    Views: {
      public_scripts: {
        Row: PublicScript;
      };
      creator_leaderboard: {
        Row: {
          user_id: string;
          full_name: string;
          avatar_url?: string;
          total_points: number;
          complete_reads: number;
          comments_received: number;
          likes_received: number;
          scripts_published: number;
          original_scripts: number;
          subscription_type: 'free' | 'premium';
          eligible_for_rewards: boolean;
          rank: number;
          last_calculated_at: string;
        };
      };
    };
  };
}
