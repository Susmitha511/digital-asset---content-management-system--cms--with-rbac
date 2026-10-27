import { Response } from 'express';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { Category, Asset } from '../../types/index.js';

export function listCategories(req: AuthenticatedRequest, res: Response): void {
  try {
    const catCol = dbStore.getCollection<Category>('categories');
    const assetsCol = dbStore.getCollection<Asset>('assets');
    const categories = catCol.find();

    // Recalculate dynamic asset counts
    const withCounts = categories.map(cat => {
      const count = assetsCol.count(a => a.category === cat.name && !a.isDeleted);
      return { ...cat, assetCount: count };
    });

    res.json({ success: true, categories: withCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function createCategory(req: AuthenticatedRequest, res: Response): void {
  try {
    const { name, description = '', color = '#3b82f6' } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const catCol = dbStore.getCollection<Category>('categories');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (catCol.findOne({ name: name.trim() })) {
      res.status(409).json({ success: false, message: 'Category with this name already exists.' });
      return;
    }

    const newCat = catCol.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      color,
      assetCount: 0
    });

    logAuditEvent({
      req,
      action: 'CATEGORY_CREATED',
      resourceType: 'Category',
      resourceId: newCat._id,
      details: `Created new category '${newCat.name}'.`
    });

    res.status(201).json({ success: true, message: 'Category created.', category: newCat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateCategory(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const catCol = dbStore.getCollection<Category>('categories');
    const cat = catCol.findById(id);

    if (!cat) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    const updates: Partial<Category> = {};
    if (name && name.trim() !== cat.name) {
      const oldName = cat.name;
      const newName = name.trim();
      updates.name = newName;
      updates.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // Update assets with this category
      const assetsCol = dbStore.getCollection<Asset>('assets');
      const assets = assetsCol.find({ category: oldName });
      for (const a of assets) {
        assetsCol.findByIdAndUpdate(a._id, { category: newName });
      }
    }
    if (description !== undefined) updates.description = description.trim();
    if (color) updates.color = color;

    const updated = catCol.findByIdAndUpdate(id, updates);

    logAuditEvent({
      req,
      action: 'CATEGORY_UPDATED',
      resourceType: 'Category',
      resourceId: id,
      details: `Updated category '${cat.name}'.`
    });

    res.json({ success: true, message: 'Category updated.', category: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function deleteCategory(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const { reassignTo = 'General' } = req.body;

    const catCol = dbStore.getCollection<Category>('categories');
    const cat = catCol.findById(id);

    if (!cat) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    const assetsCol = dbStore.getCollection<Asset>('assets');
    const assignedAssets = assetsCol.find({ category: cat.name });

    if (assignedAssets.length > 0) {
      // Reassign assets so references remain valid
      for (const a of assignedAssets) {
        assetsCol.findByIdAndUpdate(a._id, { category: reassignTo });
      }
    }

    catCol.findByIdAndDelete(id);

    logAuditEvent({
      req,
      action: 'CATEGORY_DELETED',
      resourceType: 'Category',
      resourceId: id,
      details: `Deleted category '${cat.name}' (${assignedAssets.length} assets reassigned to '${reassignTo}').`
    });

    res.json({
      success: true,
      message: `Category '${cat.name}' deleted. Any attached assets reassigned to '${reassignTo}'.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
