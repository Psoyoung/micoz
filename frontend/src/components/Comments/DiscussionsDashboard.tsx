import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button/Button';
import { Select } from '../Select/Select';
import { 
  Discussion, 
  DiscussionStats,
  commentsService, 
  getDiscussionTypeLabel, 
  getDiscussionTypeColor,
  formatDate
} from '../../services/commentsService';

interface DiscussionsDashboardProps {
  onDiscussionClick?: (discussion: Discussion) => void;
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[6]};
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

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

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const StatCard = styled(motion.div)`
  background: white;
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.sage};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
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
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  display: block;
`;

const DiscussionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const DiscussionCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TypeBadge = styled.div<{ type: string }>`
  background: ${({ type }) => getDiscussionTypeColor(type)}15;
  color: ${({ type }) => getDiscussionTypeColor(type)};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const CardMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const DateText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EngagementText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary.sage};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

const DiscussionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const DiscussionContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const UserAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary.sage};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const ProductImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  object-fit: cover;
`;

const ProductName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[500]};
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
`;

const typeOptions = [
  { value: 'all', label: '모든 토론' },
  { value: 'reviews', label: '리뷰' },
  { value: 'questions', label: '질문' },
  { value: 'tips', label: '뷰티 팁' },
];

const timeframeOptions = [
  { value: 'day', label: '오늘' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
];

const limitOptions = [
  { value: '10', label: '10개' },
  { value: '20', label: '20개' },
  { value: '50', label: '50개' },
];

export const DiscussionsDashboard: React.FC<DiscussionsDashboardProps> = ({
  onDiscussionClick
}) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [stats, setStats] = useState<DiscussionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'all' | 'reviews' | 'questions' | 'tips'>('all');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [limit, setLimit] = useState(20);

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const response = await commentsService.getPopularDiscussions(type, limit, timeframe);
      setDiscussions(response.discussions);
    } catch (error) {
      console.error('Failed to load discussions:', error);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await commentsService.getDiscussionStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadDiscussions();
  }, [type, timeframe, limit]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleDiscussionClick = (discussion: Discussion) => {
    if (onDiscussionClick) {
      onDiscussionClick(discussion);
    }
  };

  return (
    <Container>
      <Header>
        <Title>커뮤니티 토론</Title>
        <Subtitle>활발한 토론에 참여하고 다양한 의견을 나눠보세요!</Subtitle>
      </Header>

      {stats && (
        <StatsSection>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatNumber>{stats.totalDiscussions.toLocaleString()}</StatNumber>
            <StatLabel>총 토론</StatLabel>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <StatNumber>{stats.totalComments.toLocaleString()}</StatNumber>
            <StatLabel>총 댓글</StatLabel>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <StatNumber>{stats.activeUsers.toLocaleString()}</StatNumber>
            <StatLabel>활성 사용자</StatLabel>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <StatNumber>
              {Math.round((stats.totalComments / stats.totalDiscussions) * 10) / 10}
            </StatNumber>
            <StatLabel>평균 참여도</StatLabel>
          </StatCard>
        </StatsSection>
      )}

      <FilterSection>
        <FilterGrid>
          <div>
            <FilterLabel>토론 유형</FilterLabel>
            <Select
              options={typeOptions}
              value={type}
              onChange={(value: string) => setType(value as any)}
            />
          </div>
          <div>
            <FilterLabel>기간</FilterLabel>
            <Select
              options={timeframeOptions}
              value={timeframe}
              onChange={(value: string) => setTimeframe(value as any)}
            />
          </div>
          <div>
            <FilterLabel>표시 개수</FilterLabel>
            <Select
              options={limitOptions}
              value={limit.toString()}
              onChange={(value: string) => setLimit(parseInt(value))}
            />
          </div>
        </FilterGrid>
      </FilterSection>

      {loading ? (
        <LoadingSpinner>
          인기 토론을 불러오는 중...
        </LoadingSpinner>
      ) : discussions.length > 0 ? (
        <DiscussionsGrid>
          {discussions.map((discussion, index) => (
            <DiscussionCard
              key={discussion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => handleDiscussionClick(discussion)}
            >
              <CardHeader>
                <TypeBadge type={discussion.type}>
                  {getDiscussionTypeLabel(discussion.type)}
                </TypeBadge>
                <CardMeta>
                  <DateText>{formatDate(discussion.createdAt)}</DateText>
                  <EngagementText>
                    💬 {discussion.commentCount} 
                    {discussion.type === 'question' && ` | 📝 ${discussion.answerCount || 0}`}
                    {discussion.type === 'tip' && ` | 👁️ ${discussion.views || 0}`}
                    {discussion.type === 'review' && ` | 👍 ${discussion.helpful || 0}`}
                  </EngagementText>
                </CardMeta>
              </CardHeader>

              <CardBody>
                <DiscussionTitle>{discussion.title}</DiscussionTitle>
                <DiscussionContent>{discussion.content}</DiscussionContent>
                
                <UserInfo>
                  <UserAvatar>
                    {discussion.user.name.charAt(0)}
                  </UserAvatar>
                  <UserName>{discussion.user.name}</UserName>
                </UserInfo>

                {discussion.product && (
                  <ProductInfo>
                    {discussion.product.image && (
                      <ProductImage 
                        src={discussion.product.image} 
                        alt={discussion.product.name}
                      />
                    )}
                    <ProductName>{discussion.product.name}</ProductName>
                  </ProductInfo>
                )}
              </CardBody>
            </DiscussionCard>
          ))}
        </DiscussionsGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>💭</EmptyIcon>
          <EmptyTitle>토론이 없습니다</EmptyTitle>
          <EmptyDescription>
            선택한 조건에 해당하는 토론이 없습니다.<br />
            다른 조건으로 검색해보세요!
          </EmptyDescription>
        </EmptyState>
      )}
    </Container>
  );
};