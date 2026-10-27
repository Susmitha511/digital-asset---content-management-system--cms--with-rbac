import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { dbStore } from '../db/store.js';
import { User } from '../../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No session token provided.' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid or expired authentication session.' });
      return;
    }

    const usersCol = dbStore.getCollection<User>('users');
    const user = usersCol.findById(payload.userId);

    if (!user) {
      res.status(401).json({ success: false, message: 'User account no longer exists.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: `Account is ${user.status}. Please contact an administrator.` });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication verification failure.' });
  }
}
