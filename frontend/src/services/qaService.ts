// Q&A Service
// 제품 문의, 답변, 투표 등 Q&A 기능 관리

export interface QAAnswer {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'customer' | 'staff' | 'expert'; // 고객, 직원, 전문가
  content: string;
  isOfficial: boolean; // 공식 답변 여부
  upvotes: number;
  downvotes: number;
  votedBy: string[]; // 투표한 사용자 ID들
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'deleted';
}

export interface QAQuestion {
  id: string;
  productId?: string; // 제품별 Q&A인 경우
  categoryId?: string; // 카테고리별 Q&A인 경우
  userId: string;
  userName: string;
  userAvatar?: string;
  
  title: string;
  content: string;
  category: 'product' | 'ingredients' | 'usage' | 'shipping' | 'general';
  tags: string[];
  
  // Status and metadata
  status: 'pending' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPrivate: boolean; // 비공개 문의 여부
  
  // Engagement
  views: number;
  answers: QAAnswer[];
  hasOfficialAnswer: boolean;
  bestAnswerId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  answeredAt?: Date;
  
  // User engagement
  followedBy: string[]; // 이 질문을 팔로우하는 사용자들
  upvotes: number;
  downvotes: number;
  votedBy: string[];
}

export interface CreateQuestionRequest {
  productId?: string;
  categoryId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: QAQuestion['category'];
  tags?: string[];
  isPrivate?: boolean;
}

export interface CreateAnswerRequest {
  questionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: QAAnswer['userRole'];
  content: string;
  isOfficial?: boolean;
}

export interface QAFilters {
  category?: QAQuestion['category'][];
  status?: QAQuestion['status'][];
  hasAnswers?: boolean;
  hasOfficialAnswers?: boolean;
  sortBy?: 'newest' | 'oldest' | 'most_votes' | 'most_views' | 'unanswered';
  tags?: string[];
  productId?: string;
}

export interface QAStats {
  totalQuestions: number;
  answeredQuestions: number;
  pendingQuestions: number;
  averageResponseTime: number; // in hours
  answerRate: number; // percentage
  categoryDistribution: Record<QAQuestion['category'], number>;
  topTags: Array<{ tag: string; count: number }>;
}

class QAService {
  private questions: QAQuestion[] = [];
  private answers: QAAnswer[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeMockData();
  }

  // Mock 데이터 초기화
  private initializeMockData(): void {
    if (this.questions.length === 0) {
      const mockQuestions: QAQuestion[] = [
        {
          id: 'qa_1',
          productId: 'prod1',
          userId: 'user_1',
          userName: '김민수',
          userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
          title: '라벤더 세럼 사용법이 궁금해요',
          content: '라벤더 세럼을 처음 사용해보는데, 하루에 몇 번 사용하는게 좋을까요? 그리고 다른 세럼과 함께 사용해도 되나요?',
          category: 'usage',
          tags: ['사용법', '세럼', '라벤더'],
          status: 'answered',
          priority: 'medium',
          isPrivate: false,
          views: 124,
          answers: [],
          hasOfficialAnswer: true,
          bestAnswerId: 'answer_1',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-21'),
          answeredAt: new Date('2024-01-21'),
          followedBy: ['user_2', 'user_3'],
          upvotes: 15,
          downvotes: 1,
          votedBy: []
        },
        {
          id: 'qa_2',
          productId: 'prod2',
          userId: 'user_2',
          userName: '이수진',
          title: '로즈 토너 성분에 대해 궁금합니다',
          content: '로즈 토너에 들어있는 주요 성분들과 각각의 효능을 자세히 알고 싶어요. 특히 민감성 피부에도 안전한지 궁금합니다.',
          category: 'ingredients',
          tags: ['성분', '로즈토너', '민감성피부'],
          status: 'answered',
          priority: 'medium',
          isPrivate: false,
          views: 89,
          answers: [],
          hasOfficialAnswer: true,
          createdAt: new Date('2024-01-22'),
          updatedAt: new Date('2024-01-23'),
          answeredAt: new Date('2024-01-23'),
          followedBy: [],
          upvotes: 8,
          downvotes: 0,
          votedBy: []
        },
        {
          id: 'qa_3',
          userId: 'user_3',
          userName: '박지현',
          title: '임신 중에도 MICOZ 제품 사용 가능한가요?',
          content: '현재 임신 초기인데 MICOZ 제품들을 계속 사용해도 될까요? 특히 비타민C 크림과 세럼 제품들이 궁금해요.',
          category: 'general',
          tags: ['임신', '안전성', '비타민C'],
          status: 'pending',
          priority: 'high',
          isPrivate: false,
          views: 67,
          answers: [],
          hasOfficialAnswer: false,
          createdAt: new Date('2024-01-25'),
          updatedAt: new Date('2024-01-25'),
          followedBy: ['user_1'],
          upvotes: 12,
          downvotes: 0,
          votedBy: []
        },
        {
          id: 'qa_4',
          productId: 'prod4',
          userId: 'user_4',
          userName: '최영희',
          title: '비타민C 크림 배송 관련 문의',
          content: '비타민C 크림을 주문했는데 언제쯤 배송될까요? 결혼식이 다음 주인데 그 전에 받을 수 있을지 궁금해요.',
          category: 'shipping',
          tags: ['배송', '비타민C크림'],
          status: 'answered',
          priority: 'medium',
          isPrivate: true,
          views: 23,
          answers: [],
          hasOfficialAnswer: true,
          createdAt: new Date('2024-01-26'),
          updatedAt: new Date('2024-01-26'),
          answeredAt: new Date('2024-01-26'),
          followedBy: [],
          upvotes: 3,
          downvotes: 0,
          votedBy: []
        },
        {
          id: 'qa_5',
          productId: 'prod3',
          userId: 'user_5',
          userName: '김태영',
          title: '그린티 클렌저 pH 수치가 궁금해요',
          content: '그린티 클렌저의 pH 수치를 알 수 있을까요? 약산성 제품을 찾고 있어서 궁금합니다.',
          category: 'product',
          tags: ['pH', '그린티클렌저', '약산성'],
          status: 'pending',
          priority: 'low',
          isPrivate: false,
          views: 45,
          answers: [],
          hasOfficialAnswer: false,
          createdAt: new Date('2024-01-27'),
          updatedAt: new Date('2024-01-27'),
          followedBy: [],
          upvotes: 5,
          downvotes: 0,
          votedBy: []
        }
      ];

      const mockAnswers: QAAnswer[] = [
        {
          id: 'answer_1',
          questionId: 'qa_1',
          userId: 'staff_1',
          userName: 'MICOZ 고객지원팀',
          userRole: 'staff',
          content: '안녕하세요! 라벤더 세럼 사용법에 대해 답변드릴게요. 😊\n\n**사용 횟수**: 하루 2회 (아침, 저녁) 사용을 권장합니다.\n\n**사용 순서**: 세안 → 토너 → 라벤더 세럼 → 크림 순으로 사용해주세요.\n\n**다른 세럼과의 병용**: 가능하지만, 비타민C 세럼과는 아침/저녁으로 나누어 사용하시는 것을 추천드려요.\n\n추가 궁금한 점이 있으시면 언제든지 문의해주세요!',
          isOfficial: true,
          upvotes: 23,
          downvotes: 1,
          votedBy: [],
          createdAt: new Date('2024-01-21'),
          updatedAt: new Date('2024-01-21'),
          status: 'active'
        },
        {
          id: 'answer_2',
          questionId: 'qa_2',
          userId: 'expert_1',
          userName: '이미나 연구원',
          userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
          userRole: 'expert',
          content: '로즈 토너의 주요 성분을 설명드리겠습니다:\n\n🌹 **로즈 워터**: 진정 효과와 수분 공급\n🌿 **히알루론산**: 강력한 보습 효과\n🌱 **나이아신아마이드**: 모공 케어와 톤 개선\n🍃 **알로에 베라**: 진정과 항염 효과\n\n모든 성분이 EWG 그린 등급으로 민감성 피부에도 안전하게 사용 가능합니다. 다만 개인차가 있을 수 있으니 패치 테스트 후 사용하시길 권합니다.',
          isOfficial: true,
          upvotes: 18,
          downvotes: 0,
          votedBy: [],
          createdAt: new Date('2024-01-23'),
          updatedAt: new Date('2024-01-23'),
          status: 'active'
        },
        {
          id: 'answer_3',
          questionId: 'qa_4',
          userId: 'staff_2',
          userName: 'MICOZ 배송팀',
          userRole: 'staff',
          content: '안녕하세요! 주문해주셔서 감사합니다.\n\n현재 재고가 충분하여 오늘 출고 예정이며, 일반 배송으로 2-3일 내 수령 가능합니다. 결혼식 전에 충분히 받아보실 수 있으실 것 같아요! 🎉\n\n혹시 더 빠른 배송을 원하시면 당일/익일 배송 옵션으로 변경 가능하니 고객센터로 연락 주세요.\n\n행복한 결혼식 되세요! 💕',
          isOfficial: true,
          upvotes: 5,
          downvotes: 0,
          votedBy: [],
          createdAt: new Date('2024-01-26'),
          updatedAt: new Date('2024-01-26'),
          status: 'active'
        }
      ];

      this.questions = mockQuestions;
      this.answers = mockAnswers;
      
      // 답변을 질문에 연결
      this.questions.forEach(question => {
        question.answers = this.answers.filter(answer => answer.questionId === question.id);
      });

      this.saveToStorage();
    }
  }

  // 질문 생성
  async createQuestion(request: CreateQuestionRequest): Promise<QAQuestion> {
    const questionId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const question: QAQuestion = {
      id: questionId,
      productId: request.productId,
      categoryId: request.categoryId,
      userId: request.userId,
      userName: request.userName,
      userAvatar: request.userAvatar,
      title: request.title,
      content: request.content,
      category: request.category,
      tags: request.tags || [],
      status: 'pending',
      priority: 'medium',
      isPrivate: request.isPrivate || false,
      views: 0,
      answers: [],
      hasOfficialAnswer: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      followedBy: [],
      upvotes: 0,
      downvotes: 0,
      votedBy: []
    };

    this.questions.push(question);
    this.saveToStorage();
    
    console.log('Question created:', question);
    return question;
  }

  // 답변 생성
  async createAnswer(request: CreateAnswerRequest): Promise<QAAnswer> {
    const answerId = `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const answer: QAAnswer = {
      id: answerId,
      questionId: request.questionId,
      userId: request.userId,
      userName: request.userName,
      userAvatar: request.userAvatar,
      userRole: request.userRole,
      content: request.content,
      isOfficial: request.isOfficial || request.userRole === 'staff',
      upvotes: 0,
      downvotes: 0,
      votedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    this.answers.push(answer);
    
    // 질문 업데이트
    const question = this.questions.find(q => q.id === request.questionId);
    if (question) {
      question.answers.push(answer);
      question.status = 'answered';
      question.answeredAt = new Date();
      question.updatedAt = new Date();
      
      if (answer.isOfficial) {
        question.hasOfficialAnswer = true;
      }
    }

    this.saveToStorage();
    
    console.log('Answer created:', answer);
    return answer;
  }

  // 질문 목록 조회
  async getQuestions(
    filters?: QAFilters,
    page: number = 1,
    limit: number = 10,
    includePrivate: boolean = false
  ): Promise<{ questions: QAQuestion[]; total: number; hasMore: boolean }> {
    let filteredQuestions = this.questions.filter(question => 
      includePrivate || !question.isPrivate
    );

    // 필터 적용
    if (filters) {
      if (filters.category && filters.category.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          filters.category!.includes(q.category)
        );
      }

      if (filters.status && filters.status.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          filters.status!.includes(q.status)
        );
      }

      if (filters.hasAnswers !== undefined) {
        filteredQuestions = filteredQuestions.filter(q => 
          filters.hasAnswers ? q.answers.length > 0 : q.answers.length === 0
        );
      }

      if (filters.hasOfficialAnswers !== undefined) {
        filteredQuestions = filteredQuestions.filter(q => 
          filters.hasOfficialAnswers ? q.hasOfficialAnswer : !q.hasOfficialAnswer
        );
      }

      if (filters.productId) {
        filteredQuestions = filteredQuestions.filter(q => 
          q.productId === filters.productId
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          q.tags.some(tag => filters.tags!.includes(tag))
        );
      }
    }

    // 정렬
    const sortBy = filters?.sortBy || 'newest';
    filteredQuestions.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_votes':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'most_views':
          return b.views - a.views;
        case 'unanswered':
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (b.status === 'pending' && a.status !== 'pending') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

    return {
      questions: paginatedQuestions,
      total: filteredQuestions.length,
      hasMore: endIndex < filteredQuestions.length
    };
  }

  // 단일 질문 조회 (조회수 증가)
  async getQuestion(questionId: string, userId?: string): Promise<QAQuestion | null> {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return null;

    // 조회수 증가 (작성자가 아닌 경우에만)
    if (userId !== question.userId) {
      question.views++;
      question.updatedAt = new Date();
      this.saveToStorage();
    }

    return question;
  }

  // 제품별 Q&A 조회
  async getProductQuestions(productId: string, limit: number = 5): Promise<QAQuestion[]> {
    return this.questions
      .filter(q => q.productId === productId && !q.isPrivate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // 질문 투표
  async voteQuestion(questionId: string, userId: string, isUpvote: boolean): Promise<boolean> {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return false;

    // 이미 투표한 사용자인지 확인
    if (question.votedBy.includes(userId)) {
      return false;
    }

    question.votedBy.push(userId);
    if (isUpvote) {
      question.upvotes++;
    } else {
      question.downvotes++;
    }
    question.updatedAt = new Date();

    this.saveToStorage();
    return true;
  }

  // 답변 투표
  async voteAnswer(answerId: string, userId: string, isUpvote: boolean): Promise<boolean> {
    const answer = this.answers.find(a => a.id === answerId);
    if (!answer) return false;

    // 이미 투표한 사용자인지 확인
    if (answer.votedBy.includes(userId)) {
      return false;
    }

    answer.votedBy.push(userId);
    if (isUpvote) {
      answer.upvotes++;
    } else {
      answer.downvotes++;
    }
    answer.updatedAt = new Date();

    this.saveToStorage();
    return true;
  }

  // 질문 팔로우/언팔로우
  async toggleFollow(questionId: string, userId: string): Promise<boolean> {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return false;

    const followIndex = question.followedBy.indexOf(userId);
    if (followIndex > -1) {
      // 언팔로우
      question.followedBy.splice(followIndex, 1);
    } else {
      // 팔로우
      question.followedBy.push(userId);
    }

    question.updatedAt = new Date();
    this.saveToStorage();
    
    return followIndex === -1; // 팔로우되었는지 여부 반환
  }

  // 베스트 답변 설정
  async setBestAnswer(questionId: string, answerId: string): Promise<boolean> {
    const question = this.questions.find(q => q.id === questionId);
    const answer = this.answers.find(a => a.id === answerId);
    
    if (!question || !answer || answer.questionId !== questionId) {
      return false;
    }

    question.bestAnswerId = answerId;
    question.updatedAt = new Date();
    
    this.saveToStorage();
    return true;
  }

  // 검색
  async searchQuestions(query: string, filters?: QAFilters): Promise<QAQuestion[]> {
    const searchTerms = query.toLowerCase().split(' ');
    
    let results = this.questions.filter(question => {
      if (question.isPrivate) return false;
      
      const searchText = `${question.title} ${question.content} ${question.tags.join(' ')}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });

    // 필터 적용
    if (filters) {
      if (filters.category && filters.category.length > 0) {
        results = results.filter(q => filters.category!.includes(q.category));
      }
      // 기타 필터들...
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 통계 조회
  async getQAStats(): Promise<QAStats> {
    const totalQuestions = this.questions.length;
    const answeredQuestions = this.questions.filter(q => q.status === 'answered').length;
    const pendingQuestions = this.questions.filter(q => q.status === 'pending').length;
    
    // 평균 응답 시간 계산 (시간 단위)
    const answeredQuestionsWithTime = this.questions.filter(q => q.answeredAt);
    const averageResponseTime = answeredQuestionsWithTime.length > 0
      ? answeredQuestionsWithTime.reduce((sum, q) => {
          const responseTime = (q.answeredAt!.getTime() - q.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + responseTime;
        }, 0) / answeredQuestionsWithTime.length
      : 0;

    const answerRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // 카테고리별 분포
    const categoryDistribution: Record<QAQuestion['category'], number> = {
      product: 0,
      ingredients: 0,
      usage: 0,
      shipping: 0,
      general: 0
    };
    
    this.questions.forEach(q => {
      categoryDistribution[q.category]++;
    });

    // 인기 태그
    const tagCount: Record<string, number> = {};
    this.questions.forEach(q => {
      q.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalQuestions,
      answeredQuestions,
      pendingQuestions,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      answerRate: Math.round(answerRate),
      categoryDistribution,
      topTags
    };
  }

  // 사용자별 질문 조회
  async getUserQuestions(userId: string): Promise<QAQuestion[]> {
    return this.questions
      .filter(q => q.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 사용자별 답변 조회
  async getUserAnswers(userId: string): Promise<QAAnswer[]> {
    return this.answers
      .filter(a => a.userId === userId && a.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // localStorage 저장
  private saveToStorage(): void {
    try {
      const data = {
        questions: this.questions.map(q => ({
          ...q,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          answeredAt: q.answeredAt?.toISOString()
        })),
        answers: this.answers.map(a => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString()
        }))
      };
      localStorage.setItem('micoz_qa', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save Q&A to storage:', error);
    }
  }

  // localStorage 로드
  private loadFromStorage(): void {
    try {
      const savedData = localStorage.getItem('micoz_qa');
      if (savedData) {
        const { questions, answers } = JSON.parse(savedData);
        
        this.questions = questions.map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt),
          answeredAt: q.answeredAt ? new Date(q.answeredAt) : undefined
        }));

        this.answers = answers.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt)
        }));

        // 답변을 질문에 연결
        this.questions.forEach(question => {
          question.answers = this.answers.filter(answer => answer.questionId === question.id);
        });
      }
    } catch (error) {
      console.error('Failed to load Q&A from storage:', error);
    }
  }
}

// Singleton instance
export const qaService = new QAService();

// Utility functions
export const getCategoryLabel = (category: QAQuestion['category']): string => {
  const labels = {
    product: '제품 문의',
    ingredients: '성분 문의',
    usage: '사용법',
    shipping: '배송',
    general: '일반 문의'
  };
  return labels[category];
};

export const getCategoryColor = (category: QAQuestion['category']): string => {
  const colors = {
    product: '#3498db',
    ingredients: '#27ae60',
    usage: '#f39c12',
    shipping: '#e74c3c',
    general: '#9b59b6'
  };
  return colors[category];
};

export const getStatusLabel = (status: QAQuestion['status']): string => {
  const labels = {
    pending: '답변 대기',
    answered: '답변 완료',
    closed: '질문 마감'
  };
  return labels[status];
};

export const getPriorityLabel = (priority: QAQuestion['priority']): string => {
  const labels = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    urgent: '긴급'
  };
  return labels[priority];
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