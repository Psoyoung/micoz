import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  siteName?: string;
  locale?: string;
  noIndex?: boolean;
  structuredData?: object;
}

const DEFAULT_SEO = {
  siteName: 'MICOZ',
  title: 'MICOZ - 자연이 선사하는 진정한 아름다움',
  description: '자연의 순수함과 현대 과학의 혁신이 만나 당신만의 특별한 아름다움을 완성하는 K-뷰티 브랜드 MICOZ',
  keywords: ['K뷰티', '자연화장품', '스킨케어', '뷰티', '한국화장품', 'MICOZ', '미코즈'],
  image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  url: 'https://micoz.co.kr',
  locale: 'ko_KR',
  type: 'website' as const
};

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  siteName = DEFAULT_SEO.siteName,
  locale = DEFAULT_SEO.locale,
  noIndex = false,
  structuredData
}) => {
  const seo = React.useMemo(() => ({
    title: title ? `${title} - ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: [...DEFAULT_SEO.keywords, ...keywords],
    image: image || DEFAULT_SEO.image,
    url: url || DEFAULT_SEO.url,
    type,
    siteName,
    locale,
    publishedTime,
    modifiedTime,
    author
  }), [title, description, keywords, image, url, type, siteName, locale, publishedTime, modifiedTime, author]);

  React.useEffect(() => {
    document.title = seo.title;
    
    // Update meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const updateProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', seo.description);
    updateMeta('keywords', seo.keywords.join(', '));
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', seo.title);
    updateMeta('twitter:description', seo.description);
    updateMeta('twitter:image', seo.image);
    
    updateProperty('og:title', seo.title);
    updateProperty('og:description', seo.description);
    updateProperty('og:image', seo.image);
    updateProperty('og:url', seo.url);
    updateProperty('og:type', seo.type);
    updateProperty('og:site_name', seo.siteName);
    updateProperty('og:locale', seo.locale);

    if (noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    }
  }, [seo, noIndex]);

  return null;
};

// Hook for dynamic SEO updates
export const useSEO = (seoProps: SEOProps) => {
  React.useEffect(() => {
    // Update page title dynamically
    if (seoProps.title) {
      document.title = `${seoProps.title} - ${DEFAULT_SEO.siteName}`;
    }
    
    // Update meta description
    if (seoProps.description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', seoProps.description);
      }
    }
  }, [seoProps]);
};

// SEO utilities
export const generateSEOForContent = (content: {
  title: string;
  excerpt: string;
  slug: string;
  type: string;
  author?: { name: string };
  publishedAt?: Date;
  updatedAt?: Date;
  featuredImage?: string;
  tags?: string[];
}): SEOProps => {
  return {
    title: content.title,
    description: content.excerpt,
    keywords: content.tags || [],
    image: content.featuredImage,
    url: `${DEFAULT_SEO.url}/content/${content.slug}`,
    type: 'article',
    author: content.author?.name,
    publishedTime: content.publishedAt?.toISOString(),
    modifiedTime: content.updatedAt?.toISOString()
  };
};

export const generateSEOForProduct = (product: {
  name: string;
  description: string;
  slug: string;
  image: string;
  price: number;
  category?: string;
}): SEOProps => {
  return {
    title: product.name,
    description: product.description,
    keywords: [product.name, product.category || '', 'K뷰티', '스킨케어'].filter(Boolean),
    image: product.image,
    url: `${DEFAULT_SEO.url}/products/${product.slug}`,
    type: 'product',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: DEFAULT_SEO.siteName
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock'
      }
    }
  };
};