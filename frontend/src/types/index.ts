export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  name?: string;
  avatar?: string;
  skinType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  subCategory?: string;
  brand: string;
  slug: string;
  images: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  featured?: boolean;
  inventory: number;
  variants?: ProductVariant[];
  rating: {
    average: number;
    count: number;
  };
  wishlistCount: number;
  createdAt: string;
  publishedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inventory: number;
}

export interface Post {
  id: string;
  content: string;
  authorId: string;
  author: User;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}