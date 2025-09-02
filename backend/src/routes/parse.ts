import { Router } from 'express';
import { parseMarkdownHandler } from '../services/parseService';

export const parseRouter = Router();

parseRouter.post('/markdown', parseMarkdownHandler);

