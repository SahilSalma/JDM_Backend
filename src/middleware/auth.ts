import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../config/database';
import { adminUsers } from '../models/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined;

    // Try cookie first, then Authorization header
    if (req.cookies?.admin_token) {
      token = req.cookies.admin_token as string;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let payload: { sub: string; email: string; role: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as typeof payload;
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const admin = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, payload.sub))
      .get();

    if (!admin) {
      res.status(401).json({ success: false, error: 'Admin user not found' });
      return;
    }

    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}
