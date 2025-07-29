import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button';

export interface HeroSectionProps {
  className?: string;
}

const HeroContainer = styled.section`
  position: relative;
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.softMint} 0%, 
    ${({ theme }) => theme.colors.secondary.ivory} 50%,
    ${({ theme }) => theme.colors.accent.roseGold}20 100%
  );

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 80vh;
    min-height: 500px;
  }
`;

const BackgroundElements = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
`;

const FloatingElement = styled(motion.div)<{ size: number; top: string; left: string }>`
  position: absolute;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary.sage}30;
  top: ${({ top }) => top};
  left: ${({ left }) => left};
  backdrop-filter: blur(2px);
`;

const ContentWrapper = styled.div`
  max-width: ${({ theme }) => theme.grid.container};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};
  text-align: center;
  z-index: 1;
  position: relative;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const MainHeading = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['6xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }
`;

const SubHeading = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }
`;

const BrandPhilosophy = styled(motion.div)`
  background: ${({ theme }) => theme.colors.secondary.ivory}95;
  backdrop-filter: blur(10px);
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing[8]};
  margin: ${({ theme }) => theme.spacing[8]} 0;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]};
    margin: ${({ theme }) => theme.spacing[6]} 0;
  }
`;

const PhilosophyTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
`;

const PhilosophyText = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }
`;

const CTASection = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: center;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const ScrollIndicator = styled(motion.div)`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[8]};
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.primary.sage};
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    bottom: ${({ theme }) => theme.spacing[6]};
  }
`;

const ScrollText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  letter-spacing: 0.5px;
`;

const ScrollArrow = styled(motion.div)`
  width: 2px;
  height: 30px;
  background: linear-gradient(to bottom, 
    ${({ theme }) => theme.colors.primary.sage}, 
    transparent
  );
  border-radius: 1px;
`;

const floatingElements = [
  { size: 120, top: '10%', left: '10%' },
  { size: 80, top: '20%', left: '85%' },
  { size: 150, top: '70%', left: '15%' },
  { size: 100, top: '60%', left: '80%' },
  { size: 60, top: '40%', left: '5%' },
  { size: 90, top: '30%', left: '90%' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <HeroContainer className={className}>
      <BackgroundElements>
        {floatingElements.map((element, index) => (
          <FloatingElement
            key={index}
            size={element.size}
            top={element.top}
            left={element.left}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 6 + index,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.5,
            }}
          />
        ))}
      </BackgroundElements>

      <ContentWrapper>
        <MainHeading
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          자연에서 찾은
          <br />
          아름다움의 비밀
        </MainHeading>

        <SubHeading
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          MICOZ는 자연의 순수함과 현대적 혁신을 조합하여
          <br />
          당신만의 독특한 아름다움을 발견하는 여정을 함께합니다
        </SubHeading>

        <BrandPhilosophy
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <PhilosophyTitle>우리의 철학</PhilosophyTitle>
          <PhilosophyText>
            "진정한 아름다움은 자연에서 나온다"
            <br />
            친환경적이고 지속가능한 뷰티 제품으로 
            건강한 라이프스타일을 제안합니다.
          </PhilosophyText>

          <CTASection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button size="large" variant="primary">
              제품 둘러보기
            </Button>
            <Button size="large" variant="secondary">
              브랜드 스토리
            </Button>
          </CTASection>
        </BrandPhilosophy>
      </ContentWrapper>

      <ScrollIndicator
        onClick={handleScrollDown}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <ScrollText>더 알아보기</ScrollText>
        <ScrollArrow
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </ScrollIndicator>
    </HeroContainer>
  );
};