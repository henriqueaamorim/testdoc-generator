import { Router } from 'express';
import { exportHandler } from '../services/exportService';

export const exportRouter = Router();

exportRouter.post('/', exportHandler);

