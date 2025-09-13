import { Request } from 'express';

export interface AuthenticatedRequestUser {
  sub: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedRequestUser;
}
