import React from 'react';
import { ProductCategoryPage } from './ProductCategoryPage';

export const MakeupCategory: React.FC = () => {
  return (
    <ProductCategoryPage
      category="메이크업"
      title="메이크업"
      description="자연스러운 아름다움을 표현하는 메이크업 컬렉션. 베이스부터 포인트 메이크업까지, 당신만의 개성을 드러내는 컬러와 텍스처를 경험해보세요."
    />
  );
};