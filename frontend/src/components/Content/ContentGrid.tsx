import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ContentItem, getContentTypeLabel, formatReadTime, formatViewCount } from '../../services/contentService';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const ContentCard = styled(motion.article)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.slow};
  cursor: pointer;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
`;

const CardImage = styled.div<{ image?: string }>`
  width: 100%;
  height: 220px;
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

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ContentType = styled.span<{ type: string }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  
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

const CardMetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardExcerpt = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  gap: ${({ theme }) => theme.spacing[4]};
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
`;

const AuthorAvatar = styled.div<{ image?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ image, theme }) => 
    image ? `url(${image}) center/cover` : theme.colors.gray[300]};
  flex-shrink: 0;
`;

const AuthorName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const PublishDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[3]};
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

const EmptyState = styled.div`
  grid-column: 1 / -1;
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

interface ContentGridProps {
  contents: ContentItem[];
  loading?: boolean;
  emptyMessage?: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({ 
  contents, 
  loading = false, 
  emptyMessage = "콘텐츠가 없습니다." 
}) => {
  const navigate = useNavigate();

  const handleContentClick = (content: ContentItem) => {
    navigate(`/content/${content.slug}`);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <Grid>
        {[...Array(6)].map((_, index) => (
          <ContentCard
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <CardImage />
            <CardContent>
              <CardMeta>
                <div style={{ width: 80, height: 20, background: '#e5e7eb', borderRadius: 12 }} />
                <div style={{ width: 60, height: 16, background: '#e5e7eb', borderRadius: 8 }} />
              </CardMeta>
              <div style={{ width: '100%', height: 24, background: '#e5e7eb', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: '80%', height: 16, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '60%', height: 16, background: '#e5e7eb', borderRadius: 4 }} />
            </CardContent>
          </ContentCard>
        ))}
      </Grid>
    );
  }

  if (contents.length === 0) {
    return (
      <Grid>
        <EmptyState>
          <EmptyIcon>📝</EmptyIcon>
          <EmptyTitle>콘텐츠가 없습니다</EmptyTitle>
          <EmptyText>{emptyMessage}</EmptyText>
        </EmptyState>
      </Grid>
    );
  }

  return (
    <Grid>
      {contents.map((content, index) => (
        <ContentCard
          key={content.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          onClick={() => handleContentClick(content)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {content.featuredImage && (
            <CardImage image={content.featuredImage} />
          )}
          
          <CardContent>
            <CardMeta>
              <ContentType type={content.type}>
                {getContentTypeLabel(content.type)}
              </ContentType>
              <CardMetaInfo>
                <MetaItem>⏱️ {formatReadTime(content.readTime || 5)}</MetaItem>
                <MetaItem>👁️ {formatViewCount(content.views || 0)}</MetaItem>
              </CardMetaInfo>
            </CardMeta>

            <CardTitle>{content.title}</CardTitle>
            <CardExcerpt>{content.excerpt}</CardExcerpt>

            {content.tags.length > 0 && (
              <TagsList>
                {content.tags.slice(0, 3).map((tag, tagIndex) => (
                  <Tag key={tagIndex}>{tag}</Tag>
                ))}
                {content.tags.length > 3 && (
                  <Tag>+{content.tags.length - 3}</Tag>
                )}
              </TagsList>
            )}

            <CardFooter>
              <AuthorInfo>
                <AuthorAvatar image={content.author.avatar} />
                <AuthorName>{content.author.name}</AuthorName>
              </AuthorInfo>
              <PublishDate>
                {formatDate(content.publishedAt || content.createdAt)}
              </PublishDate>
            </CardFooter>
          </CardContent>
        </ContentCard>
      ))}
    </Grid>
  );
};