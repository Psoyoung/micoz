import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  const seo = {
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
  };

  // Generate structured data for different content types
  const generateStructuredData = () => {
    if (structuredData) {
      return structuredData;
    }

    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'Article' : 'WebPage',
      name: seo.title,
      description: seo.description,
      url: seo.url,
      image: seo.image,
      publisher: {
        '@type': 'Organization',
        name: siteName,
        url: DEFAULT_SEO.url,
        logo: {
          '@type': 'ImageObject',
          url: `${DEFAULT_SEO.url}/logo.png`
        }
      }
    };

    if (type === 'article' && author) {
      return {
        ...baseData,
        '@type': 'Article',
        author: {
          '@type': 'Person',
          name: author
        },
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        headline: title,
        articleBody: description
      };
    }

    if (type === 'product') {
      return {
        ...baseData,
        '@type': 'Product',
        brand: {
          '@type': 'Brand',
          name: siteName
        }
      };
    }

    return baseData;
  };

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords.join(', ')} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={seo.type} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content={seo.siteName} />
      <meta property="og:locale" content={seo.locale} />
      
      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      
      {/* Additional meta tags for Korean market */}
      <meta name="naver-site-verification" content="naver-verification-code" />
      <meta name="google-site-verification" content="google-verification-code" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={seo.url} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://images.unsplash.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
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