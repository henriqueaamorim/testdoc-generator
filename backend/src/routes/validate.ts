import { Router } from 'express';
import { validateHandler } from '../services/validateService';

export const validateRouter = Router();

validateRouter.post('/', validateHandler);

