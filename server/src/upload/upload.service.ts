// Сервис для загрузки файлов пользователей на Yandex Cloud Object Storage
// Предоставляет функциональность для загрузки файлов с валидацией типа и размера
// и сохранения их в Yandex Cloud S3-совместимом хранилище

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { YandexCloudConfig } from '../config/yandex-cloud.config';
import type { MulterFile } from './types';
import { PrismaService } from '../prisma/prisma.service';
// Импорт Sharp для оптимизации изображений
import sharp from 'sharp';
// Импорт модулей для работы с ZIP (Office файлы)
import AdmZip from 'adm-zip';

// Интерфейсы для типизации AdmZip
interface AdmZipEntry {
  isDirectory: boolean;
  entryName: string;
  getData: () => Buffer;
  header?: { method?: number };
}

interface AdmZipInterface {
  getEntries: () => AdmZipEntry[];
  addFile: (name: string, data: Buffer) => void;
  toBuffer: () => Buffer;
}

export interface UploadFileResult {
  success: boolean;
  url: string;
  key: string;
  fileName: string;
  size: number;
  contentType: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10 MB
  private readonly allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    // Word документы - различные варианты MIME-типов
    'application/msword', // .doc (старый формат)
    'application/vnd.ms-word', // .doc (альтернативный)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.wordprocessingml', // .docx (без .document)
    // Excel документы
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
    // PowerPoint документы
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    // Текстовые файлы
    'text/plain',
    'text/rtf', // Rich Text Format
    // Google Docs (обычно не используются при загрузке, но на всякий случай)
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    // Для файлов с неизвестным или неправильно определенным MIME-типом
    'application/octet-stream',
    'application/x-msdownload', // Иногда используется для .doc
  ];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const config = this.configService.get<YandexCloudConfig>('yandexCloud')!;

    // Для Yandex Cloud Object Storage нужны специальные настройки
    // Убеждаемся, что endpoint не содержит trailing slash
    const endpoint = config.endpoint.replace(/\/$/, '');

    this.s3Client = new S3Client({
      region: config.region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Обязательно для Yandex Cloud
      // Отключаем автоматическое добавление региона в URL
      useAccelerateEndpoint: false,
    });

    // Логируем конфигурацию (без секретных данных)
    this.logger.log(
      `S3Client initialized for Yandex Cloud: endpoint=${endpoint}, region=${config.region}, bucket=${config.bucketName}`,
    );
  }

  /**
   * Загружает файл на Yandex Cloud Object Storage
   * @param file - Файл для загрузки (Express.Multer.File)
   * @param userId - ID пользователя для организации структуры папок
   * @param folder - Опциональная папка для организации файлов
   * @returns Promise<UploadFileResult> - Результат загрузки с URL файла
   */
  async uploadFile(
    file: MulterFile,
    userId: number,
    folder?: string,
  ): Promise<UploadFileResult> {
    // Валидация размера файла
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Файл слишком большой. Максимальный размер: ${this.maxFileSize / 1024 / 1024} MB`,
      );
    }

    // Валидация типа файла
    // Получаем расширение файла для дополнительной проверки
    const fileExtension =
      file.originalname.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'xlsm',
      'ppt',
      'pptx',
      'txt',
      'rtf',
      'docs', // Google Docs файлы
    ];

    // Логируем информацию о файле для отладки
    this.logger.log(
      `Validating file: name=${file.originalname}, extension=${fileExtension}, mimetype=${file.mimetype}, size=${file.size}`,
    );

    // Проверяем MIME-тип или расширение файла
    const isValidMimeType = this.allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(fileExtension);

    this.logger.debug(
      `File validation: isValidMimeType=${isValidMimeType}, isValidExtension=${isValidExtension}`,
    );

    if (!isValidMimeType && !isValidExtension) {
      this.logger.warn(
        `File rejected: name=${file.originalname}, extension=${fileExtension}, mimetype=${file.mimetype}`,
      );
      throw new BadRequestException(
        `Тип файла не поддерживается. Получен: ${file.mimetype || 'неизвестный'} (расширение: ${fileExtension}). Разрешенные форматы: ${allowedExtensions.join(', ')}`,
      );
    }

    // Если MIME-тип не определен правильно, но расширение валидно, используем расширение для определения ContentType
    let contentType = file.mimetype;
    if (!isValidMimeType && isValidExtension) {
      // Определяем ContentType по расширению
      const extensionToMimeType: Record<string, string> = {
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        pdf: 'application/pdf',
        txt: 'text/plain',
        rtf: 'text/rtf',
      };
      contentType =
        extensionToMimeType[fileExtension] ||
        file.mimetype ||
        'application/octet-stream';
      this.logger.log(
        `MIME type corrected: original=${file.mimetype}, corrected=${contentType} based on extension ${fileExtension}`,
      );
    }

    try {
      const config = this.configService.get<YandexCloudConfig>('yandexCloud')!;

      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop() || 'file';
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;

      // Формируем путь к файлу: users/{userId}/{folder}/{fileName}
      const folderPath = folder ? `${folder}/` : '';
      const key = `users/${userId}/${folderPath}${fileName}`;

      // Обрабатываем оригинальное имя файла для правильной работы с русскими буквами
      let originalFileName = file.originalname;

      // Multer может передавать имена файлов в разных кодировках
      // Пытаемся правильно декодировать имя файла
      try {
        // Если имя содержит URL-encoded символы (например, %D0%9F для русских букв), декодируем
        if (originalFileName.includes('%')) {
          try {
            const decoded = decodeURIComponent(originalFileName);
            // Проверяем, что декодирование дало валидную строку
            if (decoded !== originalFileName) {
              originalFileName = decoded;
            }
          } catch {
            // Если decodeURIComponent не сработал, пробуем декодировать только безопасные части
            try {
              // Пробуем декодировать через escape/unescape для совместимости
              originalFileName = originalFileName.replace(
                /%([0-9A-F]{2})/gi,
                (_match, hex: string) => {
                  return String.fromCharCode(parseInt(hex, 16));
                },
              );
            } catch {
              // Если декодирование не удалось, используем оригинальное имя
            }
          }
        }

        // Дополнительная обработка: если имя файла выглядит как неправильно закодированное
        // (содержит последовательности типа \uXXXX или похожие), пробуем исправить
        // Проверяем, не является ли имя файла в неправильной кодировке (например, latin1 вместо utf8)
        try {
          // Если имя файла содержит символы, которые выглядят как неправильно декодированные UTF-8
          // (например, последовательности типа Ð, Ñ, Ò), пробуем перекодировать
          const buffer = Buffer.from(originalFileName, 'latin1');
          const utf8Name = buffer.toString('utf8');
          
          // Проверяем, содержит ли перекодированное имя валидные UTF-8 символы
          // и отличается ли оно от оригинала
          if (utf8Name !== originalFileName && /[\u0400-\u04FF]/.test(utf8Name)) {
            // Если содержит кириллицу, используем перекодированное имя
            originalFileName = utf8Name;
          }
        } catch (recodeError) {
          // Если перекодирование не удалось, используем оригинальное имя
        }
      } catch (e) {
        // Если все попытки не удались, используем оригинальное имя
        this.logger.warn(`Could not process filename: ${originalFileName}`, e);
      }

      // Кодируем имя файла для безопасного хранения в метаданных S3
      // S3 метаданные должны быть в ASCII, поэтому используем base64 для не-ASCII символов
      // S3 автоматически преобразует ключи метаданных в lowercase, поэтому используем lowercase
      const encodedOriginalName = Buffer.from(
        originalFileName,
        'utf8',
      ).toString('base64');

      // Оптимизация изображений перед загрузкой (если установлен Sharp)
      let fileBuffer = file.buffer;
      const finalContentType = contentType;
      const isImage = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ].includes(contentType);

      if (isImage) {
        try {
          const image = sharp(file.buffer);

          // Оптимизируем изображение
          let optimizedImage = image;

          // Для JPEG - оптимизация качества
          if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
            optimizedImage = image.jpeg({
              quality: 85, // Качество 85 - хороший баланс между размером и качеством
              mozjpeg: true, // Используем mozjpeg для лучшего сжатия
              progressive: true, // Прогрессивный JPEG
            });
          }

          // Для PNG - оптимизация без потери качества
          else if (contentType === 'image/png') {
            optimizedImage = image.png({
              compressionLevel: 9, // Максимальное сжатие
              adaptiveFiltering: true,
              palette: true, // Попытка использовать палитру для уменьшения размера
            });
          }

          // Для WebP - оставляем как есть (уже оптимизирован)
          // Можно конвертировать все изображения в WebP для экономии места
          // optimizedImage = image.webp({ quality: 85 });
          // finalContentType = 'image/webp';

          // Для GIF - оставляем как есть (сжатие GIF сложнее)

          // Получаем оптимизированный буфер
          fileBuffer = await optimizedImage.toBuffer();

          const originalSize = file.size;
          const optimizedSize = fileBuffer.length;
          const savings = (
            ((originalSize - optimizedSize) / originalSize) *
            100
          ).toFixed(2);

          this.logger.log(
            `Image optimized: ${originalSize} bytes -> ${optimizedSize} bytes (${savings}% reduction)`,
          );
        } catch (optimizeError) {
          // Если оптимизация не удалась, используем оригинальный файл
          this.logger.warn(
            `Image optimization failed, using original: ${optimizeError}`,
          );
          fileBuffer = file.buffer;
        }
      }

      // Оптимизация Office файлов (.docx, .xlsx, .pptx - это ZIP-архивы)
      const isOfficeFile = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.wordprocessingml', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      ].includes(contentType);

      // Также проверяем по расширению файла на случай неправильного MIME-типа
      // Используем уже объявленную переменную fileExtension
      const isOfficeByExtension = ['docx', 'xlsx', 'pptx'].includes(
        fileExtension,
      );

      if ((isOfficeFile || isOfficeByExtension) && fileBuffer.length > 0) {
        this.logger.debug(
          `Attempting to optimize Office file: contentType=${contentType}, extension=${fileExtension}, size=${fileBuffer.length}`,
        );

        try {
          // Проверяем, что это действительно ZIP-архив (Office файлы начинаются с PK)
          const isZipArchive = fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b; // PK (ZIP signature)

          if (!isZipArchive) {
            this.logger.debug(
              'File is not a ZIP archive, skipping Office optimization',
            );
          } else {
            this.logger.debug(
              'File is a ZIP archive, starting optimization...',
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const originalZip = new AdmZip(
              fileBuffer,
            ) as unknown as AdmZipInterface;
            const entries = originalZip.getEntries();

            this.logger.debug(`Found ${entries.length} entries in ZIP archive`);

            // Создаем новый архив
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const optimizedZip = new AdmZip() as unknown as AdmZipInterface;
            let uncompressedCount = 0;
            let compressedCount = 0;

            for (const entry of entries) {
              // Пропускаем папки
              if (entry.isDirectory) {
                optimizedZip.addFile(entry.entryName, Buffer.alloc(0));
                continue;
              }

              const data = entry.getData();
              const method = entry.header?.method || 0;

              // Пересжимаем все файлы для максимального сжатия
              // Если файл не сжат (method 0 = stored) или сжат слабо, пересжимаем
              if (method === 0) {
                // Файл не сжат, добавляем для сжатия
                optimizedZip.addFile(entry.entryName, data);
                uncompressedCount++;
              } else {
                // Файл уже сжат, но пересоздаем архив для оптимизации структуры
                optimizedZip.addFile(entry.entryName, data);
                compressedCount++;
              }
            }

            this.logger.debug(
              `Office file processing: ${uncompressedCount} uncompressed, ${compressedCount} already compressed`,
            );

            // Всегда создаем новый архив для оптимизации
            const optimizedBuffer = optimizedZip.toBuffer();

            // Проверяем, что пересжатие дало результат
            if (optimizedBuffer.length < fileBuffer.length) {
              const originalSize = fileBuffer.length;
              const optimizedSize = optimizedBuffer.length;
              const savings = (
                ((originalSize - optimizedSize) / originalSize) *
                100
              ).toFixed(2);

              this.logger.log(
                `Office file optimized: ${originalSize} bytes -> ${optimizedSize} bytes (${savings}% reduction)`,
              );

              fileBuffer = optimizedBuffer;
            } else {
              // Если размер не уменьшился, оставляем оригинал
              this.logger.debug(
                `Office file compression did not reduce size: ${fileBuffer.length} -> ${optimizedBuffer.length}, keeping original`,
              );
            }
          }
        } catch (officeOptimizeError) {
          // Если оптимизация не удалась, используем оригинальный файл
          this.logger.warn(
            `Office file optimization failed, using original: ${officeOptimizeError}`,
          );
          if (officeOptimizeError instanceof Error) {
            this.logger.warn(`Error details: ${officeOptimizeError.message}`);
            this.logger.warn(`Error stack: ${officeOptimizeError.stack}`);
          }
          // fileBuffer остается без изменений
        }
      } else {
        this.logger.debug(
          `Skipping Office optimization: isOfficeFile=${isOfficeFile}, isOfficeByExtension=${isOfficeByExtension}, contentType=${contentType}`,
        );
      }

      // Параметры для загрузки
      const uploadParams: PutObjectCommandInput = {
        Bucket: config.bucketName,
        Key: key,
        Body: fileBuffer, // Используем оптимизированный буфер
        ContentType: finalContentType, // Используем исправленный ContentType
        // Метаданные - сохраняем оригинальное имя в base64 для поддержки русских букв
        // Используем lowercase ключи, так как S3 автоматически преобразует их
        Metadata: {
          originalname: encodedOriginalName, // Сохраняем в base64 (lowercase для S3)
          originalnameencoded: 'base64', // Флаг, что имя закодировано (lowercase для S3)
          uploadedby: userId.toString(),
          uploadedat: new Date().toISOString(),
        },
      };

      // Загружаем файл
      const command = new PutObjectCommand(uploadParams);

      // Логируем детали перед загрузкой (для отладки)
      this.logger.debug(
        `Uploading file: bucket=${config.bucketName}, key=${key}, size=${file.size}, contentType=${contentType} (original=${file.mimetype})`,
      );

      await this.s3Client.send(command);

      // Сохраняем информацию о файле в БД
      try {
        await this.prisma.userFile.create({
          data: {
            userId: userId,
            fileName: originalFileName,
            fileKey: key,
            fileSize: BigInt(fileBuffer.length),
            contentType: finalContentType,
            folder: folder || null,
          },
        });
      } catch (dbError) {
        // Логируем ошибку, но не прерываем процесс загрузки
        this.logger.error(
          `Failed to save file record to DB: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        );
      }

      // Формируем публичный URL (или можно использовать подписанный URL)
      const url = `${config.endpoint}/${config.bucketName}/${key}`;

      this.logger.log(`File uploaded successfully: ${key} by user ${userId}`);

      return {
        success: true,
        url,
        key,
        fileName: originalFileName, // Используем обработанное имя
        size: fileBuffer.length, // Используем размер оптимизированного файла
        contentType: finalContentType, // Используем финальный ContentType
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Детальное логирование ошибки для диагностики
      this.logger.error(`Error uploading file: ${errorMessage}`, error);

      if (error instanceof Error) {
        this.logger.error(`Error stack: ${error.stack}`);

        // Проверяем специфичные ошибки Yandex Cloud
        if (errorMessage.includes('signature')) {
          this.logger.error(
            'Signature error detected. Check: 1) Credentials are correct, 2) Endpoint is correct, 3) Region matches bucket region',
          );
        }
      }

      throw new BadRequestException(
        `Ошибка при загрузке файла: ${errorMessage}`,
      );
    }
  }

  /**
   * Загружает несколько файлов
   * @param files - Массив файлов
   * @param userId - ID пользователя
   * @param folder - Опциональная папка
   * @returns Promise<UploadFileResult[]> - Массив результатов загрузки
   */
  async uploadMultipleFiles(
    files: MulterFile[],
    userId: number,
    folder?: string,
  ): Promise<UploadFileResult[]> {
    const results: UploadFileResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, userId, folder);
        results.push(result);
      } catch (error) {
        this.logger.error(`Error uploading file ${file.originalname}:`, error);
        // Продолжаем загрузку остальных файлов
        results.push({
          success: false,
          url: '',
          key: '',
          fileName: file.originalname,
          size: file.size,
          contentType: file.mimetype,
        });
      }
    }

    return results;
  }

  /**
   * Удаляет файл из Yandex Cloud Object Storage
   * @param key - Ключ файла (путь в хранилище)
   * @param userId - ID пользователя для проверки прав доступа (опционально для админа)
   * @param skipOwnershipCheck - Пропустить проверку принадлежности (для админа)
   * @returns Promise<boolean> - true если файл успешно удален
   */
  async deleteFile(
    key: string,
    userId?: number,
    skipOwnershipCheck = false,
  ): Promise<boolean> {
    try {
      // Проверяем, что файл принадлежит пользователю (если не админ)
      if (
        !skipOwnershipCheck &&
        userId &&
        !key.startsWith(`users/${userId}/`)
      ) {
        throw new BadRequestException('Нет доступа к этому файлу');
      }

      const config = this.configService.get<YandexCloudConfig>('yandexCloud')!;

      const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      // Удаляем запись о файле из БД
      try {
        await this.prisma.userFile.deleteMany({
          where: {
            fileKey: key,
          },
        });
        this.logger.debug(`File record deleted from DB: ${key}`);
      } catch (dbError) {
        // Логируем ошибку, но не прерываем процесс удаления
        this.logger.error(
          `Failed to delete file record from DB: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        );
      }

      this.logger.log(
        `File deleted successfully: ${key} by user ${userId || 'admin'}`,
      );

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting file: ${errorMessage}`, error);
      throw new BadRequestException(
        `Ошибка при удалении файла: ${errorMessage}`,
      );
    }
  }

  /**
   * Получает список файлов пользователя
   * @param userId - ID пользователя
   * @param folder - Опциональная папка для фильтрации
   * @returns Promise<Array<{key: string, fileName: string, size: number, lastModified: Date}>> - Список файлов
   */
  async getUserFiles(
    userId: number,
    folder?: string,
  ): Promise<
    Array<{
      key: string;
      fileName: string;
      size: number;
      lastModified: Date;
      contentType?: string;
    }>
  > {
    try {
      // Сначала пытаемся получить файлы из БД (быстрее)
      try {
        const dbFiles = await this.prisma.userFile.findMany({
          where: {
            userId: userId,
            ...(folder ? { folder: folder } : {}),
          },
          orderBy: {
            created_at: 'desc',
          },
        });

        if (dbFiles.length > 0) {
          return dbFiles.map((file) => ({
            key: file.fileKey,
            fileName: file.fileName,
            size: Number(file.fileSize),
            lastModified: file.created_at,
            contentType: file.contentType || undefined,
          }));
        }
      } catch (dbError) {
        // Если БД недоступна или таблица не создана, продолжаем с S3
        this.logger.warn(
          `Could not get files from DB, falling back to S3: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        );
      }

      // Fallback: получаем из S3 (для обратной совместимости)
      const config = this.configService.get<YandexCloudConfig>('yandexCloud')!;

      const prefix = folder ? `users/${userId}/${folder}/` : `users/${userId}/`;

      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      // Получаем метаданные для каждого файла, чтобы извлечь оригинальное имя
      const filesWithMetadata = await Promise.all(
        response.Contents.map(async (object) => {
          if (!object.Key) {
            return null;
          }

          try {
            // Получаем метаданные файла через HeadObjectCommand
            const headObjectCommand = new HeadObjectCommand({
              Bucket: config.bucketName,
              Key: object.Key,
            });

            let fileName = '';
            try {
              const headResponse = await this.s3Client.send(headObjectCommand);
              const metadata = headResponse.Metadata || {};

              // S3 может возвращать ключи метаданных в lowercase
              // Проверяем оба варианта (с заглавной и строчной буквы)
              // S3 автоматически преобразует ключи метаданных в lowercase при чтении
              const originalNameKey = metadata.originalname || '';
              const encodedFlagKey = metadata.originalnameencoded || '';

              // Проверяем, закодировано ли имя в base64
              if (encodedFlagKey === 'base64' && originalNameKey) {
                // Декодируем из base64
                try {
                  fileName = Buffer.from(originalNameKey, 'base64').toString(
                    'utf8',
                  );
                  this.logger.debug(
                    `Decoded filename from base64: ${fileName}`,
                  );
                } catch (decodeError) {
                  this.logger.warn(
                    `Failed to decode base64 filename: ${originalNameKey}`,
                    decodeError,
                  );
                  // Если декодирование не удалось, используем как есть
                  fileName = originalNameKey;
                }
              } else if (originalNameKey) {
                // Используем как есть, если не закодировано (для обратной совместимости)
                fileName = originalNameKey;
              } else {
                // Если метаданных нет, извлекаем из ключа
                const keyParts = object.Key.split('/');
                fileName = keyParts[keyParts.length - 1] || object.Key;
              }
            } catch (headError) {
              // Если не удалось получить метаданные, используем имя из ключа
              const keyParts = object.Key.split('/');
              fileName = keyParts[keyParts.length - 1] || object.Key;
              this.logger.warn(
                `Could not get metadata for ${object.Key}: ${headError}`,
              );
            }

            return {
              key: object.Key,
              fileName,
              size: object.Size || 0,
              lastModified: object.LastModified || new Date(),
              contentType: undefined,
            };
          } catch (error) {
            this.logger.error(`Error processing file ${object.Key}:`, error);
            // В случае ошибки возвращаем базовую информацию
            const keyParts = object.Key?.split('/') || [];
            return {
              key: object.Key || '',
              fileName: keyParts[keyParts.length - 1] || object.Key || '',
              size: object.Size || 0,
              lastModified: object.LastModified || new Date(),
              contentType: undefined,
            };
          }
        }),
      );

      return filesWithMetadata.filter((file) => file !== null) as Array<{
        key: string;
        fileName: string;
        size: number;
        lastModified: Date;
        contentType?: string;
      }>;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting user files: ${errorMessage}`, error);
      throw new BadRequestException(
        `Ошибка при получении списка файлов: ${errorMessage}`,
      );
    }
  }

  /**
   * Получает подписанный URL для скачивания файла
   * @param key - Ключ файла
   * @param userId - ID пользователя для проверки прав доступа (опционально для админа)
   * @param skipOwnershipCheck - Пропустить проверку принадлежности (для админа)
   * @returns Promise<string> - Подписанный URL
   */
  async getDownloadUrl(
    key: string,
    userId?: number,
    skipOwnershipCheck = false,
  ): Promise<string> {
    try {
      // Проверяем, что файл принадлежит пользователю (если не админ)
      if (
        !skipOwnershipCheck &&
        userId &&
        !key.startsWith(`users/${userId}/`)
      ) {
        throw new BadRequestException('Нет доступа к этому файлу');
      }

      const config = this.configService.get<YandexCloudConfig>('yandexCloud')!;

      // Извлекаем имя файла из ключа
      // Не запрашиваем метаданные, чтобы избежать задержек и ошибок
      const keyParts = key.split('/');
      const fileName = keyParts[keyParts.length - 1] || key;

      // Кодируем имя файла для заголовка Content-Disposition
      // Используем простую кодировку для совместимости
      // Заменяем специальные символы на подчеркивания для безопасности
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const contentDisposition = `attachment; filename="${safeFileName}"`;

      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ResponseContentDisposition: contentDisposition,
      });

      // Создаем подписанный URL, действительный в течение 1 часа
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 час
      });

      return signedUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting download URL: ${errorMessage}`, error);
      throw new BadRequestException(
        `Ошибка при получении ссылки на файл: ${errorMessage}`,
      );
    }
  }
}
