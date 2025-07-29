import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button';

export interface BrandStoryPreviewProps {
  className?: string;
}

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing[20]} 0;
  background: linear-gradient(135deg,
    ${({ theme }) => theme.colors.secondary.warmBeige} 0%,
    ${({ theme }) => theme.colors.primary.softMint}30 100%
  );

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]} 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: ${({ theme }) => theme.grid.container};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[16]};
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    gap: ${({ theme }) => theme.spacing[12]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[8]};
    text-align: center;
  }
`;

const TextContent = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    order: 2;
  }
`;

const SectionTitle = styled(motion.h2)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const StoryText = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }
`;

const HighlightText = styled.span`
  color: ${({ theme }) => theme.colors.primary.sage};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ValuesList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: ${({ theme }) => theme.spacing[8]} 0;
`;

const ValueItem = styled(motion.li)`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  color: ${({ theme }) => theme.colors.secondary.charcoal};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: center;
    text-align: left;
  }
`;

const ValueIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary.sage};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;

  &::after {
    content: '✓';
    color: ${({ theme }) => theme.colors.secondary.ivory};
    font-size: 14px;
    font-weight: bold;
  }
`;

const ValueText = styled.div`
  flex: 1;
`;

const ValueTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ValueDescription = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const CTASection = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const VisualContent = styled.div`
  position: relative;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    order: 1;
  }
`;

const ImageContainer = styled(motion.div)`
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const MainImage = styled.img`
  width: 100%;
  height: 500px;
  object-fit: cover;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 300px;
  }
`;

const FloatingCard = styled(motion.div)`
  position: absolute;
  bottom: -40px;
  right: -40px;
  background: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  backdrop-filter: blur(10px);
  max-width: 250px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    bottom: -20px;
    right: -20px;
    padding: ${({ theme }) => theme.spacing[4]};
    max-width: 200px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: static;
    margin-top: ${({ theme }) => theme.spacing[4]};
    max-width: none;
  }
`;

const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const CardText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
`;

const brandValues = [
  {
    title: '자연 친화적',
    description: '지속 가능한 원료와 친환경 패키징 사용',
  },
  {
    title: '과학적 검증',
    description: '철저한 연구와 테스트를 통한 제품 개발',
  },
  {
    title: '개인 맞춤',
    description: '각자의 고유한 아름다움을 위한 솔루션 제공',
  },
];

export const BrandStoryPreview: React.FC<BrandStoryPreviewProps> = ({ className }) => {
  return (
    <SectionContainer className={className}>
      <ContentWrapper>
        <ContentGrid>
          <TextContent>
            <SectionTitle
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              자연에서 시작된
              <br />
              아름다운 이야기
            </SectionTitle>

            <StoryText
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              2018년, 한국의 자연에서 영감을 받아 시작된 MICOZ는 
              <HighlightText> 자연의 순수함과 현대 과학의 만남</HighlightText>을 
              추구합니다. 우리는 건강한 아름다움이 지속 가능한 방식으로 
              만들어져야 한다고 믿습니다.
            </StoryText>

            <ValuesList
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {brandValues.map((value, index) => (
                <ValueItem
                  key={value.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  <ValueIcon />
                  <ValueText>
                    <ValueTitle>{value.title}</ValueTitle>
                    <ValueDescription>{value.description}</ValueDescription>
                  </ValueText>
                </ValueItem>
              ))}
            </ValuesList>

            <CTASection
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button variant="primary" size="large">
                브랜드 스토리 전체보기
              </Button>
            </CTASection>
          </TextContent>

          <VisualContent>
            <ImageContainer
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <MainImage 
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="자연에서 영감받은 MICOZ"
              />
            </ImageContainer>

            <FloatingCard
              initial={{ opacity: 0, y: 50, x: 50 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <CardTitle>5년간의 여정</CardTitle>
              <CardText>
                자연 친화적 뷰티 브랜드로서 
                고객들과 함께 성장해온 시간들
              </CardText>
            </FloatingCard>
          </VisualContent>
        </ContentGrid>
      </ContentWrapper>
    </SectionContainer>
  );
};