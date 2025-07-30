"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWishlist = exports.removeFromWishlist = exports.addToWishlist = exports.getCategories = exports.getProductBySlug = exports.getProductById = exports.getProducts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 12, category, subCategory, minPrice, maxPrice, skinType, skinConcerns, ingredients, isNew, isBestseller, isFeatured, inStock, sortBy = 'createdAt', sortOrder = 'desc', search, } = req.query;
        const pageNumber = Math.max(1, parseInt(page));
        const limitNumber = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNumber - 1) * limitNumber;
        // Build where clause
        const where = {
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
            if (minPrice)
                where.price.gte = parseInt(minPrice) * 100; // Convert to cents
            if (maxPrice)
                where.price.lte = parseInt(maxPrice) * 100;
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
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    shortDescription: {
                        contains: search,
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
        const orderBy = {};
        if (sortBy === 'price') {
            orderBy.price = sortOrder;
        }
        else if (sortBy === 'name') {
            orderBy.name = sortOrder;
        }
        else if (sortBy === 'publishedAt') {
            orderBy.publishedAt = sortOrder;
        }
        else {
            orderBy.createdAt = sortOrder;
        }
        // Execute queries
        const [products, totalCount] = yield Promise.all([
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
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            error: 'Failed to fetch products',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.getProducts = getProducts;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield prisma.product.findUnique({
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
    }
    catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            error: 'Failed to fetch product',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.getProductById = getProductById;
const getProductBySlug = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slug } = req.params;
        const product = yield prisma.product.findUnique({
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
    }
    catch (error) {
        console.error('Get product by slug error:', error);
        res.status(500).json({
            error: 'Failed to fetch product',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.getProductBySlug = getProductBySlug;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma.product.groupBy({
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
                categoryData.subCategories.set(subCategory, categoryData.subCategories.get(subCategory) + count);
            }
        });
        // Format response
        const formattedCategories = Array.from(categoryMap.entries()).map(([name, data]) => ({
            name,
            count: data.totalCount,
            subCategories: Array.from(data.subCategories.entries()).map(([subName, subCount]) => ({
                name: subName,
                count: subCount,
            })),
        }));
        res.json({
            categories: formattedCategories,
        });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            error: 'Failed to fetch categories',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.getCategories = getCategories;
const addToWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const product = yield prisma.product.findUnique({
            where: { id: productId, status: 'ACTIVE' },
        });
        if (!product) {
            return res.status(404).json({
                error: 'Product not found',
                code: 'PRODUCT_NOT_FOUND'
            });
        }
        // Add to wishlist (upsert to handle duplicates)
        const wishlistItem = yield prisma.wishlistItem.upsert({
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
    }
    catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            error: 'Failed to add to wishlist',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.addToWishlist = addToWishlist;
const removeFromWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const { productId } = req.params;
        const userId = req.user.userId;
        yield prisma.wishlistItem.delete({
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
    }
    catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            error: 'Failed to remove from wishlist',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.removeFromWishlist = removeFromWishlist;
const getWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        const userId = req.user.userId;
        const wishlistItems = yield prisma.wishlistItem.findMany({
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
    }
    catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            error: 'Failed to fetch wishlist',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.getWishlist = getWishlist;
