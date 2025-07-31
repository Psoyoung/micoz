import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { contentService, ContentItem, getContentTypeLabel, formatReadTime, formatViewCount } from '../services/contentService';
import { SEOHead, generateSEOForContent } from '../components/SEO/SEOHead';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.secondary.ivory};
  padding-top: 80px;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.sage};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
    transform: translateX(-4px);
  }

  &::before {
    content: '←';
    font-size: 18px;
  }
`;

const Article = styled(motion.article)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  overflow: hidden;
`;

const FeaturedImage = styled.div<{ image?: string }>`
  width: 100%;
  height: 400px;
  background: ${({ image, theme }) => 
    image ? `url(${image}) center/cover` : theme.colors.gray[200]};
  position: relative;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 250px;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(transparent, rgba(0,0,0,0.3));
  }
`;

const ContentHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  }
`;

const ContentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  flex-wrap: wrap;
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

const MetaInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const Excerpt = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const AuthorAvatar = styled.div<{ image?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ image, theme }) => 
    image ? `url(${image}) center/cover` : theme.colors.gray[300]};
  flex-shrink: 0;
`;

const AuthorDetails = styled.div`
  flex: 1;
`;

const AuthorName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const AuthorBio = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ContentBody = styled.div`
  padding: 0 ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[6]};
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
    color: ${({ theme }) => theme.colors.primary.deepForest};
    margin: ${({ theme }) => theme.spacing[8]} 0 ${({ theme }) => theme.spacing[4]};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  }

  h1 { font-size: ${({ theme }) => theme.typography.fontSize['2xl']}; }
  h2 { font-size: ${({ theme }) => theme.typography.fontSize.xl}; }
  h3 { font-size: ${({ theme }) => theme.typography.fontSize.lg}; }

  p {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    color: ${({ theme }) => theme.colors.secondary.charcoal};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }

  ul, ol {
    margin: ${({ theme }) => theme.spacing[6]} 0;
    padding-left: ${({ theme }) => theme.spacing[6]};
  }

  li {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    color: ${({ theme }) => theme.colors.secondary.charcoal};
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }

  blockquote {
    border-left: 4px solid ${({ theme }) => theme.colors.primary.sage};
    padding-left: ${({ theme }) => theme.spacing[4]};
    margin: ${({ theme }) => theme.spacing[6]} 0;
    font-style: italic;
    color: ${({ theme }) => theme.colors.gray[700]};
  }

  strong {
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const TagsSection = styled.div`
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[8]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  }
`;

const TagsTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Tag = styled.span`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.primary.sage}15;
  color: ${({ theme }) => theme.colors.primary.sage};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &::before {
    content: '#';
    opacity: 0.7;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[8]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const LikeButton = styled.button<{ liked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ liked, theme }) => 
    liked ? theme.colors.red[100] : theme.colors.gray[100]};
  color: ${({ liked, theme }) => 
    liked ? theme.colors.red[600] : theme.colors.gray[600]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
  }

  &::before {
    content: ${({ liked }) => liked ? '"❤️"' : '"🤍"'};
    font-size: 16px;
  }
`;

const ShareButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
    transform: translateY(-2px);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  font-size: 48px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.red[600]};
  background: ${({ theme }) => theme.colors.red[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin: ${({ theme }) => theme.spacing[4]} 0;
`;

export const ContentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (slug) {
      loadContent(slug);
    }
  }, [slug]);

  const loadContent = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentService.getContentBySlug(slug);
      if (data) {
        setContent(data);
      } else {
        setError('콘텐츠를 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('콘텐츠를 불러오는데 실패했습니다.');
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!content) return;
    
    try {
      const newLikeCount = await contentService.toggleLike(content.id);
      setContent({ ...content, likes: newLikeCount });
      setLiked(!liked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share && content) {
      navigator.share({
        title: content.title,
        text: content.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다.');
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <PageContainer>
        <Container>
          <LoadingSpinner>⏳</LoadingSpinner>
        </Container>
      </PageContainer>
    );
  }

  if (error || !content) {
    return (
      <PageContainer>
        <Container>
          <BackButton onClick={() => navigate(-1)}>
            뒤로 가기
          </BackButton>
          <ErrorMessage>{error || '콘텐츠를 찾을 수 없습니다.'}</ErrorMessage>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SEOHead {...generateSEOForContent({
        title: content.title,
        excerpt: content.excerpt,
        slug: content.slug,
        type: content.type,
        author: content.author,
        publishedAt: content.publishedAt,
        updatedAt: content.updatedAt,
        featuredImage: content.featuredImage,
        tags: content.tags
      })} />
      <Container>
        <BackButton onClick={() => navigate(-1)}>
          뒤로 가기
        </BackButton>

        <Article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {content.featuredImage && (
            <FeaturedImage image={content.featuredImage} />
          )}

          <ContentHeader>
            <ContentMeta>
              <ContentType type={content.type}>
                {getContentTypeLabel(content.type)}
              </ContentType>
              <MetaInfo>📅 {formatDate(content.publishedAt || content.createdAt)}</MetaInfo>
              <MetaInfo>⏱️ {formatReadTime(content.readTime || 5)}</MetaInfo>
              <MetaInfo>👁️ {formatViewCount(content.views || 0)}</MetaInfo>
            </ContentMeta>

            <Title>{content.title}</Title>
            <Excerpt>{content.excerpt}</Excerpt>

            <AuthorInfo>
              <AuthorAvatar image={content.author.avatar} />
              <AuthorDetails>
                <AuthorName>{content.author.name}</AuthorName>
                <AuthorBio>
                  {content.author.credentials || content.author.bio}
                </AuthorBio>
              </AuthorDetails>
            </AuthorInfo>
          </ContentHeader>

          <ContentBody
            dangerouslySetInnerHTML={{ 
              __html: content.content.replace(/\n/g, '<br />') 
            }}
          />

          {content.tags.length > 0 && (
            <TagsSection>
              <TagsTitle>관련 태그</TagsTitle>
              <TagsList>
                {content.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </TagsList>
            </TagsSection>
          )}

          <ActionBar>
            <LikeButton liked={liked} onClick={handleLike}>
              좋아요 {content.likes || 0}
            </LikeButton>
            <ShareButton onClick={handleShare}>
              공유하기
            </ShareButton>
          </ActionBar>
        </Article>
      </Container>
    </PageContainer>
  );
};