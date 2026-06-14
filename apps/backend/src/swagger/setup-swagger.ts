import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Scheduler API')
    .setDescription('REST API aplikacji Scheduler — pracownicy, podkłady i grafiki.')
    .setVersion('1.0')
    .addTag('health', 'Status aplikacji')
    .addTag('workers', 'Zarządzanie pracownikami')
    .addTag('drafts', 'Podkłady grafików od pracowników')
    .addTag('schedules', 'Szablony podkładów i import grafików')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
  });
}
