import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button';
import { Input } from '../Input';

export interface FooterProps {
  className?: string;
}

const FooterContainer = styled.footer`
  background: ${({ theme }) => theme.colors.primary.deepForest};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[16]} 0 ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[12]} 0 ${({ theme }) => theme.spacing[6]};
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

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[12]};
  margin-bottom: ${({ theme }) => theme.spacing[12]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing[8]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[6]};
    text-align: center;
  }
`;

const FooterSection = styled(motion.div)`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.secondary.ivory};
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const LinkItem = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const FooterLink = styled.a`
  color: ${({ theme }) => theme.colors.gray[300]};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const BrandSection = styled(FooterSection)`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-column: span 2;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: span 1;
  }
`;

const Logo = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.english};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const BrandDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[300]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SocialLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary.sage}30;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.secondary.ivory};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage};
    transform: translateY(-2px);
  }
`;

const NewsletterSection = styled(FooterSection)`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-column: span 2;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: span 1;
  }
`;

const NewsletterDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[300]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const NewsletterForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const NewsletterInput = styled(Input)`
  flex: 1;

  input {
    background: ${({ theme }) => theme.colors.secondary.ivory}20;
    border-color: ${({ theme }) => theme.colors.gray[600]};
    color: ${({ theme }) => theme.colors.secondary.ivory};

    &::placeholder {
      color: ${({ theme }) => theme.colors.gray[400]};
    }

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary.sage};
      background: ${({ theme }) => theme.colors.secondary.ivory}30;
    }
  }
`;

const ContactInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.gray[300]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[700]};
  padding-top: ${({ theme }) => theme.spacing[8]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin: 0;
`;

const LegalLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const LegalLink = styled.a`
  color: ${({ theme }) => theme.colors.gray[400]};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const footerSections = [
  {
    title: '제품',
    links: [
      { name: '스킨케어', href: '/products/skincare' },
      { name: '메이크업', href: '/products/makeup' },
      { name: '바디케어', href: '/products/bodycare' },
      { name: '향수', href: '/products/fragrance' },
      { name: '신제품', href: '/products/new' },
    ],
  },
  {
    title: '고객 서비스',
    links: [
      { name: '주문/배송 조회', href: '/customer-service/order' },
      { name: '교환/반품', href: '/customer-service/return' },
      { name: '자주 묻는 질문', href: '/customer-service/faq' },
      { name: '1:1 문의', href: '/customer-service/inquiry' },
      { name: '매장 찾기', href: '/stores' },
    ],
  },
  {
    title: '회사 정보',
    links: [
      { name: '브랜드 스토리', href: '/brand-story' },
      { name: '채용 정보', href: '/careers' },
      { name: '투자자 정보', href: '/investors' },
      { name: '보도자료', href: '/press' },
      { name: '지속가능경영', href: '/sustainability' },
    ],
  },
];

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      // 실제 구현에서는 API 호출
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <FooterContainer className={className}>
      <ContentWrapper>
        <FooterContent>
          <BrandSection
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Logo>MICOZ</Logo>
            <BrandDescription>
              자연에서 찾은 아름다움의 비밀을 전하는 
              친환경 뷰티 브랜드입니다. 건강한 라이프스타일과 
              지속가능한 아름다움을 추구합니다.
            </BrandDescription>
            <SocialLinks>
              <SocialLink href="#" aria-label="Instagram">
                📷
              </SocialLink>
              <SocialLink href="#" aria-label="Facebook">
                📘
              </SocialLink>
              <SocialLink href="#" aria-label="YouTube">
                📺
              </SocialLink>
              <SocialLink href="#" aria-label="KakaoTalk">
                💬
              </SocialLink>
            </SocialLinks>
          </BrandSection>

          {footerSections.map((section, index) => (
            <FooterSection
              key={section.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <SectionTitle>{section.title}</SectionTitle>
              <LinkList>
                {section.links.map((link) => (
                  <LinkItem key={link.name}>
                    <FooterLink href={link.href}>{link.name}</FooterLink>
                  </LinkItem>
                ))}
              </LinkList>
            </FooterSection>
          ))}
        </FooterContent>

        <NewsletterSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <SectionTitle>뉴스레터 구독</SectionTitle>
          <NewsletterDescription>
            MICOZ의 최신 소식과 특별한 혜택을 가장 먼저 받아보세요.
          </NewsletterDescription>
          <NewsletterForm onSubmit={handleNewsletterSubmit}>
            <NewsletterInput
              type="email"
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary">
              {isSubscribed ? '구독 완료!' : '구독하기'}
            </Button>
          </NewsletterForm>
          
          <ContactInfo>
            <ContactItem>
              📞 고객센터: 1588-1234 (평일 9:00-18:00)
            </ContactItem>
            <ContactItem>
              ✉️ 이메일: hello@micoz.com
            </ContactItem>
            <ContactItem>
              📍 서울특별시 강남구 테헤란로 123, MICOZ 본사
            </ContactItem>
          </ContactInfo>
        </NewsletterSection>

        <FooterBottom>
          <Copyright>
            © 2024 MICOZ. All rights reserved.
          </Copyright>
          <LegalLinks>
            <LegalLink href="/privacy">개인정보처리방침</LegalLink>
            <LegalLink href="/terms">이용약관</LegalLink>
            <LegalLink href="/youth">청소년보호정책</LegalLink>
          </LegalLinks>
        </FooterBottom>
      </ContentWrapper>
    </FooterContainer>
  );
};