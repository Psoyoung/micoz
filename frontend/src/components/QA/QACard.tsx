import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { QAQuestion, QAAnswer, getCategoryLabel, getCategoryColor, getStatusLabel } from '../../services/qaService';

const Card = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transform: translateY(-2px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const QuestionInfo = styled.div`
  flex: 1;
`;

const QuestionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`;

const CategoryBadge = styled.span<{ category: string }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ category }) => getCategoryColor(category as any)}20;
  color: ${({ category }) => getCategoryColor(category as any)};
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  
  ${({ status, theme }) => {
    const colors = {
      pending: { bg: theme.colors.orange[100], text: theme.colors.orange[700] },
      answered: { bg: theme.colors.green[100], text: theme.colors.green[700] },
      closed: { bg: theme.colors.gray[100], text: theme.colors.gray[600] }
    };
    const color = colors[status as keyof typeof colors] || colors.pending;
    return `
      background: ${color.bg};
      color: ${color.text};
    `;
  }}
`;

const PrivateBadge = styled.span`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ theme }) => theme.colors.purple[100]};
  color: ${({ theme }) => theme.colors.purple[700]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};

  &::before {
    content: '🔒';
    font-size: 12px;
  }
`;

const QuestionStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.spacing[2]};
    flex-wrap: wrap;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const QuestionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  cursor: pointer;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const QuestionContent = styled.p<{ expanded: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  
  ${({ expanded }) => !expanded && `
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.sage};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  padding: 0;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
    text-decoration: underline;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const UserAvatar = styled.div<{ image?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ image, theme }) => 
    image ? `url(${image}) center/cover` : theme.colors.gray[300]};
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const QuestionDate = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const TagsSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Tag = styled.span`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.primary.sage}10;
  color: ${({ theme }) => theme.colors.primary.sage};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &::before {
    content: '#';
    opacity: 0.7;
  }
`;

const AnswersSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const AnswersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const AnswersTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const ToggleAnswersButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.sage};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage}10;
  }
`;

const AnswerCard = styled(motion.div)<{ isOfficial: boolean; isBest: boolean }>`
  background: ${({ isOfficial, isBest, theme }) => {
    if (isBest) return theme.colors.yellow[50];
    if (isOfficial) return theme.colors.green[50];
    return theme.colors.gray[50];
  }};
  border: 1px solid ${({ isOfficial, isBest, theme }) => {
    if (isBest) return theme.colors.yellow[200];
    if (isOfficial) return theme.colors.green[200];
    return theme.colors.gray[200];
  }};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const AnswerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const AnswerUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
`;

const AnswerUserDetails = styled.div``;

const AnswerUserName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const OfficialBadge = styled.span`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.green[600]};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const BestAnswerBadge = styled.span`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.yellow[500]};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};

  &::before {
    content: '⭐';
    font-size: 12px;
  }
`;

const AnswerDate = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const AnswerVotes = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const VoteButton = styled.button<{ active?: boolean }>`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  color: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[600]};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AnswerContent = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  white-space: pre-wrap;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
    align-items: flex-start;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const ActionButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[600]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
    color: ${({ theme }) => theme.colors.primary.sage};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface QACardProps {
  question: QAQuestion;
  onVoteQuestion?: (questionId: string, isUpvote: boolean) => void;
  onVoteAnswer?: (answerId: string, isUpvote: boolean) => void;
  onToggleFollow?: (questionId: string) => void;
  onAnswerClick?: (questionId: string) => void;
  currentUserId?: string;
  showAnswers?: boolean;
  showFullContent?: boolean;
}

export const QACard: React.FC<QACardProps> = ({
  question,
  onVoteQuestion,
  onVoteAnswer,
  onToggleFollow,
  onAnswerClick,
  currentUserId,
  showAnswers = true,
  showFullContent = false
}) => {
  const [expanded, setExpanded] = useState(showFullContent);
  const [answersExpanded, setAnswersExpanded] = useState(false);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const isContentLong = question.content.length > 150;
  const isFollowed = currentUserId ? question.followedBy.includes(currentUserId) : false;
  const hasVoted = currentUserId ? question.votedBy.includes(currentUserId) : false;

  const handleVoteQuestion = (isUpvote: boolean) => {
    if (onVoteQuestion && currentUserId && !hasVoted) {
      onVoteQuestion(question.id, isUpvote);
    }
  };

  const handleVoteAnswer = (answerId: string, isUpvote: boolean) => {
    if (onVoteAnswer && currentUserId) {
      onVoteAnswer(answerId, isUpvote);
    }
  };

  const handleToggleFollow = () => {
    if (onToggleFollow && currentUserId) {
      onToggleFollow(question.id);
    }
  };

  const handleAnswerClick = () => {
    if (onAnswerClick) {
      onAnswerClick(question.id);
    }
  };

  // 답변을 정렬 (베스트 답변 > 공식 답변 > 추천 순)
  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (a.id === question.bestAnswerId) return -1;
    if (b.id === question.bestAnswerId) return 1;
    if (a.isOfficial && !b.isOfficial) return -1;
    if (b.isOfficial && !a.isOfficial) return 1;
    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
  });

  return (
    <Card
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <QuestionInfo>
          <QuestionMeta>
            <CategoryBadge category={question.category}>
              {getCategoryLabel(question.category)}
            </CategoryBadge>
            <StatusBadge status={question.status}>
              {getStatusLabel(question.status)}
            </StatusBadge>
            {question.isPrivate && <PrivateBadge>비공개</PrivateBadge>}
            {question.hasOfficialAnswer && (
              <StatusBadge status="official">공식 답변</StatusBadge>
            )}
          </QuestionMeta>
          
          <QuestionTitle onClick={() => setExpanded(!expanded)}>
            {question.title}
          </QuestionTitle>
        </QuestionInfo>
        
        <QuestionStats>
          <StatItem>
            <span>👁️</span>
            <span>{question.views}</span>
          </StatItem>
          <StatItem>
            <span>💬</span>
            <span>{question.answers.length}</span>
          </StatItem>
          <StatItem>
            <span>👍</span>
            <span>{question.upvotes - question.downvotes}</span>
          </StatItem>
        </QuestionStats>
      </Header>

      <QuestionContent expanded={expanded || !isContentLong}>
        {question.content}
      </QuestionContent>
      
      {isContentLong && !expanded && (
        <ExpandButton onClick={() => setExpanded(true)}>
          더 보기
        </ExpandButton>
      )}

      <UserInfo>
        <UserAvatar image={question.userAvatar} />
        <UserDetails>
          <UserName>{question.userName}</UserName>
          <QuestionDate>{formatDate(question.createdAt)}</QuestionDate>
        </UserDetails>
      </UserInfo>

      {question.tags.length > 0 && (
        <TagsSection>
          <TagsList>
            {question.tags.map((tag, index) => (
              <Tag key={index}>{tag}</Tag>
            ))}
          </TagsList>
        </TagsSection>
      )}

      {showAnswers && question.answers.length > 0 && (
        <AnswersSection>
          <AnswersHeader>
            <AnswersTitle>답변 {question.answers.length}개</AnswersTitle>
            <ToggleAnswersButton onClick={() => setAnswersExpanded(!answersExpanded)}>
              {answersExpanded ? '접기' : '펼치기'}
            </ToggleAnswersButton>
          </AnswersHeader>

          <AnimatePresence>
            {answersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {sortedAnswers.map((answer) => (
                  <AnswerCard
                    key={answer.id}
                    isOfficial={answer.isOfficial}
                    isBest={answer.id === question.bestAnswerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnswerHeader>
                      <AnswerUserInfo>
                        <UserAvatar image={answer.userAvatar} />
                        <AnswerUserDetails>
                          <AnswerUserName>
                            {answer.userName}
                            {answer.isOfficial && <OfficialBadge>공식</OfficialBadge>}
                            {answer.id === question.bestAnswerId && (
                              <BestAnswerBadge>베스트</BestAnswerBadge>
                            )}
                          </AnswerUserName>
                          <AnswerDate>{formatDate(answer.createdAt)}</AnswerDate>
                        </AnswerUserDetails>
                      </AnswerUserInfo>
                      
                      <AnswerVotes>
                        <VoteButton 
                          onClick={() => handleVoteAnswer(answer.id, true)}
                          disabled={!currentUserId || answer.votedBy.includes(currentUserId!)}
                        >
                          👍 {answer.upvotes}
                        </VoteButton>
                        <VoteButton 
                          onClick={() => handleVoteAnswer(answer.id, false)}
                          disabled={!currentUserId || answer.votedBy.includes(currentUserId!)}
                        >
                          👎 {answer.downvotes}
                        </VoteButton>
                      </AnswerVotes>
                    </AnswerHeader>
                    
                    <AnswerContent>{answer.content}</AnswerContent>
                  </AnswerCard>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </AnswersSection>
      )}

      <Footer>
        <Actions>
          {currentUserId && (
            <>
              <ActionButton 
                onClick={() => handleVoteQuestion(true)}
                disabled={hasVoted}
              >
                👍 추천 {question.upvotes}
              </ActionButton>
              
              <ActionButton 
                active={isFollowed}
                onClick={handleToggleFollow}
              >
                {isFollowed ? '📌 팔로우 중' : '📌 팔로우'} {question.followedBy.length}
              </ActionButton>
              
              <ActionButton onClick={handleAnswerClick}>
                💬 답변하기
              </ActionButton>
            </>
          )}
        </Actions>
        
        <QuestionDate>
          {question.updatedAt > question.createdAt && 
            `수정됨 ${formatDate(question.updatedAt)}`
          }
        </QuestionDate>
      </Footer>
    </Card>
  );
};