import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { SEOHead } from '../components/SEO/SEOHead';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.secondary.ivory};
`;

// Hero Section with Parallax
const HeroSection = styled(motion.section)`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.sage}20 0%,
    ${({ theme }) => theme.colors.primary.deepForest}10 100%);
`;

const HeroBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 120%;
  height: 120%;
  background: url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80') center/cover;
  filter: brightness(0.3);
`;

const HeroContent = styled.div`
  text-align: center;
  z-index: 2;
  color: white;
  max-width: 800px;
  padding: 0 ${({ theme }) => theme.spacing[6]};
`;

const HeroTitle = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  opacity: 0.9;
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
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
  color: white;
  opacity: 0.7;
`;

const ScrollText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const ScrollArrow = styled(motion.div)`
  width: 2px;
  height: 30px;
  background: white;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -3px;
    width: 8px;
    height: 8px;
    border-right: 2px solid white;
    border-bottom: 2px solid white;
    transform: rotate(45deg);
  }
`;

// Content Sections
const ContentSection = styled(motion.section)`
  padding: ${({ theme }) => theme.spacing[16]} 0;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: ${({ theme }) => theme.spacing[6]};
  padding-right: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[4]};
  }
`;

const SectionTitle = styled(motion.h2)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const StoryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[12]};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[16]};

  &:nth-child(even) {
    direction: rtl;
    
    > * {
      direction: ltr;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[8]};
    direction: ltr;
  }
`;

const StoryContent = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const StorySubtitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.sage};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const StoryText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const StoryImage = styled(motion.div)`
  width: 100%;
  height: 400px;
  background-size: cover;
  background-position: center;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 300px;
  }
`;

// Philosophy Section
const PhilosophySection = styled(motion.section)`
  background: ${({ theme }) => theme.colors.primary.deepForest};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[16]} 0;
  position: relative;
  overflow: hidden;
`;

const PhilosophyBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80') center/cover;
  opacity: 0.1;
`;

const PhilosophyContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  padding: 0 ${({ theme }) => theme.spacing[6]};
  position: relative;
  z-index: 2;
`;

const PhilosophyTitle = styled(motion.h2)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const PhilosophyText = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  opacity: 0.95;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

// Values Section
const ValuesSection = styled(motion.section)`
  padding: ${({ theme }) => theme.spacing[16]} 0;
  background: white;
`;

const ValuesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
  margin-top: ${({ theme }) => theme.spacing[12]};
`;

const ValueCard = styled(motion.div)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  transition: all ${({ theme }) => theme.transitions.slow};

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
`;

const ValueIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ValueTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ValueDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

// Sustainability Section
const SustainabilitySection = styled(motion.section)`
  background: ${({ theme }) => theme.colors.primary.sage}15;
  padding: ${({ theme }) => theme.spacing[16]} 0;
`;

const SustainabilityContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const SustainabilityStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
  margin-top: ${({ theme }) => theme.spacing[12]};
`;

const StatCard = styled(motion.div)`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.sage};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

export const BrandStoryPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  };

  const storyData = [
    {
      subtitle: "자연에서 찾은 영감",
      text: "MICOZ는 자연의 순수함에서 영감을 받았습니다. 깨끗한 자연환경에서 자라난 식물 추출물과 미네랄을 사용하여 피부에 진정한 아름다움을 선사합니다.",
      image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"
    },
    {
      subtitle: "과학적 연구와 혁신",
      text: "자연의 힘과 현대 과학의 만남. 우리는 지속적인 연구를 통해 피부 과학을 발전시키고, 효과적이면서도 안전한 제품을 개발합니다.",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"
    },
    {
      subtitle: "지속가능한 아름다움",
      text: "아름다움은 지속가능해야 합니다. 친환경 패키징부터 윤리적 원료 조달까지, 지구와 함께하는 아름다움을 추구합니다.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"
    }
  ];

  const values = [
    {
      icon: "🌿",
      title: "자연 우선",
      description: "자연에서 온 순수한 성분만을 사용하여 피부에 안전하고 효과적인 제품을 만듭니다."
    },
    {
      icon: "🔬",
      title: "과학적 접근",
      description: "철저한 연구와 검증을 통해 효과가 입증된 성분과 기술을 적용합니다."
    },
    {
      icon: "♻️",
      title: "지속가능성",
      description: "환경을 생각하는 패키징과 생산 과정을 통해 지속가능한 뷰티를 실현합니다."
    },
    {
      icon: "💎",
      title: "프리미엄 품질",
      description: "엄선된 원료와 정교한 제조 과정을 통해 최고 품질의 제품을 제공합니다."
    }
  ];

  const stats = [
    { number: "100%", label: "자연 유래 성분" },
    { number: "0", label: "유해 화학물질" },
    { number: "95%", label: "재활용 가능 패키징" },
    { number: "10+", label: "년간 연구개발" }
  ];

  return (
    <PageContainer ref={containerRef}>
      <SEOHead 
        title="브랜드 스토리"
        description="자연의 순수함과 현대 과학의 혁신이 만나 당신만의 특별한 아름다움을 완성하는 MICOZ의 브랜드 스토리를 만나보세요."
        keywords={['브랜드스토리', '자연화장품', '지속가능성', '철학', 'K뷰티']}
        url="https://micoz.co.kr/brand-story"
      />
      {/* Hero Section */}
      <HeroSection>
        <HeroBackground style={{ y: heroY, opacity: heroOpacity }} />
        <HeroContent>
          <HeroTitle {...fadeInUp}>
            자연이 선사하는<br />
            진정한 아름다움
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            MICOZ는 자연의 순수함과 현대 과학의 혁신이 만나<br />
            당신만의 특별한 아름다움을 완성합니다
          </HeroSubtitle>
        </HeroContent>
        
        <ScrollIndicator
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <ScrollText>Scroll Down</ScrollText>
          <ScrollArrow
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </ScrollIndicator>
      </HeroSection>

      {/* Our Story Section */}
      <ContentSection>
        <SectionTitle
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Our Story
        </SectionTitle>

        {storyData.map((story, index) => (
          <StoryGrid key={index}>
            <StoryContent
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <StorySubtitle>{story.subtitle}</StorySubtitle>
              <StoryText>{story.text}</StoryText>
            </StoryContent>
            
            <StoryImage
              style={{ backgroundImage: `url(${story.image})` }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            />
          </StoryGrid>
        ))}
      </ContentSection>

      {/* Philosophy Section */}
      <PhilosophySection>
        <PhilosophyBackground />
        <PhilosophyContent>
          <PhilosophyTitle
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            우리의 철학
          </PhilosophyTitle>
          <PhilosophyText
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            "아름다움은 자연에서 오고, 과학으로 완성됩니다"
            <br /><br />
            MICOZ는 자연의 지혜와 현대 과학기술의 조화를 통해
            진정한 아름다움을 추구합니다. 우리는 피부가 가진 본연의 아름다움을 
            깨우고 보호하는 것이 진정한 스킨케어라고 믿습니다.
          </PhilosophyText>
        </PhilosophyContent>
      </PhilosophySection>

      {/* Values Section */}
      <ValuesSection>
        <ValuesContainer>
          <SectionTitle
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            MICOZ의 가치
          </SectionTitle>
          
          <ValuesGrid>
            {values.map((value, index) => (
              <ValueCard
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <ValueIcon>{value.icon}</ValueIcon>
                <ValueTitle>{value.title}</ValueTitle>
                <ValueDescription>{value.description}</ValueDescription>
              </ValueCard>
            ))}
          </ValuesGrid>
        </ValuesContainer>
      </ValuesSection>

      {/* Sustainability Section */}
      <SustainabilitySection>
        <SustainabilityContent>
          <SectionTitle
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            지속가능한 약속
          </SectionTitle>
          
          <PhilosophyText
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            style={{ color: '#2D3748' }}
          >
            아름다움과 지속가능성은 함께 갑니다. MICOZ는 지구를 생각하는 
            책임감 있는 브랜드로서 환경 친화적인 제품과 패키징을 통해 
            미래 세대에게 더 나은 지구를 물려주고자 합니다.
          </PhilosophyText>

          <SustainabilityStats>
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <StatNumber>{stat.number}</StatNumber>
                <StatLabel>{stat.label}</StatLabel>
              </StatCard>
            ))}
          </SustainabilityStats>
        </SustainabilityContent>
      </SustainabilitySection>
    </PageContainer>
  );
};