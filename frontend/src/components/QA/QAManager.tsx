import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button/Button';
import { Select } from '../Select/Select';
import { QuestionCard } from './QuestionCard';
import { QuestionForm } from './QuestionForm';
import { 
  Question, 
  QuestionFilters, 
  QuestionCategory, 
  QuestionStatus,
  qaService, 
  getCategoryLabel, 
  getStatusLabel 
} from '../../services/qaService';

interface QAManagerProps {
  productId: string;
  productName: string;
  currentUserId?: string;
  showQuestionForm?: boolean;
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[6]};
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: ${({ theme }) => theme.spacing[2]} 0 0 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-left: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-left: 0;
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

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
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

const StatsSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.sage};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const QuestionsContainer = styled.div`
  min-height: 400px;
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

const categories: { value: QuestionCategory | ''; label: string }[] = [
  { value: '', label: '전체 카테고리' },
  { value: 'GENERAL', label: getCategoryLabel('GENERAL') },
  { value: 'USAGE', label: getCategoryLabel('USAGE') },
  { value: 'INGREDIENTS', label: getCategoryLabel('INGREDIENTS') },
  { value: 'EFFECTS', label: getCategoryLabel('EFFECTS') },
  { value: 'SHIPPING', label: getCategoryLabel('SHIPPING') },
  { value: 'RETURN', label: getCategoryLabel('RETURN') },
  { value: 'SIZE', label: getCategoryLabel('SIZE') },
  { value: 'COLOR', label: getCategoryLabel('COLOR') },
];

const statuses: { value: QuestionStatus | ''; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'PENDING', label: getStatusLabel('PENDING') },
  { value: 'ANSWERED', label: getStatusLabel('ANSWERED') },
  { value: 'CLOSED', label: getStatusLabel('CLOSED') },
];

const sortOptions = [
  { value: 'createdAt-desc', label: '최신순' },
  { value: 'createdAt-asc', label: '오래된순' },
  { value: 'upvotes-desc', label: '추천순' },
  { value: 'answers-desc', label: '답변 많은순' },
];

export const QAManager: React.FC<QAManagerProps> = ({
  productId,
  productName,
  currentUserId,
  showQuestionForm = true
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const [sortBy, sortOrder]: ['createdAt' | 'upvotes' | 'answers', 'desc' | 'asc'] = (filters.sortBy && filters.sortOrder) 
        ? [filters.sortBy as 'createdAt' | 'upvotes' | 'answers', filters.sortOrder as 'desc' | 'asc']
        : ['createdAt', 'desc'];

      const response = await qaService.getQuestionsByProduct(
        productId,
        { ...filters, sortBy, sortOrder },
        currentPage,
        limit
      );

      setQuestions(response.questions);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [productId, filters, currentPage]);

  const handleFilterChange = (key: keyof QuestionFilters, value: any) => {
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

  const handleQuestionSubmit = async (questionData: any) => {
    try {
      setSubmitting(true);
      await qaService.createQuestion({
        productId,
        ...questionData
      });
      setShowForm(false);
      loadQuestions(); // Reload to show new question
    } catch (error) {
      console.error('Failed to submit question:', error);
      alert('질문 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (questionId: string, isUpvote: boolean) => {
    try {
      await qaService.voteQuestion(questionId, isUpvote);
      loadQuestions(); // Reload to update vote counts
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleAnswerVote = async (answerId: string, isUpvote: boolean) => {
    try {
      await qaService.voteAnswer(answerId, isUpvote);
      loadQuestions(); // Reload to update vote counts
    } catch (error) {
      console.error('Failed to vote on answer:', error);
    }
  };

  const handleAnswerSubmit = async (questionId: string, content: string) => {
    try {
      await qaService.createAnswer(questionId, { content });
      loadQuestions(); // Reload to show new answer
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('답변 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await qaService.updateAnswer(answerId, { isAccepted: true });
      loadQuestions(); // Reload to update answer status
    } catch (error) {
      console.error('Failed to accept answer:', error);
      alert('답변 채택에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const answeredCount = questions.filter(q => q.isAnswered).length;
  const pendingCount = questions.filter(q => !q.isAnswered).length;

  return (
    <Container>
      <Header>
        <div>
          <Title>상품 문의</Title>
          <Subtitle>{productName}</Subtitle>
        </div>
        {showQuestionForm && (
          <HeaderActions>
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              문의하기
            </Button>
          </HeaderActions>
        )}
      </Header>

      {showForm && (
        <QuestionForm
          productId={productId}
          productName={productName}
          onSubmit={handleQuestionSubmit}
          onCancel={() => setShowForm(false)}
          isSubmitting={submitting}
        />
      )}

      <FilterSection>
        <StatsSection>
          <StatItem>
            <StatNumber>{totalCount}</StatNumber>
            <StatLabel>전체 문의</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{answeredCount}</StatNumber>
            <StatLabel>답변 완료</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{pendingCount}</StatNumber>
            <StatLabel>답변 대기</StatLabel>
          </StatItem>
        </StatsSection>

        <FilterRow>
          <div>
            <FilterLabel>카테고리</FilterLabel>
            <Select
              options={categories}
              value={filters.category || ''}
              onChange={(value: string) => handleFilterChange('category', value)}
              placeholder="카테고리 선택"
            />
          </div>
          <div>
            <FilterLabel>상태</FilterLabel>
            <Select
              options={statuses}
              value={filters.status || ''}
              onChange={(value: string) => handleFilterChange('status', value)}
              placeholder="상태 선택"
            />
          </div>
          <div>
            <FilterLabel>정렬</FilterLabel>
            <Select
              options={sortOptions}
              value={filters.sortBy && filters.sortOrder ? `${filters.sortBy}-${filters.sortOrder}` : 'createdAt-desc'}
              onChange={handleSortChange}
            />
          </div>
        </FilterRow>
      </FilterSection>

      <QuestionsContainer>
        {loading ? (
          <LoadingSpinner>
            문의 내용을 불러오는 중...
          </LoadingSpinner>
        ) : questions.length > 0 ? (
          <>
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onVote={handleVote}
                onAnswerVote={handleAnswerVote}
                onAnswerSubmit={handleAnswerSubmit}
                onAcceptAnswer={handleAcceptAnswer}
                isOwner={currentUserId === question.user.name} // This would need proper user ID comparison
                currentUserId={currentUserId}
                showAnswerForm={!!currentUserId}
              />
            ))}
            
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
            <EmptyIcon>❓</EmptyIcon>
            <EmptyTitle>아직 문의가 없습니다</EmptyTitle>
            <EmptyDescription>
              이 상품에 대해 궁금한 점이 있으시면<br />
              첫 번째 문의를 남겨보세요!
            </EmptyDescription>
            {showQuestionForm && (
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                문의하기
              </Button>
            )}
          </EmptyState>
        )}
      </QuestionsContainer>
    </Container>
  );
};