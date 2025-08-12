import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button/Button';
import { Comment, formatDate } from '../../services/commentsService';

interface CommentItemProps {
  comment: Comment;
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  maxDepth?: number;
  currentDepth?: number;
}

const CommentContainer = styled(motion.div)<{ depth: number }>`
  margin-left: ${({ depth, theme }) => depth > 0 ? theme.spacing[8] : 0};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin-left: ${({ depth, theme }) => depth > 0 ? theme.spacing[4] : 0};
  }
`;

const CommentContent = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
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
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const CommentDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const UpdatedIndicator = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-style: italic;
`;

const CommentActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
    background: ${({ theme }) => theme.colors.primary.sage}10;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CommentBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

const CommentText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
  white-space: pre-wrap;
`;

const ReplySection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[25]};
`;

const ReplyForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ReplyTextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: inherit;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const EditForm = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.yellow[50]};
  border-top: 1px solid ${({ theme }) => theme.colors.yellow[200]};
`;

const EditTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.yellow[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-family: inherit;
  resize: vertical;
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.yellow[500]};
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: flex-end;
`;

const RepliesContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  maxDepth = 3,
  currentDepth = 0
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;
    
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || !onEdit) return;
    
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setShowEditForm(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const canShowReplyButton = currentDepth < maxDepth && onReply;

  return (
    <CommentContainer
      depth={currentDepth}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <CommentContent>
        <CommentHeader>
          <UserInfo>
            <UserAvatar>
              {comment.user.name.charAt(0)}
            </UserAvatar>
            <div>
              <UserName>{comment.user.name}</UserName>
              <div>
                <CommentDate>{formatDate(comment.createdAt)}</CommentDate>
                {comment.updatedAt && (
                  <UpdatedIndicator> (수정됨)</UpdatedIndicator>
                )}
              </div>
            </div>
          </UserInfo>
          
          <CommentActions>
            {canShowReplyButton && (
              <ActionButton onClick={() => setShowReplyForm(!showReplyForm)}>
                답글
              </ActionButton>
            )}
            {canEdit && (
              <ActionButton onClick={() => setShowEditForm(!showEditForm)}>
                수정
              </ActionButton>
            )}
            {canDelete && (
              <ActionButton onClick={handleDelete}>
                삭제
              </ActionButton>
            )}
          </CommentActions>
        </CommentHeader>

        {!showEditForm ? (
          <CommentBody>
            <CommentText>{comment.content}</CommentText>
          </CommentBody>
        ) : (
          <EditForm>
            <EditTextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="댓글을 수정해주세요..."
            />
            <FormActions>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setShowEditForm(false);
                  setEditContent(comment.content);
                }}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleEdit}
                disabled={isSubmitting || !editContent.trim()}
              >
                {isSubmitting ? '수정 중...' : '수정'}
              </Button>
            </FormActions>
          </EditForm>
        )}

        <AnimatePresence>
          {showReplyForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ReplySection>
                <ReplyForm>
                  <ReplyTextArea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 작성해주세요..."
                    rows={3}
                  />
                  <FormActions>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent('');
                      }}
                      disabled={isSubmitting}
                    >
                      취소
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleReply}
                      disabled={isSubmitting || !replyContent.trim()}
                    >
                      {isSubmitting ? '등록 중...' : '답글 등록'}
                    </Button>
                  </FormActions>
                </ReplyForm>
              </ReplySection>
            </motion.div>
          )}
        </AnimatePresence>
      </CommentContent>

      {comment.replies && comment.replies.length > 0 && (
        <RepliesContainer>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
              maxDepth={maxDepth}
              currentDepth={currentDepth + 1}
            />
          ))}
        </RepliesContainer>
      )}
    </CommentContainer>
  );
};