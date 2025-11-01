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
      'Yandex Cloud credentials are required. Please set YANDEX_CLOUD_ACCESS_KEY_ID and YANDEX_CLOUD_SECRET_ACCESS_KEY environment variables.'
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    region: process.env.YANDEX_CLOUD_REGION || 'ru-central1',
    bucketName: process.env.YANDEX_CLOUD_BUCKET_NAME || 'students-skill-tracker',
    endpoint: process.env.YANDEX_CLOUD_ENDPOINT || 'https://storage.yandexcloud.net',
  };
});
