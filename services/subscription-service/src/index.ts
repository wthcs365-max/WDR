import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './utils/error-handler';
import { config } from './config';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'subscription-service', timestamp: new Date().toISOString() });
});

app.use('/v1', router);
app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[Subscription Service] Running on port ${config.port}`);
});

export default app;