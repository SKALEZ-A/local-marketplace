import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  parentCategory?: string;
  level: number;
  path: string[];
  image?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  metadata: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
  };
  attributes: ICategoryAttribute[];
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryAttribute {
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
  unit?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

const CategoryAttributeSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'number', 'select', 'multiselect', 'boolean', 'date'],
    required: true
  },
  required: { type: Boolean, default: false },
  options: [String],
  unit: String,
  validation: {
    min: Number,
    max: Number,
    pattern: String
  }
});

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 500
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    path: [{
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }],
    image: String,
    icon: String,
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    metadata: {
      seoTitle: String,
      seoDescription: String,
      seoKeywords: [String]
    },
    attributes: [CategoryAttributeSchema],
    productCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ displayOrder: 1 });
CategorySchema.index({ 'metadata.seoKeywords': 1 });

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Pre-save middleware to update path and level
CategorySchema.pre('save', async function(next) {
  if (this.isModified('parentCategory')) {
    if (this.parentCategory) {
      const parent = await mongoose.model('Category').findById(this.parentCategory);
      if (parent) {
        this.level = parent.level + 1;
        this.path = [...parent.path, parent._id];
      }
    } else {
      this.level = 0;
      this.path = [];
    }
  }
  next();
});

// Static methods
CategorySchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug, isActive: true });
};

CategorySchema.statics.findRootCategories = function() {
  return this.find({ parentCategory: null, isActive: true }).sort({ displayOrder: 1 });
};

CategorySchema.statics.findSubcategories = function(parentId: string) {
  return this.find({ parentCategory: parentId, isActive: true }).sort({ displayOrder: 1 });
};

CategorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
  
  const buildTree = (parentId: any = null): any[] => {
    return categories
      .filter(cat => String(cat.parentCategory) === String(parentId))
      .map(cat => ({
        ...cat,
        children: buildTree(cat._id)
      }));
  };
  
  return buildTree(null);
};

CategorySchema.statics.getCategoryPath = async function(categoryId: string) {
  const category = await this.findById(categoryId).populate('path');
  if (!category) return [];
  
  return [...category.path, category];
};

CategorySchema.statics.updateProductCount = async function(categoryId: string) {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: categoryId, isActive: true });
  await this.findByIdAndUpdate(categoryId, { productCount: count });
};

// Instance methods
CategorySchema.methods.getFullPath = async function() {
  await this.populate('path');
  const pathNames = this.path.map((cat: any) => cat.name);
  return [...pathNames, this.name].join(' > ');
};

CategorySchema.methods.getAllSubcategories = async function() {
  const allCategories = await mongoose.model('Category').find({ isActive: true });
  
  const findDescendants = (parentId: any): any[] => {
    const children = allCategories.filter(cat => String(cat.parentCategory) === String(parentId));
    return children.reduce((acc, child) => {
      return [...acc, child, ...findDescendants(child._id)];
    }, [] as any[]);
  };
  
  return findDescendants(this._id);
};

CategorySchema.methods.canDelete = async function() {
  const hasSubcategories = await mongoose.model('Category').countDocuments({ parentCategory: this._id });
  const hasProducts = await mongoose.model('Product').countDocuments({ category: this._id });
  
  return hasSubcategories === 0 && hasProducts === 0;
};

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
