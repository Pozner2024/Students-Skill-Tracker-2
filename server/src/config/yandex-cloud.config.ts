//Конфигурация для интеграции с Yandex Cloud Object Storage
//Этот конфигурационный файл предоставляет настройки для подключения
//к Yandex Cloud S3-совместимому хранилищу. Используется для загрузки
//и хранения файлов (аватарки, документы, медиа-файлы).

import { registerAs } from '@nestjs/config';

export interface YandexCloudConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  endpoint: string;
}

export default registerAs('yandexCloud', (): YandexCloudConfig => {
  const accessKeyId = process.env.YANDEX_CLOUD_ACCESS_KEY_ID;
  const secretAccessKey = process.env.YANDEX_CLOUD_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'Yandex Cloud credentials are required. Please set YANDEX_CLOUD_ACCESS_KEY_ID and YANDEX_CLOUD_SECRET_ACCESS_KEY environment variables.',
    );
  }

  // Проверяем, что credentials не пустые
  if (accessKeyId.trim() === '' || secretAccessKey.trim() === '') {
    throw new Error(
      'Yandex Cloud credentials cannot be empty. Please check your environment variables.',
    );
  }

  const endpoint = (process.env.YANDEX_CLOUD_ENDPOINT || 'https://storage.yandexcloud.net').replace(/\/$/, '');
  
  // Альтернативный endpoint для Yandex Cloud: https://s3.yandexcloud.net
  // Если storage.yandexcloud.net не работает, попробуйте использовать s3.yandexcloud.net

  return {
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
    region: process.env.YANDEX_CLOUD_REGION || 'ru-central1',
    bucketName:
      process.env.YANDEX_CLOUD_BUCKET_NAME || 'students-skill-tracker',
    endpoint,
  };
});
