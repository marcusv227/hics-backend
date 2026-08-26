import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerBasicAuth } from './common/swagger-basic-auth.middleware';

const SWAGGER_PATH = 'api/docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;
  if (process.env.NODE_ENV === 'production' && swaggerUser && swaggerPassword) {
    app.use(
      [`/${SWAGGER_PATH}`, `/${SWAGGER_PATH}-json`, `/${SWAGGER_PATH}-yaml`],
      swaggerBasicAuth(swaggerUser, swaggerPassword),
    );
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HICS API')
    .setDescription('Hub Integrado de Capacitação em Saúde — API REST')
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local')
    .addServer('https://api.hicstcc.online', 'Produção (Cloudflare Tunnel)')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
