import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRouter from './routes/auth';
import contactsRouter from './routes/contacts';
import dealsRouter from './routes/deals';
import activitiesRouter from './routes/activities';
import analyticsRouter from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow Vercel preview deployments
      if (/\.vercel\.app$/.test(new URL(origin).hostname)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
