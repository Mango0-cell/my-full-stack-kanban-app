export interface JwtPayload {
  userId: number;
  email: string;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}

// Augment Express namespace
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
