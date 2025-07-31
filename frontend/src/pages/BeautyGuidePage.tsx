import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
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
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Tab = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[600]};
  cursor: pointer;
  position: relative;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
  }

  ${({ active, theme }) => active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: ${theme.colors.primary.sage};
    }
  `}

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const ContentArea = styled(motion.div)`
  min-height: 600px;
`;

const GuideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const GuideCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.slow};

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
`;

const GuideImage = styled.div<{ image: string }>`
  width: 100%;
  height: 200px;
  background: url(${({ image }) => image}) center/cover;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${({ theme }) => theme.colors.primary.sage}20 0%,
      ${({ theme }) => theme.colors.primary.deepForest}10 100%);
  }
`;

const GuideContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const GuideTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const GuideDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ReadMoreButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.sage};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
    transform: translateX(4px);
  }

  &::after {
    content: '→';
    transition: transform ${({ theme }) => theme.transitions.fast};
  }

  &:hover::after {
    transform: translateX(4px);
  }
`;

const DetailedGuide = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const StepContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const StepTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const StepItem = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.primary.sage};
`;

const StepNumber = styled.div`
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.primary.sage};
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepItemTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StepItemDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const TipBox = styled(motion.div)`
  background: ${({ theme }) => theme.colors.primary.sage}10;
  border: 1px solid ${({ theme }) => theme.colors.primary.sage}30;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const TipTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &::before {
    content: '💡';
  }
`;

const TipContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

type GuideType = 'skincare' | 'makeup' | 'ingredients' | 'routine';

interface Guide {
  id: string;
  title: string;
  description: string;
  image: string;
  type: GuideType;
  steps?: Array<{
    title: string;
    description: string;
  }>;
  tips?: string[];
}

export const BeautyGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GuideType>('skincare');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const tabs = [
    { id: 'skincare' as GuideType, label: '스킨케어' },
    { id: 'makeup' as GuideType, label: '메이크업' },
    { id: 'ingredients' as GuideType, label: '성분 가이드' },
    { id: 'routine' as GuideType, label: '루틴 추천' }
  ];

  const guides: Guide[] = [
    // Skincare guides
    {
      id: 'double-cleansing',
      title: '이중 세안의 모든 것',
      description: '완벽한 이중 세안으로 깨끗하고 건강한 피부를 만들어보세요. 올바른 순서와 방법을 알려드립니다.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
      type: 'skincare',
      steps: [
        {
          title: '오일 클렌저로 1차 세안',
          description: '메이크업과 자외선 차단제, 과도한 피지를 부드럽게 녹여 제거합니다.'
        },
        {
          title: '폼 클렌저로 2차 세안',
          description: '남은 불순물과 오일 클렌저 잔여물을 깔끔하게 씻어냅니다.'
        },
        {
          title: '미지근한 물로 마무리',
          description: '너무 뜨거운 물은 피부를 건조하게 만들 수 있으니 미지근한 물로 헹궈주세요.'
        }
      ],
      tips: [
        '오일 클렌저는 마른 손에 발라주세요',
        '거품은 풍성하게 만들어 피부에 마찰을 줄여주세요',
        '세안 후 5분 이내에 스킨케어를 시작하세요'
      ]
    },
    {
      id: 'vitamin-c-guide',
      title: '비타민C 제대로 사용하기',
      description: '비타민C의 효과를 최대화하는 사용법과 주의사항을 알아보세요.',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
      type: 'skincare',
      steps: [
        {
          title: '아침 사용 권장',
          description: '비타민C는 아침에 사용하여 하루 종일 항산화 효과를 누리세요.'
        },
        {
          title: '단계적 농도 증가',
          description: '처음에는 낮은 농도부터 시작하여 점차 높은 농도로 올려가세요.'
        },
        {
          title: '자외선 차단제 필수',
          description: '비타민C 사용 후에는 반드시 자외선 차단제를 발라주세요.'
        }
      ]
    },
    // Makeup guides
    {
      id: 'natural-makeup',
      title: '자연스러운 데일리 메이크업',
      description: '매일 할 수 있는 자연스럽고 깔끔한 메이크업 방법을 소개합니다.',
      image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
      type: 'makeup',
      steps: [
        {
          title: '베이스 메이크업',
          description: '프라이머 → 파운데이션 → 컨실러 순으로 얇게 발라주세요.'
        },
        {
          title: '포인트 메이크업',
          description: '아이브로우와 립 컬러로 자연스러운 생기를 연출하세요.'
        },
        {
          title: '마무리',
          description: '세팅 파우더로 메이크업을 고정해주세요.'
        }
      ]
    },
    // Ingredients guides
    {
      id: 'retinol-guide',
      title: '레티놀 사용 가이드',
      description: '안티에이징의 대표 성분 레티놀, 올바른 사용법을 알려드립니다.',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
      type: 'ingredients',
      steps: [
        {
          title: '밤에만 사용',
          description: '레티놀은 자외선에 민감하므로 반드시 밤에만 사용하세요.'
        },
        {
          title: '소량부터 시작',
          description: '쌀알 크기 정도의 소량으로 시작하여 점차 늘려가세요.'
        },
        {
          title: '보습 강화',
          description: '레티놀 사용 시에는 보습제를 충분히 발라주세요.'
        }
      ]
    },
    // Routine guides
    {
      id: 'morning-routine',
      title: '완벽한 모닝 스킨케어 루틴',
      description: '하루를 시작하는 모닝 스킨케어 루틴으로 건강한 피부를 유지하세요.',
      image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
      type: 'routine',
      steps: [
        {
          title: '세안',
          description: '순한 폼 클렌저로 밤사이 쌓인 노폐물을 제거합니다.'
        },
        {
          title: '토너',
          description: '수분 공급과 다음 단계 제품의 흡수를 도와줍니다.'
        },
        {
          title: '세럼',
          description: '비타민C 세럼으로 항산화와 브라이트닝 효과를 얻으세요.'
        },
        {
          title: '보습제',
          description: '피부 타입에 맞는 보습제로 수분을 보충합니다.'
        },
        {
          title: '자외선 차단제',
          description: 'SPF 30 이상의 자외선 차단제로 피부를 보호하세요.'
        }
      ]
    }
  ];

  const filteredGuides = guides.filter(guide => guide.type === activeTab);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  };

  return (
    <PageContainer>
      <SEOHead 
        title="뷰티 가이드"
        description="전문가의 노하우로 완성하는 아름다운 일상. 스킨케어, 메이크업, 성분 가이드, 루틴 추천까지 모든 뷰티 정보를 한 곳에서 만나보세요."
        keywords={['뷰티가이드', '스킨케어', '메이크업', '성분가이드', '루틴추천', '뷰티팁']}
        url="https://micoz.co.kr/beauty-guide"
      />
      <Container>
        <Header>
          <Title
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            뷰티 가이드
          </Title>
          <Subtitle
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            전문가의 노하우로 완성하는 아름다운 일상
          </Subtitle>
        </Header>

        <TabContainer>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedGuide(null);
              }}
            >
              {tab.label}
            </Tab>
          ))}
        </TabContainer>

        <AnimatePresence mode="wait">
          {selectedGuide ? (
            <DetailedGuide
              key="detailed"
              {...fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <button
                onClick={() => setSelectedGuide(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#68A47F',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  fontSize: '14px'
                }}
              >
                ← 목록으로 돌아가기
              </button>
              
              <StepContainer>
                <StepTitle>{selectedGuide.title}</StepTitle>
                <StepList>
                  {selectedGuide.steps?.map((step, index) => (
                    <StepItem
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <StepNumber>{index + 1}</StepNumber>
                      <StepContent>
                        <StepItemTitle>{step.title}</StepItemTitle>
                        <StepItemDescription>{step.description}</StepItemDescription>
                      </StepContent>
                    </StepItem>
                  ))}
                </StepList>
              </StepContainer>

              {selectedGuide.tips && (
                <TipBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <TipTitle>전문가 팁</TipTitle>
                  <TipContent>
                    {selectedGuide.tips.map((tip, index) => (
                      <span key={index}>
                        • {tip}
                        {index < selectedGuide.tips!.length - 1 && <br />}
                      </span>
                    ))}
                  </TipContent>
                </TipBox>
              )}
            </DetailedGuide>
          ) : (
            <ContentArea
              key="grid"
              {...fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <GuideGrid>
                {filteredGuides.map((guide, index) => (
                  <GuideCard
                    key={guide.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <GuideImage image={guide.image} />
                    <GuideContent>
                      <GuideTitle>{guide.title}</GuideTitle>
                      <GuideDescription>{guide.description}</GuideDescription>
                      <ReadMoreButton onClick={() => setSelectedGuide(guide)}>
                        자세히 보기
                      </ReadMoreButton>
                    </GuideContent>
                  </GuideCard>
                ))}
              </GuideGrid>
            </ContentArea>
          )}
        </AnimatePresence>
      </Container>
    </PageContainer>
  );
};