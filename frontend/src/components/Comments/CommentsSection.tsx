import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button/Button';
import { CommentItem } from './CommentItem';
import { Comment, commentsService } from '../../services/commentsService';

interface CommentsSectionProps {
  reviewId: string;
  currentUserId?: string;
  initialCommentCount?: number;
}

const Container = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &::before {
    content: '💬';
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }
`;

const CommentCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const SortOptions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SortButton = styled.button<{ active: boolean }>`
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : 'transparent'
  };
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.gray[600]
  };
  border: 1px solid ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[300]
  };
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
    background: ${({ active, theme }) => 
      active ? theme.colors.primary.deepForest : theme.colors.primary.sage + '10'
    };
  }
`;

const CommentForm = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FormTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-family: inherit;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  justify-content: flex-end;
`;

const CommentsList = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
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
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const EmptyTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const EmptyDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const PaginationInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const LoginPrompt = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.blue[50]};
  border: 1px solid ${({ theme }) => theme.colors.blue[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.blue[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  reviewId,
  currentUserId,
  initialCommentCount = 0
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialCommentCount);

  const limit = 10;

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentsService.getReviewComments(
        reviewId,
        currentPage,
        limit,
        sortOrder
      );
      
      setComments(response.comments);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [reviewId, currentPage, sortOrder]);

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !currentUserId) return;
    
    setIsSubmitting(true);
    try {
      await commentsService.addReviewComment(reviewId, commentContent.trim());
      setCommentContent('');
      setCurrentPage(1); // Go to first page to see new comment
      loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('댓글 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!currentUserId) return;
    
    try {
      await commentsService.addReviewComment(reviewId, content, parentId);
      loadComments(); // Reload to show new reply
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('답글 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await commentsService.updateReviewComment(commentId, content);
      loadComments(); // Reload to show updated comment
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('댓글 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentsService.deleteReviewComment(commentId);
      loadComments(); // Reload to remove deleted comment
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>댓글</Title>
          <CommentCount>{totalCount}개</CommentCount>
        </div>
        <SortOptions>
          <SortButton
            active={sortOrder === 'asc'}
            onClick={() => setSortOrder('asc')}
          >
            오래된순
          </SortButton>
          <SortButton
            active={sortOrder === 'desc'}
            onClick={() => setSortOrder('desc')}
          >
            최신순
          </SortButton>
        </SortOptions>
      </Header>

      {currentUserId ? (
        <CommentForm>
          <FormTitle>댓글 작성</FormTitle>
          <TextArea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="이 리뷰에 대한 댓글을 작성해주세요..."
            rows={4}
          />
          <FormActions>
            <Button
              variant="secondary"
              onClick={() => setCommentContent('')}
              disabled={isSubmitting || !commentContent.trim()}
            >
              초기화
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitComment}
              disabled={isSubmitting || !commentContent.trim()}
            >
              {isSubmitting ? '등록 중...' : '댓글 등록'}
            </Button>
          </FormActions>
        </CommentForm>
      ) : (
        <CommentForm>
          <LoginPrompt>
            댓글을 작성하려면 로그인이 필요합니다.
          </LoginPrompt>
        </CommentForm>
      )}

      <CommentsList>
        {loading ? (
          <LoadingSpinner>
            댓글을 불러오는 중...
          </LoadingSpinner>
        ) : comments.length > 0 ? (
          <AnimatePresence>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={currentUserId ? handleReply : undefined}
                onEdit={currentUserId ? handleEdit : undefined}
                onDelete={currentUserId ? handleDelete : undefined}
                canEdit={currentUserId === comment.user.name} // Note: This is a simplified check
                canDelete={currentUserId === comment.user.name} // Note: This is a simplified check
              />
            ))}
          </AnimatePresence>
        ) : (
          <EmptyState>
            <EmptyIcon>💭</EmptyIcon>
            <EmptyTitle>아직 댓글이 없습니다</EmptyTitle>
            <EmptyDescription>
              이 리뷰에 대한 첫 번째 댓글을 작성해보세요!
            </EmptyDescription>
          </EmptyState>
        )}
      </CommentsList>

      {totalPages > 1 && (
        <Pagination>
          <Button
            variant="secondary"
            size="sm"
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
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </Pagination>
      )}
    </Container>
  );
};