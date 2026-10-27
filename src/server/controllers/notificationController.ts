import { Response } from 'express';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Notification } from '../../types/index.js';

export function getNotifications(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const notifCol = dbStore.getCollection<Notification>('notifications');
    const userNotifs = notifCol.find({ userId: req.user._id });

    userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = userNotifs.filter(n => !n.isRead).length;

    res.json({
      success: true,
      notifications: userNotifs,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function markAsRead(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const notifCol = dbStore.getCollection<Notification>('notifications');
    const notif = notifCol.findById(id);

    if (notif && notif.userId === req.user._id) {
      notifCol.findByIdAndUpdate(id, { isRead: true });
    }

    res.json({ success: true, message: 'Marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function markAllAsRead(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const notifCol = dbStore.getCollection<Notification>('notifications');
    const userNotifs = notifCol.find({ userId: req.user._id, isRead: false });

    for (const n of userNotifs) {
      notifCol.findByIdAndUpdate(n._id, { isRead: true });
    }

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
