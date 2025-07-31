// Q&A System Service
// 상품 질문과 답변 관리

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Question {
  id: string;
  title: string;
  content: string;
  category: QuestionCategory;
  status: QuestionStatus;
  upvotes: number;
  downvotes: number;
  isAnswered: boolean;
  createdAt: Date;
  updatedAt?: Date;
  user: {
    name: string;
    avatar?: string;
  };
  answerCount: number;
  answers: Answer[];
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

export interface Answer {
  id: string;
  content: string;
  isOfficial: boolean;
  isAccepted: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt?: Date;
  user: {
    name: string;
    avatar?: string;
    isOfficial: boolean;
  };
}

export type QuestionCategory = 
  | 'GENERAL' 
  | 'USAGE' 
  | 'INGREDIENTS' 
  | 'EFFECTS' 
  | 'SHIPPING' 
  | 'RETURN' 
  | 'SIZE' 
  | 'COLOR';

export type QuestionStatus = 'PENDING' | 'ANSWERED' | 'CLOSED';

export interface CreateQuestionRequest {
  productId: string;
  title: string;
  content: string;
  category?: QuestionCategory;
}

export interface CreateAnswerRequest {
  content: string;
}

export interface QuestionsResponse {
  questions: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface QuestionResponse {
  message: string;
  question: Question;
}

export interface AnswerResponse {
  message: string;
  answer: Answer;
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

export interface QuestionFilters {
  category?: QuestionCategory;
  status?: QuestionStatus;
  answered?: boolean;
  sortBy?: 'createdAt' | 'upvotes' | 'answers';
  sortOrder?: 'asc' | 'desc';
}

// Legacy interfaces for backward compatibility
export interface QAQuestion extends Question {
  productId?: string;
  categoryId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPrivate: boolean;
  views: number;
  hasOfficialAnswer: boolean;
  bestAnswerId?: string;
  answeredAt?: Date;
  followedBy: string[];
  votedBy: string[];
}

export interface QAAnswer extends Answer {
  questionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'customer' | 'staff' | 'expert';
  votedBy: string[];
  status: 'active' | 'deleted';
}

class QAService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Question methods
  async createQuestion(questionData: CreateQuestionRequest): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create question');
    }

    const data = await response.json();
    return {
      ...data,
      question: {
        ...data.question,
        createdAt: new Date(data.question.createdAt),
        updatedAt: data.question.updatedAt ? new Date(data.question.updatedAt) : undefined
      }
    };
  }

  async updateQuestion(questionId: string, updates: Partial<CreateQuestionRequest>): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update question');
    }

    const data = await response.json();
    return {
      ...data,
      question: {
        ...data.question,
        createdAt: new Date(data.question.createdAt),
        updatedAt: data.question.updatedAt ? new Date(data.question.updatedAt) : undefined
      }
    };
  }

  async deleteQuestion(questionId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete question');
    }

    return response.json();
  }

  async getQuestionsByProduct(
    productId: string,
    filters?: QuestionFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<QuestionsResponse> {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.answered !== undefined) params.append('answered', filters.answered.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const response = await fetch(`${API_BASE_URL}/products/${productId}/questions?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch questions');
    }

    const data = await response.json();
    
    return {
      questions: data.questions.map((question: any) => ({
        ...question,
        createdAt: new Date(question.createdAt),
        updatedAt: question.updatedAt ? new Date(question.updatedAt) : undefined,
        answers: question.answers.map((answer: any) => ({
          ...answer,
          createdAt: new Date(answer.createdAt),
          updatedAt: answer.updatedAt ? new Date(answer.updatedAt) : undefined
        }))
      })),
      pagination: data.pagination
    };
  }

  async getMyQuestions(options: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'upvotes';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<QuestionsResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await fetch(`${API_BASE_URL}/my-questions?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch your questions');
    }

    const data = await response.json();
    
    return {
      questions: data.questions.map((question: any) => ({
        ...question,
        createdAt: new Date(question.createdAt),
        updatedAt: question.updatedAt ? new Date(question.updatedAt) : undefined,
        answers: question.answers.map((answer: any) => ({
          ...answer,
          createdAt: new Date(answer.createdAt),
          updatedAt: answer.updatedAt ? new Date(answer.updatedAt) : undefined
        }))
      })),
      pagination: data.pagination
    };
  }

  // Answer methods
  async createAnswer(questionId: string, answerData: CreateAnswerRequest): Promise<AnswerResponse> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(answerData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create answer');
    }

    const data = await response.json();
    return {
      ...data,
      answer: {
        ...data.answer,
        createdAt: new Date(data.answer.createdAt),
        updatedAt: data.answer.updatedAt ? new Date(data.answer.updatedAt) : undefined
      }
    };
  }

  async updateAnswer(answerId: string, updates: { content?: string; isAccepted?: boolean }): Promise<AnswerResponse> {
    const response = await fetch(`${API_BASE_URL}/answers/${answerId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update answer');
    }

    const data = await response.json();
    return {
      ...data,
      answer: {
        ...data.answer,
        createdAt: new Date(data.answer.createdAt),
        updatedAt: data.answer.updatedAt ? new Date(data.answer.updatedAt) : undefined
      }
    };
  }

  async deleteAnswer(answerId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/answers/${answerId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete answer');
    }

    return response.json();
  }

  // Voting methods
  async voteQuestion(questionId: string, isUpvote: boolean): Promise<VoteResponse> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/vote`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isUpvote }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to vote on question');
    }

    return response.json();
  }

  async voteAnswer(answerId: string, isUpvote: boolean): Promise<VoteResponse> {
    const response = await fetch(`${API_BASE_URL}/answers/${answerId}/vote`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isUpvote }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to vote on answer');
    }

    return response.json();
  }

  // Legacy methods for backward compatibility
  async getQuestions(
    filters?: any,
    page: number = 1,
    limit: number = 10,
    includePrivate: boolean = false
  ): Promise<{ questions: QAQuestion[]; total: number; hasMore: boolean }> {
    // This would need proper implementation or conversion from new API
    return { questions: [], total: 0, hasMore: false };
  }

  async getQuestion(questionId: string, userId?: string): Promise<QAQuestion | null> {
    // This would need proper implementation
    return null;
  }

  async getProductQuestions(productId: string, limit: number = 5): Promise<QAQuestion[]> {
    try {
      const response = await this.getQuestionsByProduct(productId, undefined, 1, limit);
      return response.questions as any; // Type conversion for backward compatibility
    } catch (error) {
      console.error('Failed to get product questions:', error);
      return [];
    }
  }

  async voteAnswer_legacy(answerId: string, userId: string, isUpvote: boolean): Promise<boolean> {
    try {
      await this.voteAnswer(answerId, isUpvote);
      return true;
    } catch (error) {
      console.error('Failed to vote on answer:', error);
      return false;
    }
  }

  async voteQuestion_legacy(questionId: string, userId: string, isUpvote: boolean): Promise<boolean> {
    try {
      await this.voteQuestion(questionId, isUpvote);
      return true;
    } catch (error) {
      console.error('Failed to vote on question:', error);
      return false;
    }
  }
}

// Singleton instance
export const qaService = new QAService();

// Utility functions
export const getCategoryLabel = (category: QuestionCategory): string => {
  const labels: Record<QuestionCategory, string> = {
    GENERAL: '일반',
    USAGE: '사용법',
    INGREDIENTS: '성분',
    EFFECTS: '효과',
    SHIPPING: '배송',
    RETURN: '교환/반품',
    SIZE: '용량/크기',
    COLOR: '색상'
  };
  return labels[category] || category;
};

export const getStatusLabel = (status: QuestionStatus): string => {
  const labels: Record<QuestionStatus, string> = {
    PENDING: '답변 대기',
    ANSWERED: '답변 완료',
    CLOSED: '종료'
  };
  return labels[status] || status;
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

// Legacy utility functions for backward compatibility
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    GENERAL: '#9b59b6',
    USAGE: '#f39c12',
    INGREDIENTS: '#27ae60',
    EFFECTS: '#e67e22',
    SHIPPING: '#e74c3c',
    RETURN: '#c0392b',
    SIZE: '#3498db',
    COLOR: '#8e44ad',
    // Legacy categories
    product: '#3498db',
    ingredients: '#27ae60',
    usage: '#f39c12',
    shipping: '#e74c3c',
    general: '#9b59b6'
  };
  return colors[category] || '#95a5a6';
};

export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    urgent: '긴급'
  };
  return labels[priority] || priority;
};

export const formatResponseTime = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}분`;
  } else if (hours < 24) {
    return `${Math.round(hours)}시간`;
  } else {
    return `${Math.round(hours / 24)}일`;
  }
};