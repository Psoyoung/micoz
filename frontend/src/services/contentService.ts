// Content Management Service
// 뷰티 에디토리얼, 성분 스토리, 사용자 스토리, 전문가 인터뷰 등 콘텐츠 관리

export type ContentType = 'editorial' | 'ingredient' | 'story' | 'interview';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  gallery?: string[];
  tags: string[];
  author: {
    name: string;
    bio?: string;
    avatar?: string;
    credentials?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  readTime?: number;
  views?: number;
  likes?: number;
  
  // Type-specific fields
  ingredients?: Array<{
    name: string;
    percentage?: number;
    benefits: string[];
    safetyLevel: 'safe' | 'moderate' | 'caution';
  }>;
  
  products?: Array<{
    id: string;
    name: string;
    image: string;
    price: number;
  }>;
  
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  skinTypes?: string[];
  concerns?: string[];
}

export interface CreateContentRequest {
  type: ContentType;
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  gallery?: string[];
  tags: string[];
  author: ContentItem['author'];
  seo?: ContentItem['seo'];
  ingredients?: ContentItem['ingredients'];
  products?: ContentItem['products'];
  difficulty?: ContentItem['difficulty'];
  skinTypes?: string[];
  concerns?: string[];
}

class ContentService {
  private contents: ContentItem[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeMockData();
  }

  // Mock 데이터 초기화
  private initializeMockData(): void {
    if (this.contents.length === 0) {
      const mockContents: ContentItem[] = [
        {
          id: 'content_1',
          type: 'editorial',
          title: '겨울철 건조한 피부를 위한 완벽한 스킨케어 루틴',
          slug: 'winter-skincare-routine',
          excerpt: '차가운 바람과 건조한 실내 공기로 인해 피부가 거칠어지는 겨울, 올바른 스킨케어 루틴으로 촉촉하고 건강한 피부를 유지하세요.',
          content: `# 겨울철 스킨케어의 중요성

겨울철에는 낮은 온도와 습도로 인해 피부의 수분이 쉽게 증발합니다. 이로 인해 피부 장벽이 약해지고, 건조함, 각질, 민감성이 증가할 수 있습니다.

## 1단계: 온화한 클렌징
- 너무 뜨거운 물은 피부를 더욱 건조하게 만들 수 있습니다
- 미지근한 물을 사용하여 부드럽게 세안하세요
- 오일 클렌저 후 폼 클렌저를 사용한 이중 세안을 추천합니다

## 2단계: 충분한 보습
- 토너로 즉시 수분을 공급하세요
- 하이알루론산 세럼으로 깊은 보습을 더하세요
- 세라마이드가 함유된 크림으로 마무리하세요

## 3단계: 자외선 차단
- 겨울에도 자외선 차단제는 필수입니다
- SPF 30 이상의 제품을 사용하세요`,
          featuredImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'
          ],
          tags: ['겨울스킨케어', '보습', '건조피부', '루틴'],
          author: {
            name: '김미나',
            bio: '10년 경력의 피부과 전문의',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            credentials: '피부과 전문의, 미용 피부학 박사'
          },
          seo: {
            metaTitle: '겨울철 건조한 피부를 위한 완벽한 스킨케어 루틴 - MICOZ',
            metaDescription: '겨울철 건조한 피부 관리법과 스킨케어 루틴을 전문의가 알려드립니다.',
            keywords: ['겨울스킨케어', '건조피부', '보습', '스킨케어루틴']
          },
          status: 'published',
          publishedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-15'),
          readTime: 5,
          views: 1250,
          likes: 89,
          difficulty: 'beginner',
          skinTypes: ['건성', '복합성'],
          concerns: ['건조함', '각질', '민감성']
        },
        {
          id: 'content_2',
          type: 'ingredient',
          title: '레티놀의 모든 것: 안티에이징의 성분의 왕',
          slug: 'everything-about-retinol',
          excerpt: '안티에이징 스킨케어의 대표 성분 레티놀. 올바른 사용법부터 주의사항까지, 레티놀에 대한 모든 것을 알아보세요.',
          content: `# 레티놀이란?

레티놀은 비타민 A의 한 형태로, 피부 세포의 턴오버를 촉진하고 콜라겐 생성을 도와 주름 개선과 피부 톤 균일화에 효과적입니다.

## 레티놀의 작용 메커니즘
1. **세포 턴오버 촉진**: 죽은 피부 세포를 제거하고 새로운 세포 생성을 촉진
2. **콜라겐 생성 자극**: 피부 탄력과 주름 개선에 도움
3. **피지 분비 조절**: 여드름과 블랙헤드 개선

## 올바른 사용법
- 밤에만 사용하세요 (자외선에 민감)
- 소량부터 시작하여 점차 농도를 높이세요
- 충분한 보습제와 함께 사용하세요
- 자외선 차단제는 필수입니다`,
          featuredImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
          tags: ['레티놀', '안티에이징', '주름개선', '성분분석'],
          author: {
            name: '박소영',
            bio: '화장품 연구개발 전문가',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            credentials: '화학공학 박사, 15년 화장품 R&D 경력'
          },
          seo: {
            metaTitle: '레티놀의 모든 것: 안티에이징 성분 완벽 가이드 - MICOZ',
            metaDescription: '레티놀의 효과와 올바른 사용법을 화장품 전문가가 상세히 설명합니다.',
            keywords: ['레티놀', '안티에이징', '주름개선', '비타민A']
          },
          status: 'published',
          publishedAt: new Date('2024-01-20'),
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-20'),
          readTime: 7,
          views: 2100,
          likes: 156,
          ingredients: [
            {
              name: '레티놀',
              percentage: 0.5,
              benefits: ['주름 개선', '피부 톤 균일화', '모공 개선'],
              safetyLevel: 'moderate'
            },
            {
              name: '하이알루론산',
              percentage: 2.0,
              benefits: ['수분 공급', '보습', '진정'],
              safetyLevel: 'safe'
            }
          ],
          difficulty: 'intermediate',
          skinTypes: ['지성', '복합성', '노화피부'],
          concerns: ['주름', '색소침착', '모공']
        },
        {
          id: 'content_3',
          type: 'story',
          title: '30대 직장인의 바쁜 아침을 위한 5분 스킨케어',
          slug: '5-minute-morning-skincare',
          excerpt: '바쁜 아침에도 놓칠 수 없는 스킨케어! 직장인 김서연님의 실제 경험담과 함께 5분 만에 완성하는 모닝 루틴을 소개합니다.',
          content: `# 바쁜 직장인의 현실적인 스킨케어

안녕하세요, 30대 직장인 김서연입니다. 매일 아침 7시에 일어나서 9시까지 출근해야 하는 저에게는 시간이 정말 소중해요.

## 이전의 실패담
처음에는 10단계 스킨케어 루틴을 시도했지만... 현실은 녹록지 않았어요. 결국 포기하게 되고 화장만 하고 나가는 날이 많았죠.

## 5분 모닝 루틴 발견
MICOZ 제품으로 루틴을 단순화한 후 놀라운 변화가!

### 1분: 세안
- 미지근한 물로 간단히 세안
- 너무 꼼꼼히 하지 않아도 OK

### 2분: 토너 + 세럼
- 올인원 토너로 간단하게
- 비타민C 세럼 한 방울

### 1분: 보습
- 가벼운 젤 타입 모이스처라이저
- SPF가 포함된 제품으로 자외선 차단까지

### 1분: 마무리
- 립밤과 아이크림으로 포인트 케어

## 3개월 후 결과
피부가 훨씬 건강해졌어요! 무엇보다 꾸준히 할 수 있다는 게 가장 큰 장점이에요.`,
          featuredImage: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
          tags: ['직장인스킨케어', '모닝루틴', '시간절약', '실사용후기'],
          author: {
            name: '김서연',
            bio: '30대 직장인, MICOZ 사랑 유저',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
          },
          seo: {
            metaTitle: '바쁜 직장인을 위한 5분 모닝 스킨케어 루틴 - MICOZ',
            metaDescription: '30대 직장인의 실제 경험담으로 알아보는 간단하고 효과적인 모닝 스킨케어 루틴',
            keywords: ['직장인스킨케어', '모닝루틴', '5분스킨케어', '시간절약']
          },
          status: 'published',
          publishedAt: new Date('2024-01-25'),
          createdAt: new Date('2024-01-22'),
          updatedAt: new Date('2024-01-25'),
          readTime: 4,
          views: 1800,
          likes: 94,
          products: [
            {
              id: 'prod1',
              name: '라벤더 세럼',
              image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
              price: 45000
            },
            {
              id: 'prod2',
              name: '로즈 토너',
              image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
              price: 35000
            }
          ],
          difficulty: 'beginner',
          skinTypes: ['모든피부'],
          concerns: ['시간부족', '바쁜아침']
        },
        {
          id: 'content_4',
          type: 'interview',
          title: '피부과 전문의가 말하는 K-뷰티 트렌드와 MICOZ',
          slug: 'dermatologist-interview-k-beauty',
          excerpt: '20년 경력의 피부과 전문의 이준호 원장과의 인터뷰. K-뷰티의 현재와 미래, 그리고 MICOZ 제품에 대한 전문가의 솔직한 의견을 들어보세요.',
          content: `# 이준호 원장님과의 특별 인터뷰

**MICOZ**: 안녕하세요, 원장님. K-뷰티에 대한 전문가의 시각을 듣고 싶습니다.

**이준호 원장**: 안녕하세요. K-뷰티는 정말 놀라운 발전을 보여왔죠. 특히 자연 성분과 과학적 근거를 결합한 접근 방식이 인상적입니다.

## Q1. K-뷰티의 가장 큰 강점은 무엇인가요?

**원장**: 두 가지를 꼽고 싶어요. 첫째는 '예방 중심의 스킨케어 철학'입니다. 서구권이 '문제 해결' 중심이라면, K-뷰티는 '예방과 관리'에 중점을 둡니다.

둘째는 '다단계 스킨케어 루틴'이에요. 처음에는 복잡해 보이지만, 각 단계마다 명확한 목적이 있어서 실제로는 매우 과학적인 접근법입니다.

## Q2. MICOZ 제품을 어떻게 평가하시나요?

**원장**: MICOZ는 특히 성분의 안전성과 효능에서 높은 점수를 주고 싶습니다. 자연 추출물을 사용하면서도 임상적 효과를 놓치지 않았어요.

특히 라벤더 세럼의 경우, 진정 효과와 동시에 피부 장벽 강화 효과를 보여주는 데이터가 인상적이었습니다.

## Q3. 앞으로의 K-뷰티 트렌드는?

**원장**: 개인 맞춤형 스킨케어가 더욱 발전할 것 같아요. 피부 분석 기술과 AI를 활용한 개인별 루틴 제안이 일반화될 것으로 예상합니다.

또한 지속가능성에 대한 관심이 높아지면서, 친환경 패키징과 윤리적 성분 조달이 더욱 중요해질 것입니다.

## Q4. 독자들에게 한 말씀 부탁드립니다.

**원장**: 스킨케어는 하루아침에 변화를 보기 어려워요. 꾸준함이 가장 중요하고, 자신의 피부 타입과 상태를 정확히 파악하는 것이 첫 번째 단계입니다.

MICOZ와 같은 브랜드가 제공하는 가이드를 참고하되, 자신만의 루틴을 찾아가는 과정을 즐기셨으면 좋겠어요.`,
          featuredImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
          tags: ['전문가인터뷰', 'K뷰티', '피부과전문의', '트렌드'],
          author: {
            name: 'MICOZ 편집부',
            bio: 'MICOZ 공식 콘텐츠 팀',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
          },
          seo: {
            metaTitle: '피부과 전문의가 말하는 K-뷰티 트렌드와 MICOZ - 전문가 인터뷰',
            metaDescription: '20년 경력 피부과 전문의 이준호 원장이 말하는 K-뷰티 트렌드와 MICOZ 제품 평가',
            keywords: ['피부과전문의', 'K뷰티트렌드', '전문가인터뷰', 'MICOZ']
          },
          status: 'published',
          publishedAt: new Date('2024-01-30'),
          createdAt: new Date('2024-01-28'),
          updatedAt: new Date('2024-01-30'),
          readTime: 8,
          views: 3200,
          likes: 245,
          difficulty: 'intermediate',
          skinTypes: ['모든피부'],
          concerns: ['전문지식', '트렌드']
        }
      ];

      this.contents = mockContents;
      this.saveToStorage();
    }
  }

  // 모든 콘텐츠 조회
  async getAllContent(): Promise<ContentItem[]> {
    return [...this.contents].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 타입별 콘텐츠 조회
  async getContentByType(type: ContentType): Promise<ContentItem[]> {
    return this.contents
      .filter(content => content.type === type && content.status === 'published')
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  }

  // 단일 콘텐츠 조회
  async getContentById(id: string): Promise<ContentItem | null> {
    const content = this.contents.find(c => c.id === id);
    if (content) {
      // 조회수 증가
      content.views = (content.views || 0) + 1;
      this.saveToStorage();
    }
    return content || null;
  }

  // 슬러그로 콘텐츠 조회
  async getContentBySlug(slug: string): Promise<ContentItem | null> {
    const content = this.contents.find(c => c.slug === slug);
    if (content) {
      content.views = (content.views || 0) + 1;
      this.saveToStorage();
    }
    return content || null;
  }

  // 콘텐츠 생성
  async createContent(request: CreateContentRequest): Promise<ContentItem> {
    const id = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const slug = this.generateSlug(request.title);
    const readTime = this.calculateReadTime(request.content);

    const content: ContentItem = {
      id,
      slug,
      readTime,
      views: 0,
      likes: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      seo: {
        metaTitle: request.title,
        metaDescription: request.excerpt,
        keywords: request.tags,
        ...request.seo
      },
      ...request
    };

    this.contents.push(content);
    this.saveToStorage();
    
    console.log('Content created:', content);
    return content;
  }

  // 콘텐츠 업데이트
  async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const index = this.contents.findIndex(c => c.id === id);
    if (index === -1) return null;

    const content = this.contents[index];
    const updatedContent = {
      ...content,
      ...updates,
      updatedAt: new Date(),
      readTime: updates.content ? this.calculateReadTime(updates.content) : content.readTime
    };

    this.contents[index] = updatedContent;
    this.saveToStorage();
    
    return updatedContent;
  }

  // 콘텐츠 삭제
  async deleteContent(id: string): Promise<boolean> {
    const index = this.contents.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.contents.splice(index, 1);
    this.saveToStorage();
    
    console.log('Content deleted:', id);
    return true;
  }

  // 콘텐츠 발행
  async publishContent(id: string): Promise<ContentItem | null> {
    const content = this.contents.find(c => c.id === id);
    if (!content) return null;

    content.status = 'published';
    content.publishedAt = new Date();
    content.updatedAt = new Date();
    
    this.saveToStorage();
    return content;
  }

  // 좋아요 토글
  async toggleLike(id: string): Promise<number> {
    const content = this.contents.find(c => c.id === id);
    if (!content) return 0;

    content.likes = (content.likes || 0) + 1;
    this.saveToStorage();
    
    return content.likes;
  }

  // 태그로 검색
  async searchByTag(tag: string): Promise<ContentItem[]> {
    return this.contents.filter(content => 
      content.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())) &&
      content.status === 'published'
    );
  }

  // 키워드로 검색
  async searchContent(keyword: string): Promise<ContentItem[]> {
    const lowerKeyword = keyword.toLowerCase();
    return this.contents.filter(content => 
      (content.title.toLowerCase().includes(lowerKeyword) ||
       content.excerpt.toLowerCase().includes(lowerKeyword) ||
       content.content.toLowerCase().includes(lowerKeyword) ||
       content.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))) &&
      content.status === 'published'
    );
  }

  // 인기 콘텐츠 조회
  async getPopularContent(limit: number = 10): Promise<ContentItem[]> {
    return [...this.contents]
      .filter(content => content.status === 'published')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);
  }

  // 최신 콘텐츠 조회
  async getLatestContent(limit: number = 10): Promise<ContentItem[]> {
    return [...this.contents]
      .filter(content => content.status === 'published')
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
      .slice(0, limit);
  }

  // 관련 콘텐츠 조회
  async getRelatedContent(id: string, limit: number = 4): Promise<ContentItem[]> {
    const content = this.contents.find(c => c.id === id);
    if (!content) return [];

    return this.contents
      .filter(c => 
        c.id !== id && 
        c.status === 'published' &&
        (c.type === content.type || 
         c.tags.some(tag => content.tags.includes(tag)))
      )
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
      .slice(0, limit);
  }

  // 슬러그 생성
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // 읽기 시간 계산 (한국어 기준 분당 300자)
  private calculateReadTime(content: string): number {
    const charactersPerMinute = 300;
    const characters = content.replace(/\s/g, '').length;
    return Math.max(1, Math.ceil(characters / charactersPerMinute));
  }

  // localStorage에 저장
  private saveToStorage(): void {
    try {
      const data = this.contents.map(content => ({
        ...content,
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString(),
        publishedAt: content.publishedAt?.toISOString()
      }));
      localStorage.setItem('micoz_content', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save content to storage:', error);
    }
  }

  // localStorage에서 로드
  private loadFromStorage(): void {
    try {
      const savedData = localStorage.getItem('micoz_content');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.contents = parsedData.map((content: any) => ({
          ...content,
          createdAt: new Date(content.createdAt),
          updatedAt: new Date(content.updatedAt),
          publishedAt: content.publishedAt ? new Date(content.publishedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load content from storage:', error);
    }
  }
}

// Singleton instance
export const contentService = new ContentService();

// Utility functions
export const getContentTypeLabel = (type: ContentType): string => {
  const labels = {
    editorial: '뷰티 에디토리얼',
    ingredient: '성분 스토리',
    story: '사용자 스토리',
    interview: '전문가 인터뷰'
  };
  return labels[type];
};

export const getContentTypeColor = (type: ContentType): { bg: string; text: string } => {
  const colors = {
    editorial: { bg: '#f3e8ff', text: '#7c3aed' },
    ingredient: { bg: '#dcfce7', text: '#16a34a' },
    story: { bg: '#dbeafe', text: '#2563eb' },
    interview: { bg: '#fed7aa', text: '#ea580c' }
  };
  return colors[type];
};

export const formatReadTime = (minutes: number): string => {
  return `약 ${minutes}분`;
};

export const formatViewCount = (views: number): string => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`;
  }
  return views.toString();
};

export const getContentStatusText = (status: ContentItem['status']): string => {
  const statusTexts = {
    draft: '초안',
    published: '발행됨',
    archived: '보관됨'
  };
  return statusTexts[status];
};