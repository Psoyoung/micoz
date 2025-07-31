import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { contentService, ContentItem, ContentType, getContentTypeLabel } from '../services/contentService';
import { ContentGrid } from '../components/Content/ContentGrid';
import { SEOHead } from '../components/SEO/SEOHead';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.secondary.ivory};
  padding-top: 80px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const Title = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const Subtitle = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 600px;
  margin: 0 auto;
`;

const FilterSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const FilterTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  flex-wrap: wrap;
`;

const FilterTab = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : 'transparent'};
  color: ${({ active, theme }) => 
    active ? theme.colors.secondary.ivory : theme.colors.gray[600]};
  border: 2px solid ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ active, theme }) => 
      active ? theme.colors.secondary.ivory : theme.colors.primary.sage};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const SearchContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  padding-right: ${({ theme }) => theme.spacing[12]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  background: white;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary.sage}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.spacing[4]};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: 20px;
  pointer-events: none;
`;

const StatsSection = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[8]};
  margin: ${({ theme }) => theme.spacing[8]} 0;
  padding: ${({ theme }) => theme.spacing[6]};
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[4]};
    text-align: center;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.sage};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ContentSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[12]};
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

export const ContentHubPage: React.FC = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    editorial: 0,
    ingredient: 0,
    story: 0,
    interview: 0
  });

  const filterOptions: Array<{ id: ContentType | 'all'; label: string; icon: string }> = [
    { id: 'all', label: '전체', icon: '📚' },
    { id: 'editorial', label: '뷰티 에디토리얼', icon: '✨' },
    { id: 'ingredient', label: '성분 스토리', icon: '🧪' },
    { id: 'story', label: '사용자 스토리', icon: '💬' },
    { id: 'interview', label: '전문가 인터뷰', icon: '🎤' }
  ];

  useEffect(() => {
    loadContents();
  }, []);

  useEffect(() => {
    filterContents();
  }, [contents, activeFilter, searchQuery]);

  const loadContents = async () => {
    try {
      setLoading(true);
      const data = await contentService.getAllContent();
      const publishedContents = data.filter(content => content.status === 'published');
      setContents(publishedContents);
      
      // Calculate stats
      const newStats = {
        total: publishedContents.length,
        editorial: publishedContents.filter(c => c.type === 'editorial').length,
        ingredient: publishedContents.filter(c => c.type === 'ingredient').length,
        story: publishedContents.filter(c => c.type === 'story').length,
        interview: publishedContents.filter(c => c.type === 'interview').length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContents = () => {
    let filtered = contents;

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(content => content.type === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(query) ||
        content.excerpt.toLowerCase().includes(query) ||
        content.tags.some(tag => tag.toLowerCase().includes(query)) ||
        content.author.name.toLowerCase().includes(query)
      );
    }

    setFilteredContents(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getActiveStats = () => {
    if (activeFilter === 'all') return stats.total;
    return stats[activeFilter];
  };

  return (
    <PageContainer>
      <SEOHead 
        title="콘텐츠 허브"
        description="MICOZ의 모든 뷰티 콘텐츠를 한 곳에서 만나보세요. 뷰티 에디토리얼부터 성분 스토리, 사용자 경험담, 전문가 인터뷰까지 다양한 정보를 제공합니다."
        keywords={['뷰티콘텐츠', '에디토리얼', '성분분석', '사용후기', '전문가인터뷰', 'K뷰티정보']}
        url="https://micoz.co.kr/content"
      />
      
      <Container>
        <Header>
          <Title
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            콘텐츠 허브
          </Title>
          <Subtitle
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            뷰티 전문가들의 노하우와 실제 사용자들의 경험담을 통해<br />
            더 아름다운 당신을 발견해보세요
          </Subtitle>
        </Header>

        <StatsSection>
          <StatItem>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>전체 콘텐츠</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.editorial}</StatNumber>
            <StatLabel>에디토리얼</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.ingredient}</StatNumber>
            <StatLabel>성분 분석</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.story + stats.interview}</StatNumber>
            <StatLabel>스토리 & 인터뷰</StatLabel>
          </StatItem>
        </StatsSection>

        <FilterSection>
          <FilterTabs>
            {filterOptions.map((option) => (
              <FilterTab
                key={option.id}
                active={activeFilter === option.id}
                onClick={() => setActiveFilter(option.id)}
              >
                {option.icon} {option.label}
              </FilterTab>
            ))}
          </FilterTabs>

          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="콘텐츠 검색..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <SearchIcon>🔍</SearchIcon>
          </SearchContainer>
        </FilterSection>

        <ContentSection>
          {searchQuery || activeFilter !== 'all' ? (
            <>
              <SectionTitle>
                {searchQuery 
                  ? `"${searchQuery}" 검색 결과 (${filteredContents.length}개)`
                  : `${filterOptions.find(f => f.id === activeFilter)?.label} (${getActiveStats()}개)`
                }
              </SectionTitle>
              <ContentGrid 
                contents={filteredContents} 
                loading={loading}
                emptyMessage={
                  searchQuery 
                    ? "검색 결과가 없습니다. 다른 키워드로 검색해보세요."
                    : "해당 카테고리의 콘텐츠가 없습니다."
                }
              />
            </>
          ) : (
            <>
              <SectionTitle>최근 콘텐츠</SectionTitle>
              {loading ? (
                <LoadingMessage>콘텐츠를 불러오는 중...</LoadingMessage>
              ) : (
                <ContentGrid contents={contents} />
              )}
            </>
          )}
        </ContentSection>
      </Container>
    </PageContainer>
  );
};