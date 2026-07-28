import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') || 4000;
  const frontendUrl = config.get<string>('app.frontendUrl') || 'http://localhost:5173';
  const nodeEnv = config.get<string>('app.nodeEnv') || 'development';

  // ─── Security headers ───────────────────────────────
  app.use(helmet());

  // ─── Compression ────────────────────────────────────
  app.use(compression());

  // ─── CORS ────────────────────────────────────────────
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ─── API Prefix ──────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Global Validation Pipe ──────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip non-decorated properties
      forbidNonWhitelisted: true, // Throw if extra properties passed
      transform: true,           // Auto-transform to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger API Documentation ───────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SuperBento ERP API')
      .setDescription('Enterprise ERP for Nutrition & Diet Meal Subscription')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Users')
      .addTag('Roles')
      .addTag('Permissions')
      .addTag('Notifications')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }

  // ─── WebSocket adapter ───────────────────────────────
  // Socket.IO is already configured via @WebSocketGateway decorator

  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║          🍱  SuperBento ERP API Server             ║
  ╠═══════════════════════════════════════════════════╣
  ║  Environment : ${nodeEnv.padEnd(33)}║
  ║  Port        : ${String(port).padEnd(33)}║
  ║  URL         : http://localhost:${String(port).padEnd(18)}║
  ╚═══════════════════════════════════════════════════╝
  `);
}

bootstrap();
