import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import yandexCloudConfig from '../config/yandex-cloud.config';

@Module({
  imports: [ConfigModule.forFeature(yandexCloudConfig)],
  providers: [ImagesService],
  controllers: [ImagesController],
  exports: [ImagesService],
})
export class ImagesModule {}
