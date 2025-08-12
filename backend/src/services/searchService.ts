import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SearchFilters {
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  skinType?: string;
  isBestseller?: boolean;
  isNew?: boolean;
  featured?: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'bestseller';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: any[];
  totalCount: number;
  suggestions?: string[];
  filters: {
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
  };
}

export class SearchService {
  async searchProducts(options: SearchOptions): Promise<SearchResult> {
    const {
      query = '',
      filters = {},
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = options;

    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    const where: any = {
      status: 'ACTIVE',
      ...(filters.category && { category: filters.category }),
      ...(filters.subCategory && { subCategory: filters.subCategory }),
      ...(filters.brand && { brand: filters.brand }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { ...where.price, lte: filters.maxPrice } }),
      ...(filters.isBestseller && { isBestseller: true }),
      ...(filters.isNew && { isNew: true }),
      ...(filters.featured && { featured: true })
    };

    // Add text search if query provided
    if (query.trim()) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { category: { contains: query } },
        { brand: { contains: query } }
      ];
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'bestseller':
        orderBy = { isBestseller: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, we'll order by multiple factors
        orderBy = [
          { featured: 'desc' },
          { isBestseller: 'desc' },
          { isNew: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
    }

    try {
      // Execute search query
      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            reviews: {
              select: {
                rating: true
              }
            },
            _count: {
              select: {
                reviews: true,
                wishlistItems: true
              }
            }
          }
        }),
        prisma.product.count({ where })
      ]);

      // Calculate average ratings and format products
      const formattedProducts = products.map(product => {
        const ratings = product.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          slug: product.slug,
          images: product.images ? JSON.parse(product.images) : [],
          featured: product.featured,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          inventory: product.inventory,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count.reviews,
          wishlistCount: product._count.wishlistItems,
          createdAt: product.createdAt
        };
      });

      // Get filter options for sidebar
      const [categories, brands, priceStats] = await Promise.all([
        prisma.product.findMany({
          where: { status: 'ACTIVE' },
          select: { category: true },
          distinct: ['category']
        }),
        prisma.product.findMany({
          where: { status: 'ACTIVE' },
          select: { brand: true },
          distinct: ['brand']
        }),
        prisma.product.aggregate({
          where: { status: 'ACTIVE' },
          _min: { price: true },
          _max: { price: true }
        })
      ]);

      const filterOptions = {
        categories: categories.map(c => c.category),
        brands: brands.map(b => b.brand),
        priceRange: {
          min: priceStats._min.price || 0,
          max: priceStats._max.price || 100000
        }
      };

      // Generate suggestions if query provided but no results
      let suggestions: string[] = [];
      if (query.trim() && formattedProducts.length === 0) {
        suggestions = await this.generateSuggestions(query);
      }

      return {
        products: formattedProducts,
        totalCount,
        suggestions,
        filters: filterOptions
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search products');
    }
  }

  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query.trim()) return [];

    try {
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          name: true,
          category: true,
          brand: true
        },
        take: limit * 2 // Get more to filter unique suggestions
      });

      const suggestions = new Set<string>();
      
      products.forEach(product => {
        // Add product name if it matches
        if (product.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(product.name);
        }
        
        // Add category if it matches
        if (product.category.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(product.category);
        }
        
        // Add brand if it matches
        if (product.brand.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(product.brand);
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  async getPopularSearches(limit: number = 10): Promise<string[]> {
    // This would typically come from analytics data
    // For now, return static popular searches
    return [
      '스킨케어',
      '메이크업',
      '선크림',
      '토너',
      '세럼',
      '클렌저',
      '마스크팩',
      '립스틱',
      '파운데이션',
      '아이크림'
    ].slice(0, limit);
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    // Simple suggestion generation based on similar products
    const similarProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query.substring(0, Math.floor(query.length / 2)) } },
          { category: { contains: query.substring(0, Math.floor(query.length / 2)) } }
        ]
      },
      select: { name: true, category: true },
      take: 5
    });

    const suggestions = new Set<string>();
    similarProducts.forEach(product => {
      suggestions.add(product.name);
      suggestions.add(product.category);
    });

    return Array.from(suggestions).slice(0, 5);
  }

  async getRecentSearches(userId: string, limit: number = 10): Promise<string[]> {
    // This would typically be stored in a user_searches table
    // For now, return empty array - to be implemented with analytics
    return [];
  }

  async trackSearch(query: string, userId?: string, resultCount?: number): Promise<void> {
    // This would typically store search analytics
    // For now, just log - to be implemented with analytics system
    console.log(`Search tracked: ${query}, User: ${userId}, Results: ${resultCount}`);
  }
}

export const searchService = new SearchService();