import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { contentService, ContentItem, ContentType } from '../../services/contentService';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.gray[50]};
  padding-top: 80px;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const CreateButton = styled.button`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
    transform: translateY(-2px);
  }

  &::before {
    content: '+';
    font-size: 18px;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing[4]};
`;

const FilterTab = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[600]};
  cursor: pointer;
  position: relative;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
  }

  ${({ active, theme }) => active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -16px;
      left: 0;
      right: 0;
      height: 2px;
      background: ${theme.colors.primary.sage};
    }
  `}
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
`;

const ContentCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.slow};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
`;

const ContentImage = styled.div<{ image?: string }>`
  width: 100%;
  height: 200px;
  background: ${({ image, theme }) => 
    image ? `url(${image}) center/cover` : theme.colors.gray[200]};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${({ theme }) => theme.colors.primary.sage}10 0%,
      ${({ theme }) => theme.colors.primary.deepForest}05 100%);
  }
`;

const ContentInfo = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const ContentType = styled.span<{ type: string }>`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  
  ${({ type, theme }) => {
    const colors = {
      editorial: { bg: theme.colors.purple[100], text: theme.colors.purple[800] },
      ingredient: { bg: theme.colors.green[100], text: theme.colors.green[800] },
      story: { bg: theme.colors.blue[100], text: theme.colors.blue[800] },
      interview: { bg: theme.colors.orange[100], text: theme.colors.orange[800] }
    };
    const color = colors[type as keyof typeof colors] || colors.editorial;
    return `
      background: ${color.bg};
      color: ${color.text};
    `;
  }}
`;

const ContentTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const ContentExcerpt = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ContentMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const ContentDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ContentActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  padding: ${({ theme }) => theme.spacing[2]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ variant, theme }) => {
    if (variant === 'delete') {
      return `
        background: ${theme.colors.red[100]};
        color: ${theme.colors.red[600]};
        &:hover {
          background: ${theme.colors.red[200]};
        }
      `;
    }
    return `
      background: ${theme.colors.gray[100]};
      color: ${theme.colors.gray[600]};
      &:hover {
        background: ${theme.colors.gray[200]};
      }
    `;
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export const ContentManagementPage: React.FC = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const contentTypes: Array<{ id: ContentType | 'all'; label: string }> = [
    { id: 'all', label: '전체' },
    { id: 'editorial', label: '뷰티 에디토리얼' },
    { id: 'ingredient', label: '성분 스토리' },
    { id: 'story', label: '사용자 스토리' },
    { id: 'interview', label: '전문가 인터뷰' }
  ];

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      const data = await contentService.getAllContent();
      setContents(data);
    } catch (error) {
      console.error('Failed to load contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (window.confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
      try {
        await contentService.deleteContent(id);
        setContents(contents.filter(content => content.id !== id));
      } catch (error) {
        console.error('Failed to delete content:', error);
      }
    }
  };

  const filteredContents = activeFilter === 'all' 
    ? contents 
    : contents.filter(content => content.type === activeFilter);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getTypeLabel = (type: ContentType): string => {
    const labels = {
      editorial: '뷰티 에디토리얼',
      ingredient: '성분 스토리',
      story: '사용자 스토리',
      interview: '전문가 인터뷰'
    };
    return labels[type];
  };

  return (
    <PageContainer>
      <Container>
        <Header>
          <Title>콘텐츠 관리</Title>
          <CreateButton onClick={() => window.open('/admin/content/create', '_blank')}>
            새 콘텐츠 작성
          </CreateButton>
        </Header>

        <FilterTabs>
          {contentTypes.map((type) => (
            <FilterTab
              key={type.id}
              active={activeFilter === type.id}
              onClick={() => setActiveFilter(type.id)}
            >
              {type.label}
            </FilterTab>
          ))}
        </FilterTabs>

        {loading ? (
          <EmptyState>
            <EmptyIcon>⏳</EmptyIcon>
            <EmptyTitle>콘텐츠를 불러오는 중...</EmptyTitle>
          </EmptyState>
        ) : filteredContents.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📝</EmptyIcon>
            <EmptyTitle>콘텐츠가 없습니다</EmptyTitle>
            <EmptyText>새로운 콘텐츠를 작성해보세요.</EmptyText>
          </EmptyState>
        ) : (
          <ContentGrid>
            <AnimatePresence>
              {filteredContents.map((content, index) => (
                <ContentCard
                  key={content.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ContentImage image={content.featuredImage} />
                  <ContentInfo>
                    <ContentType type={content.type}>
                      {getTypeLabel(content.type)}
                    </ContentType>
                    <ContentTitle>{content.title}</ContentTitle>
                    <ContentExcerpt>{content.excerpt}</ContentExcerpt>
                    <ContentMeta>
                      <ContentDate>{formatDate(content.createdAt)}</ContentDate>
                      <ContentActions>
                        <ActionButton 
                          onClick={() => window.open(`/admin/content/edit/${content.id}`, '_blank')}
                          title="수정"
                        >
                          ✏️
                        </ActionButton>
                        <ActionButton 
                          variant="delete"
                          onClick={() => handleDeleteContent(content.id)}
                          title="삭제"
                        >
                          🗑️
                        </ActionButton>
                      </ContentActions>
                    </ContentMeta>
                  </ContentInfo>
                </ContentCard>
              ))}
            </AnimatePresence>
          </ContentGrid>
        )}
      </Container>
    </PageContainer>
  );
};