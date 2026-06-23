import { UserRole } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        name: string;
        email: string;
        role: UserRole;
      };
    }
  }
}
