import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';
import { Config } from './shared/config/config.service';

/**
 * Main application entry point
 * Initializes and configures the NestJS application
 */
async function main(): Promise<void> {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // Get configuration service
  const config = app.get(Config);

  // Use Helmet for secure HTTP headers (X-Frame-Options, X-Content-Type-Options, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: false, // APIs return JSON; CSP configured on web frontends
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Configure CORS - Allows cross-origin requests from specific origins
  app.enableCors({
    origin: [config.backendUrl, config.frontendUrl],
    credentials: true,
  });

  // Enable trust proxy for reverse-proxy environments (Coolify Traefik, Docker)
  // Ensures req.ip reflects the real client IP for rate limiting instead of the proxy container IP.
  // Defaults to 1 (single reverse-proxy hop in Coolify). Can be overridden via TRUST_PROXY env var.
  const trustProxyEnv = process.env.TRUST_PROXY;
  const trustProxyValue = trustProxyEnv
    ? isNaN(Number(trustProxyEnv))
      ? trustProxyEnv
      : Number(trustProxyEnv)
    : 1;
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyValue);

  // Cookie parser, BetterAuth handler, body parser, API prefix, validation pipe
  setupApp(app);

  // Setup Swagger API documentation at /api/docs (non-production only)
  if (config.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(config.name)
      .setDescription(config.description)
      .setVersion(config.version)
      .addServer('/api')
      .addCookieAuth('better-auth.session_token')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Print debug information for development purposes
  if (config.nodeEnv !== 'production') {
    console.log('App configuration:', {
      nodeEnv: config.nodeEnv,
      port: config.port,
      backendUrl: config.backendUrl,
      frontendUrl: config.frontendUrl,
    });
  }

  // Start the application
  await app.listen(config.port);
  console.log(`Application is running on: ${config.backendUrl}`);
}

// Execute the main function
main().catch((error) => console.error('Application error:', error));
