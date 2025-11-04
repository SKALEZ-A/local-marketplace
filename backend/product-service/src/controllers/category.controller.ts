import { Request, Response, NextFunction } from 'express';
import { CategoryModel } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryController {
  private categoryModel: CategoryModel;

  constructor() {
    this.categoryModel = new CategoryModel();
  }

  getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryModel.findAll();

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      next(error);
    }
  };

  getCategoryTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tree = await this.categoryModel.getCategoryTree();

      res.status(200).json({
        success: true,
        data: tree
      });
    } catch (error) {
      logger.error('Error fetching category tree:', error);
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryModel.findById(id);

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error('Error fetching category:', error);
      next(error);
    }
  };

  getSubcategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const subcategories = await this.categoryModel.findSubcategories(id);

      res.status(200).json({
        success: true,
        data: subcategories
      });
    } catch (error) {
      logger.error('Error fetching subcategories:', error);
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryData = req.body;
      const category = await this.categoryModel.create(categoryData);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await this.categoryModel.update(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.categoryModel.delete(id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      next(error);
    }
  };
}
