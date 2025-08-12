import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button/Button';
import { Question, Answer, qaService, getCategoryLabel, getStatusLabel, formatDate } from '../../services/qaService';
import { AnswerForm } from './AnswerForm';

interface QuestionCardProps {
  question: Question;
  onVote?: (questionId: string, isUpvote: boolean) => void;
  onAnswerVote?: (answerId: string, isUpvote: boolean) => void;
  onAnswerSubmit?: (questionId: string, content: string) => void;
  onAcceptAnswer?: (answerId: string) => void;
  showAnswerForm?: boolean;
  isOwner?: boolean;
  currentUserId?: string;
}

const CardContainer = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const QuestionHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const QuestionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
`;

const CategoryBadge = styled.span<{ category: string }>`
  background: ${({ theme }) => theme.colors.primary.sage}15;
  color: ${({ theme }) => theme.colors.primary.deepForest};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const StatusBadge = styled.span<{ status: string }>`
  background: ${({ status, theme }) => 
    status === 'ANSWERED' ? theme.colors.green[100] :
    status === 'PENDING' ? theme.colors.yellow[100] :
    theme.colors.gray[100]
  };
  color: ${({ status, theme }) => 
    status === 'ANSWERED' ? theme.colors.green[700] :
    status === 'PENDING' ? theme.colors.yellow[700] :
    theme.colors.gray[700]
  };
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-left: auto;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary.sage};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const QuestionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const QuestionContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  white-space: pre-wrap;
`;

const QuestionActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const VoteSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const VoteButton = styled.button<{ active?: boolean; variant: 'up' | 'down' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ active, variant, theme }) => 
    active 
      ? (variant === 'up' ? theme.colors.green[500] : theme.colors.red[500])
      : theme.colors.gray[300]
  };
  background: ${({ active, variant, theme }) => 
    active 
      ? (variant === 'up' ? theme.colors.green[50] : theme.colors.red[50])
      : 'white'
  };
  color: ${({ active, variant, theme }) => 
    active 
      ? (variant === 'up' ? theme.colors.green[700] : theme.colors.red[700])
      : theme.colors.gray[600]
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ variant, theme }) => 
      variant === 'up' ? theme.colors.green[400] : theme.colors.red[400]
    };
    background: ${({ variant, theme }) => 
      variant === 'up' ? theme.colors.green[50] : theme.colors.red[50]
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AnswerSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const AnswerHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AnswerCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const ToggleAnswersButton = styled.button`
  color: ${({ theme }) => theme.colors.primary.sage};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: none;
  border: none;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const AnswersList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const AnswerItem = styled.div<{ isOfficial?: boolean; isAccepted?: boolean }>`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ isOfficial, isAccepted, theme }) => 
    isOfficial ? theme.colors.blue[50] :
    isAccepted ? theme.colors.green[50] :
    'white'
  };
  position: relative;

  ${({ isAccepted, theme }) => isAccepted && `
    border-left: 4px solid ${theme.colors.green[500]};
  `}

  ${({ isOfficial, theme }) => isOfficial && `
    border-left: 4px solid ${theme.colors.blue[500]};
  `}

  &:last-child {
    border-bottom: none;
  }
`;

const AnswerMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  gap: ${({ theme }) => theme.spacing[3]};
`;

const AnswerUser = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const OfficialBadge = styled.span`
  background: ${({ theme }) => theme.colors.blue[100]};
  color: ${({ theme }) => theme.colors.blue[700]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const AcceptedBadge = styled.span`
  background: ${({ theme }) => theme.colors.green[100]};
  color: ${({ theme }) => theme.colors.green[700]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const AnswerContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  white-space: pre-wrap;
`;

const AnswerActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AcceptButton = styled.button`
  background: ${({ theme }) => theme.colors.green[500]};
  color: white;
  border: none;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.green[600]};
  }
`;

const DateText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-left: auto;
`;

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onVote,
  onAnswerVote,
  onAnswerSubmit,
  onAcceptAnswer,
  showAnswerForm = true,
  isOwner = false,
  currentUserId
}) => {
  const [showAnswers, setShowAnswers] = useState(question.answers.length > 0);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (isUpvote: boolean) => {
    if (isVoting) return;
    setIsVoting(true);
    
    try {
      if (onVote) {
        onVote(question.id, isUpvote);
      } else {
        await qaService.voteQuestion(question.id, isUpvote);
      }
    } catch (error) {
      console.error('Error voting on question:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAnswerVote = async (answerId: string, isUpvote: boolean) => {
    try {
      if (onAnswerVote) {
        onAnswerVote(answerId, isUpvote);
      } else {
        await qaService.voteAnswer(answerId, isUpvote);
      }
    } catch (error) {
      console.error('Error voting on answer:', error);
    }
  };

  const handleAnswerSubmit = async (content: string) => {
    try {
      if (onAnswerSubmit) {
        onAnswerSubmit(question.id, content);
      } else {
        await qaService.createAnswer(question.id, { content });
      }
      setShowAnswerInput(false);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      if (onAcceptAnswer) {
        onAcceptAnswer(answerId);
      } else {
        await qaService.updateAnswer(answerId, { isAccepted: true });
      }
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  return (
    <CardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <QuestionHeader>
        <QuestionMeta>
          <CategoryBadge category={question.category}>
            {getCategoryLabel(question.category)}
          </CategoryBadge>
          <StatusBadge status={question.status}>
            {getStatusLabel(question.status)}
          </StatusBadge>
          <UserInfo>
            <UserAvatar>
              {question.user.name.charAt(0)}
            </UserAvatar>
            <UserName>{question.user.name}</UserName>
            <DateText>{formatDate(question.createdAt)}</DateText>
          </UserInfo>
        </QuestionMeta>

        <QuestionTitle>{question.title}</QuestionTitle>
        <QuestionContent>{question.content}</QuestionContent>

        <QuestionActions>
          <VoteSection>
            <VoteButton
              variant="up"
              onClick={() => handleVote(true)}
              disabled={isVoting}
            >
              ↑ {question.upvotes}
            </VoteButton>
            <VoteButton
              variant="down"
              onClick={() => handleVote(false)}
              disabled={isVoting}
            >
              ↓ {question.downvotes}
            </VoteButton>
          </VoteSection>

          {showAnswerForm && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowAnswerInput(!showAnswerInput)}
            >
              답변하기
            </Button>
          )}
        </QuestionActions>
      </QuestionHeader>

      {question.answerCount > 0 && (
        <AnswerSection>
          <AnswerHeader>
            <AnswerCount>답변 {question.answerCount}개</AnswerCount>
            <ToggleAnswersButton onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? '답변 숨기기' : '답변 보기'}
            </ToggleAnswersButton>
          </AnswerHeader>

          <AnimatePresence>
            {showAnswers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnswersList>
                  {question.answers.map((answer) => (
                    <AnswerItem
                      key={answer.id}
                      isOfficial={answer.isOfficial}
                      isAccepted={answer.isAccepted}
                    >
                      <AnswerMeta>
                        <AnswerUser>
                          <UserAvatar>
                            {answer.user.name.charAt(0)}
                          </UserAvatar>
                          <UserName>{answer.user.name}</UserName>
                          {answer.isOfficial && <OfficialBadge>공식답변</OfficialBadge>}
                          {answer.isAccepted && <AcceptedBadge>채택답변</AcceptedBadge>}
                        </AnswerUser>
                        <DateText>{formatDate(answer.createdAt)}</DateText>
                      </AnswerMeta>

                      <AnswerContent>{answer.content}</AnswerContent>

                      <AnswerActions>
                        <VoteSection>
                          <VoteButton
                            variant="up"
                            onClick={() => handleAnswerVote(answer.id, true)}
                          >
                            ↑ {answer.upvotes}
                          </VoteButton>
                          <VoteButton
                            variant="down"
                            onClick={() => handleAnswerVote(answer.id, false)}
                          >
                            ↓ {answer.downvotes}
                          </VoteButton>
                        </VoteSection>

                        {isOwner && !answer.isAccepted && (
                          <AcceptButton onClick={() => handleAcceptAnswer(answer.id)}>
                            채택하기
                          </AcceptButton>
                        )}
                      </AnswerActions>
                    </AnswerItem>
                  ))}
                </AnswersList>
              </motion.div>
            )}
          </AnimatePresence>
        </AnswerSection>
      )}

      <AnimatePresence>
        {showAnswerInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnswerForm
              onSubmit={handleAnswerSubmit}
              onCancel={() => setShowAnswerInput(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </CardContainer>
  );
};