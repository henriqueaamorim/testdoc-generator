import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { healthRouter } from './routes/health';
import { parseRouter } from './routes/parse';
import { exportRouter } from './routes/export';
import { validateRouter } from './routes/validate';

const app = express();

app.use(cors({ origin: true }));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '6mb' }));

app.use(pinoHttp());

// Correlation-Id middleware
app.use((req, res, next) => {
  const existing = req.header('Correlation-Id') || uuidv4();
  res.setHeader('Correlation-Id', existing);
  (req as any).correlationId = existing;
  next();
});

// Idempotency-Key passthrough (no storage yet)
app.use((req, res, next) => {
  const idem = req.header('Idempotency-Key');
  if (idem) res.setHeader('Idempotency-Key', idem);
  next();
});

app.use(rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));

app.use('/v1/health', healthRouter);
app.use('/v1/parse', parseRouter);
app.use('/v1/export', exportRouter);
app.use('/v1/validate', validateRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on :${port}`);
});
