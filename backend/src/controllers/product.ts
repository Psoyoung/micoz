import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export interface ProductFilters {
  category?: string;
  subCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  skinType?: string;
  skinConcerns?: string[];
  ingredients?: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'createdAt' | 'publishedAt';
  order: 'asc' | 'desc';
}

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subCategory,
      minPrice,
      maxPrice,
      skinType,
      skinConcerns,
      ingredients,
      isNew,
      isBestseller,
      isFeatured,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      publishedAt: {
        lte: new Date(),
      },
    };

    if (category) {
      where.category = category;
    }

    if (subCategory) {
      where.subCategory = subCategory;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice as string) * 100; // Convert to cents
      if (maxPrice) where.price.lte = parseInt(maxPrice as string) * 100;
    }

    if (isNew === 'true') {
      where.isNew = true;
    }

    if (isBestseller === 'true') {
      where.isBestseller = true;
    }

    if (isFeatured === 'true') {
      where.featured = true;
    }

    if (inStock === 'true') {
      where.inventory = {
        gt: 0,
      };
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          shortDescription: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (skinConcerns) {
      const concernsArray = Array.isArray(skinConcerns) ? skinConcerns : [skinConcerns];
      where.description = {
        contains: concernsArray.join('|'),
        mode: 'insensitive',
      };
    }

    if (ingredients) {
      const ingredientsArray = Array.isArray(ingredients) ? ingredients : [ingredients];
      // For SQLite with JSON strings, we need to use string contains
      where.ingredients = {
        contains: ingredientsArray.join('|'),
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'publishedAt') {
      orderBy.publishedAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNumber,
        include: {
          variants: {
            orderBy: {
              position: 'asc',
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              wishlistItems: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings and format response
    const formattedProducts = products.map(product => {
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = product.reviews.length > 0 
        ? Math.round((totalRating / product.reviews.length) * 10) / 10 
        : 0;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price / 100, // Convert cents to dollars
        compareAtPrice: product.compareAtPrice ? product.compareAtPrice / 100 : null,
        category: product.category,
        subCategory: product.subCategory,
        brand: product.brand,
        slug: product.slug,
        images: product.images ? JSON.parse(product.images) : [],
        isNew: product.isNew,
        isBestseller: product.isBestseller,
        featured: product.featured,
        inventory: product.inventory,
        variants: product.variants.map(variant => ({
          id: variant.id,
          name: variant.name,
          price: variant.price / 100,
          inventory: variant.inventory,
        })),
        rating: {
          average: averageRating,
          count: product.reviews.length,
        },
        wishlistCount: product._count.wishlistItems,
        createdAt: product.createdAt,
        publishedAt: product.publishedAt,
      };
    });

    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.json({
      products: formattedProducts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        category,
        subCategory,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { 
        id,
        status: 'ACTIVE',
      },
      include: {
        variants: {
          orderBy: {
            position: 'asc',
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Calculate average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = product.reviews.length > 0 
      ? Math.round((totalRating / product.reviews.length) * 10) / 10 
      : 0;

    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price / 100,
      compareAtPrice: product.compareAtPrice ? product.compareAtPrice / 100 : null,
      sku: product.sku,
      category: product.category,
      subCategory: product.subCategory,
      brand: product.brand,
      ingredients: product.ingredients ? JSON.parse(product.ingredients) : [],
      usage: product.usage,
      slug: product.slug,
      images: product.images,
      isNew: product.isNew,
      isBestseller: product.isBestseller,
      featured: product.featured,
      inventory: product.inventory,
      trackInventory: product.trackInventory,
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price / 100,
        inventory: variant.inventory,
        position: variant.position,
      })),
      reviews: product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images ? JSON.parse(review.images) : [],
        verified: review.verified,
        helpful: review.helpful,
        createdAt: review.createdAt,
        user: {
          name: `${review.user.lastName}${review.user.firstName.charAt(0)}*`,
          avatar: review.user.avatar,
        },
      })),
      rating: {
        average: averageRating,
        count: product.reviews.length,
      },
      wishlistCount: product._count.wishlistItems,
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
    };

    res.json({
      product: formattedProduct,
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { 
        slug,
        status: 'ACTIVE',
      },
      include: {
        variants: {
          orderBy: {
            position: 'asc',
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Calculate average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = product.reviews.length > 0 
      ? Math.round((totalRating / product.reviews.length) * 10) / 10 
      : 0;

    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price / 100,
      compareAtPrice: product.compareAtPrice ? product.compareAtPrice / 100 : null,
      sku: product.sku,
      category: product.category,
      subCategory: product.subCategory,
      brand: product.brand,
      ingredients: product.ingredients ? JSON.parse(product.ingredients) : [],
      usage: product.usage,
      slug: product.slug,
      images: product.images,
      isNew: product.isNew,
      isBestseller: product.isBestseller,
      featured: product.featured,
      inventory: product.inventory,
      trackInventory: product.trackInventory,
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price / 100,
        inventory: variant.inventory,
        position: variant.position,
      })),
      reviews: product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images ? JSON.parse(review.images) : [],
        verified: review.verified,
        helpful: review.helpful,
        createdAt: review.createdAt,
        user: {
          name: `${review.user.lastName}${review.user.firstName.charAt(0)}*`,
          avatar: review.user.avatar,
        },
      })),
      rating: {
        average: averageRating,
        count: product.reviews.length,
      },
      wishlistCount: product._count.wishlistItems,
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
    };

    res.json({
      product: formattedProduct,
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category', 'subCategory'],
      where: {
        status: 'ACTIVE',
        publishedAt: {
          lte: new Date(),
        },
      },
      _count: {
        id: true,
      },
    });

    // Group by main category
    const categoryMap = new Map();

    categories.forEach(item => {
      const mainCategory = item.category;
      const subCategory = item.subCategory;
      const count = item._count.id;

      if (!categoryMap.has(mainCategory)) {
        categoryMap.set(mainCategory, {
          name: mainCategory,
          totalCount: 0,
          subCategories: new Map(),
        });
      }

      const categoryData = categoryMap.get(mainCategory);
      categoryData.totalCount += count;

      if (subCategory) {
        if (!categoryData.subCategories.has(subCategory)) {
          categoryData.subCategories.set(subCategory, 0);
        }
        categoryData.subCategories.set(subCategory, 
          categoryData.subCategories.get(subCategory) + count
        );
      }
    });

    // Format response
    const formattedCategories = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      count: data.totalCount,
      subCategories: Array.from(data.subCategories.entries() as IterableIterator<[string, number]>).map(([subName, subCount]) => ({
        name: subName,
        count: subCount,
      })),
    }));

    res.json({
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const addToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { productId } = req.body;
    const userId = req.user.userId;

    if (!productId) {
      return res.status(400).json({ 
        error: 'Product ID is required',
        code: 'MISSING_PRODUCT_ID'
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, status: 'ACTIVE' },
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Add to wishlist (upsert to handle duplicates)
    const wishlistItem = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
    });

    res.json({
      message: 'Product added to wishlist',
      wishlistItem: {
        id: wishlistItem.id,
        productId: wishlistItem.productId,
        createdAt: wishlistItem.createdAt,
      },
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ 
      error: 'Failed to add to wishlist',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { productId } = req.params;
    const userId = req.user.userId;

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.json({
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ 
      error: 'Failed to remove from wishlist',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            reviews: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedWishlist = wishlistItems.map(item => {
      const product = item.product;
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = product.reviews.length > 0 
        ? Math.round((totalRating / product.reviews.length) * 10) / 10 
        : 0;

      return {
        id: item.id,
        addedAt: item.createdAt,
        product: {
          id: product.id,
          name: product.name,
          shortDescription: product.shortDescription,
          price: product.price / 100,
          compareAtPrice: product.compareAtPrice ? product.compareAtPrice / 100 : null,
          category: product.category,
          slug: product.slug,
          images: product.images ? JSON.parse(product.images) : [],
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          inventory: product.inventory,
          rating: {
            average: averageRating,
            count: product.reviews.length,
          },
        },
      };
    });

    res.json({
      wishlist: formattedWishlist,
      totalCount: wishlistItems.length,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wishlist',
      code: 'INTERNAL_ERROR'
    });
  }
};