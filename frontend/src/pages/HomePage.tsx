import React from 'react';
import { HeroSection, ProductSection, BrandStoryPreview, ReviewSection } from '../components';
import { Product } from '../components/ProductSection/ProductSection';

// 샘플 데이터
const sampleProducts: Product[] = [
  {
    id: '1',
    name: '히알루론산 세럼',
    description: '깊은 수분 공급으로 촉촉하고 탄력있는 피부를 선사합니다.',
    price: 89000,
    category: '스킨케어',
    subCategory: '세럼',
    brand: 'MICOZ',
    slug: 'hyaluronic-acid-serum',
    image: '/images/serum1.jpg',
    images: ['/images/serum1.jpg'],
    isNew: true,
    isBestseller: false,
    featured: false,
    inventory: 50,
    rating: { average: 4.5, count: 24 },
    wishlistCount: 12,
    createdAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: '비타민 C 크림',
    description: '비타민 C로 밝고 건강한 피부 톤을 만들어주는 영양 크림.',
    price: 65000,
    category: '스킨케어',
    subCategory: '크림',
    brand: 'MICOZ',
    slug: 'vitamin-c-cream',
    image: '/images/cream1.jpg',
    images: ['/images/cream1.jpg'],
    isNew: true,
    isBestseller: false,
    featured: false,
    inventory: 30,
    rating: { average: 4.2, count: 18 },
    wishlistCount: 8,
    createdAt: '2024-01-14T10:00:00Z',
    publishedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: '3',
    name: '천연 립 밤',
    description: '자연 성분으로 만든 부드럽고 촉촉한 립 밤.',
    price: 25000,
    category: '메이크업',
    subCategory: '립',
    brand: 'MICOZ',
    slug: 'natural-lip-balm',
    image: '/images/lipbalm1.jpg',
    images: ['/images/lipbalm1.jpg'],
    isNew: true,
    isBestseller: false,
    featured: false,
    inventory: 100,
    rating: { average: 4.8, count: 35 },
    wishlistCount: 15,
    createdAt: '2024-01-13T10:00:00Z',
    publishedAt: '2024-01-13T10:00:00Z',
  },
];

const bestsellerProducts: Product[] = [
  {
    id: '4',
    name: '콜라겐 아이크림',
    description: '콜라겐 성분으로 눈가 주름과 탄력을 개선해주는 아이크림.',
    price: 120000,
    compareAtPrice: 150000,
    category: '스킨케어',
    subCategory: '아이케어',
    brand: 'MICOZ',
    slug: 'collagen-eye-cream',
    image: '/images/eyecream1.jpg',
    images: ['/images/eyecream1.jpg'],
    isNew: false,
    isBestseller: true,
    featured: false,
    inventory: 25,
    rating: { average: 4.9, count: 67 },
    wishlistCount: 45,
    createdAt: '2024-01-10T10:00:00Z',
    publishedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '5',
    name: '로즈 토너', 
    description: '장미 추출물로 피부를 진정시키고 수분을 공급하는 토너.',
    price: 45000,
    category: '스킨케어',
    subCategory: '토너',
    brand: 'MICOZ',
    slug: 'rose-toner',
    image: '/images/toner1.jpg',
    images: ['/images/toner1.jpg'],
    isNew: false,
    isBestseller: true,
    featured: false,
    inventory: 40,
    rating: { average: 4.6, count: 89 },
    wishlistCount: 32,
    createdAt: '2024-01-08T10:00:00Z',
    publishedAt: '2024-01-08T10:00:00Z',
  },
  {
    id: '6',
    name: '바디 로션',
    description: '온 몸에 사용할 수 있는 부드럽고 향긋한 바디 로션.',
    price: 38000,
    category: '바디케어',
    subCategory: '로션',
    brand: 'MICOZ',
    slug: 'body-lotion',
    image: '/images/bodylotion1.jpg',
    images: ['/images/bodylotion1.jpg'],
    isNew: false,
    isBestseller: true,
    featured: false,
    inventory: 60,
    rating: { average: 4.7, count: 123 },
    wishlistCount: 28,
    createdAt: '2024-01-05T10:00:00Z',
    publishedAt: '2024-01-05T10:00:00Z',
  },
];

const sampleReviews = [
  {
    id: '1',
    customerName: '김○○',
    rating: 5,
    comment: '정말 좋은 제품이에요! 피부가 확실히 좋아졌습니다.',
    productName: '히알루론산 세럼',
    date: '2024-01-15',
    verified: true,
  },
  {
    id: '2', 
    customerName: '이○○',
    rating: 5,
    comment: '자연스럽고 촉촉해서 매일 사용하고 있어요.',
    productName: '콜라겐 아이크림',
    date: '2024-01-10',
    verified: true,
  },
  {
    id: '3',
    customerName: '박○○',
    rating: 4,
    comment: '향이 너무 좋고 촉촉함이 오래 지속되네요. 다시 구매할 예정입니다.',
    productName: '로즈 토너',
    date: '2024-01-08',
    verified: false,
  },
];

export const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <ProductSection 
        title="신제품" 
        subtitle="자연에서 찾은 새로운 뷰티 솔루션을 만나보세요"
        products={sampleProducts} 
        sectionType="new" 
      />
      <ProductSection 
        title="베스트셀러" 
        subtitle="고객들이 가장 사랑하는 MICOZ의 인기 제품들"
        products={bestsellerProducts} 
        sectionType="bestseller" 
      />
      <BrandStoryPreview />
      <ReviewSection reviews={sampleReviews} />
    </>
  );
};