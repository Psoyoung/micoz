import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button/Button';
import { Select } from '../Select/Select';
import { Input } from '../Input/Input';
import { BeautyTipCard } from './BeautyTipCard';
import { BeautyTipForm } from './BeautyTipForm';
import { 
  BeautyTip, 
  BeautyTipFilters, 
  BeautyTipCategory, 
  TipDifficulty,
  SkinType,
  beautyTipsService, 
  getCategoryLabel, 
  getDifficultyLabel,
  getSkinTypeLabel
} from '../../services/beautyTipsService';

interface BeautyTipsManagerProps {
  currentUserId?: string;
  showCreateForm?: boolean;
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[6]};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: stretch;
  }
`;

const FilterSection = styled.div`
  background: white;
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  display: block;
`;

const StatsSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.sage};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const TipsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const EmptyDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const PaginationInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FeaturedSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &::before {
    content: '⭐';
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

const categories: { value: BeautyTipCategory | ''; label: string }[] = [
  { value: '', label: '전체 카테고리' },
  { value: 'SKINCARE', label: getCategoryLabel('SKINCARE') },
  { value: 'MAKEUP', label: getCategoryLabel('MAKEUP') },
  { value: 'HAIRCARE', label: getCategoryLabel('HAIRCARE') },
  { value: 'NAILCARE', label: getCategoryLabel('NAILCARE') },
  { value: 'BODYCARE', label: getCategoryLabel('BODYCARE') },
  { value: 'ROUTINE', label: getCategoryLabel('ROUTINE') },
  { value: 'PRODUCT_REVIEW', label: getCategoryLabel('PRODUCT_REVIEW') },
  { value: 'TUTORIAL', label: getCategoryLabel('TUTORIAL') },
  { value: 'LIFESTYLE', label: getCategoryLabel('LIFESTYLE') },
];

const difficulties: { value: TipDifficulty | ''; label: string }[] = [
  { value: '', label: '전체 난이도' },
  { value: 'BEGINNER', label: getDifficultyLabel('BEGINNER') },
  { value: 'INTERMEDIATE', label: getDifficultyLabel('INTERMEDIATE') },
  { value: 'ADVANCED', label: getDifficultyLabel('ADVANCED') },
];

const skinTypes: { value: SkinType | ''; label: string }[] = [
  { value: '', label: '전체 피부타입' },
  { value: 'OILY', label: getSkinTypeLabel('OILY') },
  { value: 'DRY', label: getSkinTypeLabel('DRY') },
  { value: 'COMBINATION', label: getSkinTypeLabel('COMBINATION') },
  { value: 'SENSITIVE', label: getSkinTypeLabel('SENSITIVE') },
  { value: 'NORMAL', label: getSkinTypeLabel('NORMAL') },
];

const sortOptions = [
  { value: 'createdAt-desc', label: '최신순' },
  { value: 'createdAt-asc', label: '오래된순' },
  { value: 'upvotes-desc', label: '추천순' },
  { value: 'views-desc', label: '조회수순' },
  { value: 'comments-desc', label: '댓글많은순' },
];

export const BeautyTipsManager: React.FC<BeautyTipsManagerProps> = ({
  currentUserId,
  showCreateForm = true
}) => {
  const [tips, setTips] = useState<BeautyTip[]>([]);
  const [featuredTips, setFeaturedTips] = useState<BeautyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<BeautyTipFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const limit = 12;

  const loadTips = async () => {
    try {
      setLoading(true);
      const [sortBy, sortOrder]: ['createdAt' | 'upvotes' | 'views' | 'comments', 'desc' | 'asc'] = (filters.sortBy && filters.sortOrder) 
        ? [filters.sortBy as 'createdAt' | 'upvotes' | 'views' | 'comments', filters.sortOrder as 'desc' | 'asc']
        : ['createdAt', 'desc'];

      const response = await beautyTipsService.getBeautyTips(
        { 
          ...filters, 
          sortBy, 
          sortOrder,
          search: searchQuery || undefined
        },
        currentPage,
        limit
      );

      setTips(response.tips);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error('Failed to load beauty tips:', error);
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedTips = async () => {
    try {
      const response = await beautyTipsService.getBeautyTips(
        { featured: true },
        1,
        4
      );
      setFeaturedTips(response.tips);
    } catch (error) {
      console.error('Failed to load featured tips:', error);
    }
  };

  useEffect(() => {
    loadTips();
  }, [filters, searchQuery, currentPage]);

  useEffect(() => {
    loadFeaturedTips();
  }, []);

  const handleFilterChange = (key: keyof BeautyTipFilters, value: any) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [any, 'asc' | 'desc'];
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTipSubmit = async (tipData: any) => {
    try {
      setSubmitting(true);
      await beautyTipsService.createBeautyTip(tipData);
      setShowForm(false);
      loadTips(); // Reload to show new tip
      loadFeaturedTips(); // Reload featured tips
    } catch (error) {
      console.error('Failed to submit beauty tip:', error);
      alert('뷰티 팁 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (tipId: string, isUpvote: boolean) => {
    try {
      await beautyTipsService.voteBeautyTip(tipId, isUpvote);
      loadTips(); // Reload to update vote counts
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleFollow = async (tipId: string) => {
    try {
      await beautyTipsService.followBeautyTip(tipId);
      loadTips(); // Reload to update follow counts
    } catch (error) {
      console.error('Failed to follow:', error);
    }
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>뷰티 팁 커뮤니티</Title>
          <Subtitle>여러분의 뷰티 노하우를 공유하고 새로운 팁을 발견해보세요!</Subtitle>
        </HeaderContent>
        {showCreateForm && (
          <HeaderActions>
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              팁 작성하기
            </Button>
          </HeaderActions>
        )}
      </Header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <BeautyTipForm
              onSubmit={handleTipSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={submitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {featuredTips.length > 0 && (
        <FeaturedSection>
          <SectionTitle>추천 뷰티 팁</SectionTitle>
          <TipsGrid>
            {featuredTips.map((tip) => (
              <BeautyTipCard
                key={tip.id}
                tip={tip}
                onVote={handleVote}
                onFollow={handleFollow}
              />
            ))}
          </TipsGrid>
        </FeaturedSection>
      )}

      <FilterSection>
        <FilterGrid>
          <div>
            <FilterLabel>검색</FilterLabel>
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="뷰티 팁을 검색해보세요..."
            />
          </div>
          <div>
            <FilterLabel>카테고리</FilterLabel>
            <Select
              options={categories}
              value={filters.category || ''}
              onChange={(value: string) => handleFilterChange('category', value)}
            />
          </div>
          <div>
            <FilterLabel>난이도</FilterLabel>
            <Select
              options={difficulties}
              value={filters.difficulty || ''}
              onChange={(value: string) => handleFilterChange('difficulty', value)}
            />
          </div>
          <div>
            <FilterLabel>피부타입</FilterLabel>
            <Select
              options={skinTypes}
              value={filters.skinType || ''}
              onChange={(value: string) => handleFilterChange('skinType', value)}
            />
          </div>
        </FilterGrid>

        <FilterGrid>
          <div>
            <FilterLabel>정렬</FilterLabel>
            <Select
              options={sortOptions}
              value={filters.sortBy && filters.sortOrder ? `${filters.sortBy}-${filters.sortOrder}` : 'createdAt-desc'}
              onChange={handleSortChange}
            />
          </div>
        </FilterGrid>

        <StatsSection>
          <StatItem>
            <StatNumber>{totalCount}</StatNumber>
            <StatLabel>전체 뷰티 팁</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{featuredTips.length}</StatNumber>
            <StatLabel>추천 팁</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{tips.filter(tip => tip.difficulty === 'BEGINNER').length}</StatNumber>
            <StatLabel>초급자용</StatLabel>
          </StatItem>
        </StatsSection>
      </FilterSection>

      {loading ? (
        <LoadingSpinner>
          뷰티 팁을 불러오는 중...
        </LoadingSpinner>
      ) : tips.length > 0 ? (
        <>
          <TipsGrid>
            {tips.map((tip) => (
              <BeautyTipCard
                key={tip.id}
                tip={tip}
                onVote={handleVote}
                onFollow={handleFollow}
              />
            ))}
          </TipsGrid>
          
          {totalPages > 1 && (
            <Pagination>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              <PaginationInfo>
                {currentPage} / {totalPages}
              </PaginationInfo>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </Pagination>
          )}
        </>
      ) : (
        <EmptyState>
          <EmptyIcon>✨</EmptyIcon>
          <EmptyTitle>뷰티 팁이 없습니다</EmptyTitle>
          <EmptyDescription>
            아직 등록된 뷰티 팁이 없습니다.<br />
            첫 번째 뷰티 팁을 공유해보세요!
          </EmptyDescription>
          {showCreateForm && (
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              팁 작성하기
            </Button>
          )}
        </EmptyState>
      )}
    </Container>
  );
};