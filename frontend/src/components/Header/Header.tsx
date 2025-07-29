import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderProps {
  className?: string;
}

const HeaderContainer = styled(motion.header)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
  background-color: ${({ theme }) => theme.colors.secondary.ivory};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const Nav = styled.nav`
  max-width: ${({ theme }) => theme.grid.container};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
    height: 70px;
  }
`;

const Logo = styled(motion.div)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.english};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  cursor: pointer;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
`;

const NavList = styled.ul<{ isOpen?: boolean }>`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: ${({ theme }) => theme.spacing[8]};
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    background-color: ${({ theme }) => theme.colors.secondary.ivory};
    flex-direction: column;
    padding: ${({ theme }) => theme.spacing[6]};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    gap: ${({ theme }) => theme.spacing[4]};
    transform: translateY(${({ isOpen }) => (isOpen ? '0' : '-100%')});
    opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
    visibility: ${({ isOpen }) => (isOpen ? 'visible' : 'hidden')};
    transition: all ${({ theme }) => theme.transitions.normal};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    top: 70px;
  }
`;

const NavItem = styled.li`
  position: relative;
`;

const NavLink = styled(motion.a)`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  text-decoration: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.primary.sage};
    transition: all ${({ theme }) => theme.transitions.fast};
    transform: translateX(-50%);
  }

  &:hover::after {
    width: 80%;
  }
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background-color: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing[2]};
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: static;
    box-shadow: none;
    border: none;
    background: transparent;
    padding: 0;
    margin-left: ${({ theme }) => theme.spacing[4]};
  }
`;

const DropdownItem = styled(motion.a)`
  display: block;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.secondary.charcoal};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const HamburgerIcon = styled.div<{ isOpen?: boolean }>`
  width: 24px;
  height: 2px;
  background-color: currentColor;
  position: relative;
  transition: all ${({ theme }) => theme.transitions.fast};

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background-color: currentColor;
    transition: all ${({ theme }) => theme.transitions.fast};
  }

  &::before {
    top: -8px;
  }

  &::after {
    top: 8px;
  }

  ${({ isOpen }) =>
    isOpen &&
    css`
      background-color: transparent;

      &::before {
        transform: rotate(45deg);
        top: 0;
      }

      &::after {
        transform: rotate(-45deg);
        top: 0;
      }
    `}
`;

const navigationItems = [
  { label: '브랜드 스토리', href: '/brand-story' },
  {
    label: '제품',
    href: '/products',
    dropdown: [
      { label: '스킨케어', href: '/products/skincare' },
      { label: '메이크업', href: '/products/makeup' },
      { label: '바디케어', href: '/products/bodycare' },
      { label: '향수', href: '/products/fragrance' },
    ],
  },
  { label: '컬렉션', href: '/collections' },
  { label: '뷰티 가이드', href: '/beauty-guide' },
  { label: '커뮤니티', href: '/community' },
  { label: '고객 서비스', href: '/customer-service' },
];

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDropdownToggle = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  return (
    <HeaderContainer
      className={className}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Nav>
        <Logo
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          MICOZ
        </Logo>

        <NavList isOpen={isMenuOpen}>
          {navigationItems.map((item) => (
            <NavItem key={item.label}>
              {item.dropdown ? (
                <DropdownContainer>
                  <NavLink
                    onClick={() => handleDropdownToggle(item.label)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.label}
                  </NavLink>
                  <AnimatePresence>
                    {activeDropdown === item.label && (
                      <DropdownMenu
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.dropdown.map((dropdownItem) => (
                          <DropdownItem
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            whileHover={{ x: 4 }}
                          >
                            {dropdownItem.label}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    )}
                  </AnimatePresence>
                </DropdownContainer>
              ) : (
                <NavLink
                  href={item.href}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.label}
                </NavLink>
              )}
            </NavItem>
          ))}
        </NavList>

        <MobileMenuButton onClick={toggleMenu}>
          <HamburgerIcon isOpen={isMenuOpen} />
        </MobileMenuButton>
      </Nav>
    </HeaderContainer>
  );
};