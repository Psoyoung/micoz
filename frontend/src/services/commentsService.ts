// Comments & Discussions Service
// 댓글 및 토론 기능 관리

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
  user: {
    name: string;
    avatar?: string;
  };
  replies?: Comment[];
}

export interface Discussion {
  id: string;
  type: 'review' | 'question' | 'tip';
  title: string;
  content: string;
  createdAt: Date;
  user: {
    name: string;
    avatar?: string;
  };
  commentCount: number;
  engagementCount: number;
  // Type-specific fields
  rating?: number; // for reviews
  helpful?: number; // for reviews
  category?: string; // for questions/tips
  upvotes?: number; // for questions/tips
  downvotes?: number; // for questions/tips
  views?: number; // for tips
  difficulty?: string; // for tips
  answerCount?: number; // for questions
  product?: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  };
  images?: string[]; // for tips
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CommentResponse {
  message: string;
  comment: Comment;
}

export interface DiscussionsResponse {
  discussions: Discussion[];
  metadata: {
    type: string;
    timeframe: string;
    generatedAt: string;
  };
}

export interface DiscussionStats {
  totalDiscussions: number;
  totalComments: number;
  activeUsers: number;
  breakdown: {
    reviews: number;
    questions: number;
    beautyTips: number;
    reviewComments: number;
    answers: number;
    tipComments: number;
  };
  generatedAt: string;
}

class CommentsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Review Comments
  async addReviewComment(reviewId: string, content: string, parentId?: string): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments`, {
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

  async updateReviewComment(commentId: string, content: string): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/review-comments/${commentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update comment');
    }

    const data = await response.json();
    return {
      ...data,
      comment: {
        ...data.comment,
        createdAt: new Date(data.comment.createdAt),
        updatedAt: data.comment.updatedAt ? new Date(data.comment.updatedAt) : undefined
      }
    };
  }

  async deleteReviewComment(commentId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/review-comments/${commentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete comment');
    }

    return response.json();
  }

  async getReviewComments(
    reviewId: string,
    page: number = 1,
    limit: number = 20,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<CommentsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortOrder', sortOrder);

    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch comments');
    }

    const data = await response.json();
    
    return {
      comments: data.comments.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
        updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : undefined,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          createdAt: new Date(reply.createdAt),
          updatedAt: reply.updatedAt ? new Date(reply.updatedAt) : undefined
        }))
      })),
      pagination: data.pagination
    };
  }

  // Discussions
  async getPopularDiscussions(
    type: 'all' | 'reviews' | 'questions' | 'tips' = 'all',
    limit: number = 10,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<DiscussionsResponse> {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('limit', limit.toString());
    params.append('timeframe', timeframe);

    const response = await fetch(`${API_BASE_URL}/discussions/popular?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch popular discussions');
    }

    const data = await response.json();
    
    return {
      discussions: data.discussions.map((discussion: any) => ({
        ...discussion,
        createdAt: new Date(discussion.createdAt)
      })),
      metadata: data.metadata
    };
  }

  async getDiscussionStats(): Promise<DiscussionStats> {
    const response = await fetch(`${API_BASE_URL}/discussions/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch discussion stats');
    }

    const data = await response.json();
    return data.stats;
  }
}

// Singleton instance
export const commentsService = new CommentsService();

// Utility functions
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

export const getDiscussionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    review: '리뷰',
    question: '질문',
    tip: '뷰티 팁'
  };
  return labels[type] || type;
};

export const getDiscussionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    review: '#10b981', // green
    question: '#3b82f6', // blue
    tip: '#f59e0b' // amber
  };
  return colors[type] || '#6b7280';
};