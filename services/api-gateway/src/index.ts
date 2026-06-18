import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config';

async function startGateway() {
  const app = express();
  const httpServer = http.createServer(app);

  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: config.subgraphs,
      pollIntervalInMs: 10000,
    }),
  });

  const server = new ApolloServer({
    gateway,
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server),
  );

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'UP', gateway: 'Apollo Federation' });
  });

  await new Promise<void>((resolve) => httpServer.listen({ port: config.port }, resolve));
  console.log(`🚀 Apollo Gateway ready at http://localhost:${config.port}/graphql`);
}

startGateway().catch((err) => {
  console.error('Failed to start Apollo Gateway:', err);
  process.exit(1);
});
