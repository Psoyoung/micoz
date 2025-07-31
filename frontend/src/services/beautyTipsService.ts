// Beauty Tips Service
// 뷰티 팁 커뮤니티 관리

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface BeautyTip {
  id: string;
  title: string;
  content: string;
  category: BeautyTipCategory;
  tags: string[];
  images: string[];
  skinTypes: SkinType[];
  difficulty: TipDifficulty;
  views: number;
  upvotes: number;
  downvotes: number;
  status: TipStatus;
  featured: boolean;
  createdAt: Date;
  updatedAt?: Date;
  user: {
    name: string;
    avatar?: string;
  };
  voteCount: number;
  commentCount: number;
  followerCount: number;
  comments?: BeautyTipComment[];
}

export interface BeautyTipComment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    name: string;
    avatar?: string;
  };
  replies?: BeautyTipComment[];
}

export type BeautyTipCategory = 
  | 'SKINCARE' 
  | 'MAKEUP' 
  | 'HAIRCARE' 
  | 'NAILCARE' 
  | 'BODYCARE' 
  | 'ROUTINE' 
  | 'PRODUCT_REVIEW' 
  | 'TUTORIAL' 
  | 'LIFESTYLE';

export type SkinType = 'OILY' | 'DRY' | 'COMBINATION' | 'SENSITIVE' | 'NORMAL';

export type TipDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type TipStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'FEATURED';

export interface CreateBeautyTipRequest {
  title: string;
  content: string;
  category: BeautyTipCategory;
  tags?: string[];
  images?: string[];
  skinTypes?: SkinType[];
  difficulty?: TipDifficulty;
}

export interface UpdateBeautyTipRequest {
  title?: string;
  content?: string;
  category?: BeautyTipCategory;
  tags?: string[];
  images?: string[];
  skinTypes?: SkinType[];
  difficulty?: TipDifficulty;
}

export interface BeautyTipsResponse {
  tips: BeautyTip[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BeautyTipResponse {
  message: string;
  tip: BeautyTip;
}

export interface VoteResponse {
  message: string;
  vote: {
    id: string;
    isUpvote: boolean;
    createdAt: string;
  };
  upvotes: number;
  downvotes: number;
}

export interface FollowResponse {
  message: string;
  isFollowing: boolean;
}

export interface CommentResponse {
  message: string;
  comment: BeautyTipComment;
}

export interface BeautyTipFilters {
  category?: BeautyTipCategory;
  difficulty?: TipDifficulty;
  skinType?: SkinType;
  tags?: string[];
  featured?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'upvotes' | 'views' | 'comments';
  sortOrder?: 'asc' | 'desc';
}

class BeautyTipsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Beauty Tip CRUD methods
  async createBeautyTip(tipData: CreateBeautyTipRequest): Promise<BeautyTipResponse> {
    const response = await fetch(`${API_BASE_URL}/beauty-tips`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tipData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create beauty tip');
    }

    const data = await response.json();
    return {
      ...data,
      tip: {
        ...data.tip,
        createdAt: new Date(data.tip.createdAt),
        updatedAt: data.tip.updatedAt ? new Date(data.tip.updatedAt) : undefined
      }
    };
  }

  async updateBeautyTip(tipId: string, updates: UpdateBeautyTipRequest): Promise<BeautyTipResponse> {
    const response = await fetch(`${API_BASE_URL}/beauty-tips/${tipId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update beauty tip');
    }

    const data = await response.json();
    return {
      ...data,
      tip: {
        ...data.tip,
        createdAt: new Date(data.tip.createdAt),
        updatedAt: data.tip.updatedAt ? new Date(data.tip.updatedAt) : undefined
      }
    };
  }

  async deleteBeautyTip(tipId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/beauty-tips/${tipId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete beauty tip');
    }

    return response.json();
  }

  async getBeautyTips(
    filters?: BeautyTipFilters,
    page: number = 1,
    limit: number = 12
  ): Promise<BeautyTipsResponse> {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.skinType) params.append('skinType', filters.skinType);
      if (filters.featured !== undefined) params.append('featured', filters.featured.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
    }

    const response = await fetch(`${API_BASE_URL}/beauty-tips?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch beauty tips');
    }

    const data = await response.json();
    
    return {
      tips: data.tips.map((tip: any) => ({
        ...tip,
        createdAt: new Date(tip.createdAt),
        updatedAt: tip.updatedAt ? new Date(tip.updatedAt) : undefined
      })),
      pagination: data.pagination
    };
  }

  async getBeautyTip(tipId: string): Promise<BeautyTip> {
    const response = await fetch(`${API_BASE_URL}/beauty-tips/${tipId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch beauty tip');
    }

    const data = await response.json();
    
    return {
      ...data.tip,
      createdAt: new Date(data.tip.createdAt),
      updatedAt: data.tip.updatedAt ? new Date(data.tip.updatedAt) : undefined,
      comments: data.tip.comments?.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          createdAt: new Date(reply.createdAt)
        }))
      }))
    };
  }

  async getMyBeautyTips(options: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'upvotes' | 'views';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<BeautyTipsResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await fetch(`${API_BASE_URL}/my-beauty-tips?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch your beauty tips');
    }

    const data = await response.json();
    
    return {
      tips: data.tips.map((tip: any) => ({
        ...tip,
        createdAt: new Date(tip.createdAt),
        updatedAt: tip.updatedAt ? new Date(tip.updatedAt) : undefined
      })),
      pagination: data.pagination
    };
  }

  // Interaction methods
  async voteBeautyTip(tipId: string, isUpvote: boolean): Promise<VoteResponse> {
    const response = await fetch(`${API_BASE_URL}/beauty-tips/${tipId}/vote`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isUpvote }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to vote on beauty tip');
    }

    return response.json();
  }

  async followBeautyTip(tipId: string): Promise<FollowResponse> {
    const response = await fetch(`${API_BASE_URL}/beauty-tips/${tipId}/follow`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to toggle follow status');
    }

    return response.json();
  }

  async addComment(tipId: string, content: string, parentId?: string): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/beauty-tips/${tipId}/comments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content, parentId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to add comment');
    }

    const data = await response.json();
    return {
      ...data,
      comment: {
        ...data.comment,
        createdAt: new Date(data.comment.createdAt)
      }
    };
  }
}

// Singleton instance
export const beautyTipsService = new BeautyTipsService();

// Utility functions
export const getCategoryLabel = (category: BeautyTipCategory): string => {
  const labels: Record<BeautyTipCategory, string> = {
    SKINCARE: '스킨케어',
    MAKEUP: '메이크업',
    HAIRCARE: '헤어케어',
    NAILCARE: '네일케어',
    BODYCARE: '바디케어',
    ROUTINE: '루틴',
    PRODUCT_REVIEW: '제품 리뷰',
    TUTORIAL: '튜토리얼',
    LIFESTYLE: '라이프스타일'
  };
  return labels[category] || category;
};

export const getDifficultyLabel = (difficulty: TipDifficulty): string => {
  const labels: Record<TipDifficulty, string> = {
    BEGINNER: '초급',
    INTERMEDIATE: '중급',
    ADVANCED: '고급'
  };
  return labels[difficulty] || difficulty;
};

export const getSkinTypeLabel = (skinType: SkinType): string => {
  const labels: Record<SkinType, string> = {
    OILY: '지성',
    DRY: '건성',
    COMBINATION: '복합성',
    SENSITIVE: '민감성',
    NORMAL: '보통'
  };
  return labels[skinType] || skinType;
};

export const formatDate = (date: Date): string => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  } else {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
};

export const getDifficultyColor = (difficulty: TipDifficulty): string => {
  const colors: Record<TipDifficulty, string> = {
    BEGINNER: '#10b981', // green
    INTERMEDIATE: '#f59e0b', // amber
    ADVANCED: '#ef4444' // red
  };
  return colors[difficulty] || '#6b7280';
};