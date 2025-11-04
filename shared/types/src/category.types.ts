export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  level: number;
  image?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: {
    productCount?: number;
    featured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface CategoryFilter {
  parentId?: string;
  level?: number;
  isActive?: boolean;
  search?: string;
}

export interface CategoryStats {
  categoryId: string;
  productCount: number;
  activeProducts: number;
  totalSales: number;
  averageRating: number;
}
