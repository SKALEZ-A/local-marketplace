import { Category } from '../models/category.model';
import { AppError } from '../utils/appError';
import { generateSlug } from '../utils/slug';

export class CategoryService {
  async getCategories(options: any = {}) {
    const { page = 1, limit = 50, parentId } = options;
    const query: any = {};

    if (parentId) {
      query.parent = parentId;
    } else {
      query.parent = null;
    }

    const categories = await Category.find(query)
      .populate('parent')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ order: 1, name: 1 });

    const total = await Category.countDocuments(query);

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getCategoryById(categoryId: string) {
    const category = await Category.findById(categoryId).populate('parent');
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return category;
  }

  async getCategoryBySlug(slug: string) {
    const category = await Category.findOne({ slug }).populate('parent');
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return category;
  }

  async createCategory(categoryData: any) {
    const slug = generateSlug(categoryData.name);
    const existingCategory = await Category.findOne({ slug });
    
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }

    const category = await Category.create({
      ...categoryData,
      slug
    });

    return category;
  }

  async updateCategory(categoryId: string, updateData: any) {
    if (updateData.name) {
      updateData.slug = generateSlug(updateData.name);
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  async deleteCategory(categoryId: string) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const hasChildren = await Category.countDocuments({ parent: categoryId });
    if (hasChildren > 0) {
      throw new AppError('Cannot delete category with subcategories', 400);
    }

    await Category.findByIdAndDelete(categoryId);
  }

  async getCategoryTree() {
    const categories = await Category.find({ parent: null })
      .populate({
        path: 'children',
        populate: {
          path: 'children'
        }
      })
      .sort({ order: 1, name: 1 });

    return categories;
  }

  async getCategoryChildren(categoryId: string) {
    const children = await Category.find({ parent: categoryId })
      .sort({ order: 1, name: 1 });
    return children;
  }

  async getCategoryBreadcrumb(categoryId: string) {
    const breadcrumb = [];
    let currentCategory = await this.getCategoryById(categoryId);

    while (currentCategory) {
      breadcrumb.unshift({
        id: currentCategory._id,
        name: currentCategory.name,
        slug: currentCategory.slug
      });

      if (currentCategory.parent) {
        currentCategory = await this.getCategoryById(currentCategory.parent.toString());
      } else {
        break;
      }
    }

    return breadcrumb;
  }
}
