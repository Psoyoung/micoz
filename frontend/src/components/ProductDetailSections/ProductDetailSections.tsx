import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface ProductDetailSectionsProps {
  description: string;
  ingredients: string[];
  usage?: string;
  category: string;
  subCategory?: string;
}

const SectionsContainer = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing[8]} 0;
`;

const TabNavigation = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background: ${({ active, theme }) => active ? theme.colors.primary.sage : 'transparent'};
  color: ${({ active, theme }) => active ? theme.colors.secondary.ivory : theme.colors.secondary.charcoal};
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ active, theme }) => 
      active ? theme.colors.primary.sage : theme.colors.gray[100]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const TabContent = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const SectionTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Description = styled.div`
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};

  p {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }
`;

const IngredientsList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const IngredientItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.primary.sage};
`;

const IngredientIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.primary.sage};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.secondary.ivory};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  flex-shrink: 0;
`;

const IngredientInfo = styled.div`
  flex: 1;
`;

const IngredientName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const IngredientDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const UsageGuide = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const UsageStep = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: flex-start;
`;

const StepNumber = styled.div`
  width: 36px;
  height: 36px;
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius.full};
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

const StepTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StepDescription = styled.div`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const SpecsTable = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SpecRow = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};

  &:last-child {
    border-bottom: none;
  }
`;

const SpecLabel = styled.div`
  flex: 1;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const SpecValue = styled.div`
  flex: 2;
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

// 성분별 설명 데이터
const ingredientDescriptions: Record<string, string> = {
  '세라마이드': '피부 장벽을 강화하고 수분 손실을 방지합니다.',
  '히알루론산': '강력한 보습 효과로 피부에 수분을 공급합니다.',
  '판테놀': '피부 진정과 재생에 도움을 주는 프로비타민 B5입니다.',
  '알로에 베라': '자연 추출물로 피부를 진정시키고 보습합니다.',
  '호호바 오일': '천연 오일로 깊은 영양과 수분을 공급합니다.',
  '올리브 오일': '항산화 성분이 풍부한 천연 오일입니다.',
  '로즈힙 오일': '비타민이 풍부하여 피부 재생에 도움을 줍니다.',
  '나이아신아마이드': '피부 톤을 개선하고 모공을 조이는 효과가 있습니다.',
  '베타글루칸': '면역력 강화와 피부 진정 효과가 있습니다.',
  '알란토인': '각질 제거와 피부 재생을 돕습니다.',
  '비타민 C': '강력한 항산화 효과로 브라이트닝에 도움을 줍니다.',
  '비타민 E': '피부를 보호하고 노화를 방지합니다.',
  '페룰산': '비타민 C의 안정성을 높이고 항산화 효과를 증진합니다.',
  '레티놀': '주름 개선과 피부 재생에 효과적인 성분입니다.',
  '스쿠알란': '가벼운 텍스처로 깊은 보습을 제공합니다.',
  '콜라겐': '피부 탄력과 수분을 유지하는데 도움을 줍니다.',
  '아데노신': '주름 개선에 도움을 주는 기능성 원료입니다.',
  '시어버터': '깊은 영양과 보습을 제공하는 천연 버터입니다.',
  'SPF 30': '자외선으로부터 피부를 보호합니다.',
  '아르간 오일': '모로코 전통 오일로 깊은 영양을 제공합니다.',
  '라벤더': '피부 진정과 함께 은은한 향을 선사합니다.',
  '코코넛 오일': '천연 보습과 항균 효과가 있습니다.',
  '베르가못': '상쾌한 시트러스 향과 기분 전환 효과가 있습니다.',
  '바닐라': '달콤하고 따뜻한 향으로 안정감을 줍니다.',
  '머스크': '은은하고 지속적인 베이스 노트입니다.',
};

// 사용법을 단계별로 파싱하는 함수
const parseUsageSteps = (usage: string, category: string, subCategory?: string): Array<{title: string, description: string}> => {
  if (!usage) return [];

  // 기본적인 사용법 단계
  const defaultSteps = [
    { title: '적당량 덜어내기', description: '손바닥에 적당량을 덜어냅니다.' },
    { title: '부드럽게 발라주기', description: '얼굴 전체에 부드럽게 발라줍니다.' },
    { title: '가볍게 두드리기', description: '손끝으로 가볍게 두드려 흡수시킵니다.' },
  ];

  // 카테고리별 맞춤 단계
  if (category === '스킨케어') {
    if (subCategory === '클렌저') {
      return [
        { title: '적당량 덜어내기', description: '손에 적당량을 덜어냅니다.' },
        { title: '거품 만들기', description: '물을 조금 넣고 거품을 충분히 냅니다.' },
        { title: '부드럽게 마사지', description: '얼굴 전체에 부드럽게 마사지합니다.' },
        { title: '미지근한 물로 헹구기', description: '미지근한 물로 깨끗하게 헹궈냅니다.' },
      ];
    } else if (subCategory === '토너') {
      return [
        { title: '화장솜에 적시기', description: '화장솜에 충분히 적십니다.' },
        { title: '안쪽에서 바깥쪽으로', description: '얼굴 중앙에서 바깥쪽으로 발라줍니다.' },
        { title: '목과 데콜테까지', description: '목과 데콜테 부분까지 발라줍니다.' },
      ];
    } else if (subCategory === '세럼') {
      return [
        { title: '2-3방울 덜어내기', description: '손바닥에 2-3방울 덜어냅니다.' },
        { title: '얼굴 전체 발라주기', description: '얼굴 전체에 부드럽게 발라줍니다.' },
        { title: '충분히 흡수시키기', description: '손바닥으로 감싸며 흡수시킵니다.' },
      ];
    }
  } else if (category === '메이크업') {
    if (subCategory === '베이스') {
      return [
        { title: '소량 덜어내기', description: '손등에 소량을 덜어냅니다.' },
        { title: '얼굴 중앙부터', description: '얼굴 중앙부터 바깥쪽으로 발라줍니다.' },
        { title: '스펀지로 마무리', description: '스펀지로 자연스럽게 블렌딩합니다.' },
      ];
    } else if (subCategory === '립') {
      return [
        { title: '입술 정리하기', description: '입술을 깨끗하게 정리합니다.' },
        { title: '중앙부터 발라주기', description: '입술 중앙부터 바깥쪽으로 발라줍니다.' },
        { title: '자연스럽게 블렌딩', description: '입술을 다물어 자연스럽게 블렌딩합니다.' },
      ];
    }
  }

  return defaultSteps;
};

export const ProductDetailSections: React.FC<ProductDetailSectionsProps> = ({
  description,
  ingredients,
  usage,
  category,
  subCategory,
}) => {
  const [activeTab, setActiveTab] = useState('description');

  const usageSteps = parseUsageSteps(usage || '', category, subCategory);

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3 }
    })
  };

  return (
    <SectionsContainer>
      <TabNavigation>
        <TabButton 
          active={activeTab === 'description'}
          onClick={() => setActiveTab('description')}
        >
          제품 설명
        </TabButton>
        <TabButton 
          active={activeTab === 'ingredients'}
          onClick={() => setActiveTab('ingredients')}
        >
          성분 정보
        </TabButton>
        <TabButton 
          active={activeTab === 'usage'}
          onClick={() => setActiveTab('usage')}
        >
          사용법
        </TabButton>
        <TabButton 
          active={activeTab === 'specs'}
          onClick={() => setActiveTab('specs')}
        >
          상품 정보
        </TabButton>
      </TabNavigation>

      <TabContent
        key={activeTab}
        variants={tabVariants}
        initial="hidden"
        animate="visible"
      >
        {activeTab === 'description' && (
          <div>
            <SectionTitle>제품 설명</SectionTitle>
            <Description>
              <p>{description}</p>
            </Description>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div>
            <SectionTitle>주요 성분</SectionTitle>
            <IngredientsList>
              {ingredients.map((ingredient, index) => (
                <IngredientItem
                  key={ingredient}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <IngredientIcon>
                    {ingredient.charAt(0)}
                  </IngredientIcon>
                  <IngredientInfo>
                    <IngredientName>{ingredient}</IngredientName>
                    <IngredientDescription>
                      {ingredientDescriptions[ingredient] || '피부에 도움을 주는 성분입니다.'}
                    </IngredientDescription>
                  </IngredientInfo>
                </IngredientItem>
              ))}
            </IngredientsList>
          </div>
        )}

        {activeTab === 'usage' && (
          <div>
            <SectionTitle>사용법</SectionTitle>
            <UsageGuide>
              {usageSteps.map((step, index) => (
                <UsageStep
                  key={index}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <StepNumber>{index + 1}</StepNumber>
                  <StepContent>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </StepContent>
                </UsageStep>
              ))}
            </UsageGuide>
            {usage && (
              <Description style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                <strong>상세 사용법:</strong>
                <p>{usage}</p>
              </Description>
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div>
            <SectionTitle>상품 정보</SectionTitle>
            <SpecsTable>
              <SpecRow>
                <SpecLabel>카테고리</SpecLabel>
                <SpecValue>{category}{subCategory && ` > ${subCategory}`}</SpecValue>
              </SpecRow>
              <SpecRow>
                <SpecLabel>브랜드</SpecLabel>
                <SpecValue>MICOZ</SpecValue>
              </SpecRow>
              <SpecRow>
                <SpecLabel>제조국</SpecLabel>
                <SpecValue>대한민국</SpecValue>
              </SpecRow>
              <SpecRow>
                <SpecLabel>주요 성분</SpecLabel>
                <SpecValue>{ingredients.slice(0, 3).join(', ')}{ingredients.length > 3 && ' 외'}</SpecValue>
              </SpecRow>
              <SpecRow>
                <SpecLabel>사용 기한</SpecLabel>
                <SpecValue>제조일로부터 36개월</SpecValue>
              </SpecRow>
            </SpecsTable>
          </div>
        )}
      </TabContent>
    </SectionsContainer>
  );
};