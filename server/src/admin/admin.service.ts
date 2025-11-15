//Группируем студентов по учебным группам и предоставляем полную историю их тестирования для преподавателя
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestResult, StudentWithTests } from '../auth/types/user.types';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async getResultsGroupedByGroup() {
    // 🔹 Функция для расчёта максимального количества баллов по количеству вопросов
    const computeMaxPointsByCount = (count?: number | null) => {
      if (count === 10) return 100;
      if (count === 15) return 100;
      return null;
    };

    // 🔹 Получаем всех пользователей из базы с нужными полями
    // Включаем всех пользователей, не только тех, у кого есть результаты тестов
    // Это нужно, чтобы показывать файлы даже у студентов без тестов
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        groupNumber: true,
        testResults: true,
      },
      where: {
        role: {
          not: 'admin', // Исключаем админов из списка студентов
        },
      },
    });

    // 🔹 Обрабатываем всех пользователей (не только с результатами тестов)
    // Это позволяет показывать файлы даже у студентов без тестов
    const processedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      groupNumber: u.groupNumber,
      testResults: Array.isArray(u.testResults) ? u.testResults : [],
    }));

    // 🔹 Возвращаем все результаты тестов студента, отсортированные по дате (от новых к старым)
    const getAllTestResults = (results: unknown[]): TestResult[] => {
      return results
        .map((r: unknown): TestResult => {
          const result = r as Record<string, unknown>;
          return {
            grade:
              (typeof result.grade === 'number' ? result.grade : null) ?? null,
            completed_at: (result.completed_at as string | Date | null) ?? null,
            test_code:
              (typeof result.test_code === 'string'
                ? result.test_code
                : null) ?? null,
            answers_details:
              (Array.isArray(result.answers_details)
                ? result.answers_details
                : []) ?? [],
            score:
              (typeof result.score === 'number' ? result.score : null) ?? null,
            total_questions:
              (typeof result.total_questions === 'number'
                ? result.total_questions
                : null) ?? null,
            variant:
              (typeof result.variant === 'number' ? result.variant : null) ??
              null,
            max_points:
              (typeof result.max_points === 'number'
                ? result.max_points
                : null) ??
              computeMaxPointsByCount(
                typeof result.total_questions === 'number'
                  ? result.total_questions
                  : null,
              ),
          };
        })
        .sort((a, b) => {
          const at = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0;
          return bt - at; // От новых к старым
        });
    };

    const groupsMap = new Map<string, StudentWithTests[]>();
    const noGroup: StudentWithTests[] = [];

    // 🔹 Формируем список студентов со всеми результатами тестов и файлами
    // Включаем всех студентов, даже без результатов тестов (чтобы показать их файлы)
    for (const u of processedUsers) {
      const allResults = getAllTestResults(u.testResults);

      // Получаем файлы студента
      const files = await this.getStudentFiles(u.id);
      
      this.logger.debug(
        `Student ${u.id} (${u.fullName}): ${allResults.length} tests, ${files.length} files`,
      );

      // Показываем студента, если у него есть тесты ИЛИ файлы
      if (allResults.length === 0 && files.length === 0) {
        // Пропускаем студентов без тестов и без файлов
        continue;
      }

      // Преобразуем даты в строки для правильной сериализации JSON
      const filesWithSerializedDates = files.map((file) => ({
        ...file,
        lastModified:
          file.lastModified instanceof Date
            ? file.lastModified.toISOString()
            : typeof file.lastModified === 'string'
              ? file.lastModified
              : new Date(file.lastModified).toISOString(),
      }));

      const student: StudentWithTests & {
        files?: Array<{
          key: string;
          fileName: string;
          size: number;
          lastModified: string; // Изменено на string для сериализации
          contentType?: string;
        }>;
      } = {
        id: u.id,
        email: u.email,
        fullName: u.fullName || '',
        groupNumber: u.groupNumber || '',
        tests: allResults, // 👈 теперь у студента массив всех пройденных тестов
        files: filesWithSerializedDates, // 👈 добавляем файлы студента с сериализованными датами
      };

      const key = (u.groupNumber || '').trim();
      if (!key) {
        noGroup.push(student);
      } else {
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(student);
      }
    }

    // 🔹 Сортируем студентов внутри каждой группы по имени
    for (const [, arr] of groupsMap.entries()) {
      arr.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    // 🔹 Сортируем студентов без группы
    noGroup.sort((a, b) => a.fullName.localeCompare(b.fullName));

    // 🔹 Сортируем группы по номеру (если число — по числу, если нет — по строке)
    const groups = Array.from(groupsMap.entries())
      .map(([groupNumber, students]) => ({ groupNumber, students }))
      .sort((a, b) => {
        const na = Number(a.groupNumber);
        const nb = Number(b.groupNumber);
        const aIsNum = !Number.isNaN(na);
        const bIsNum = !Number.isNaN(nb);
        if (aIsNum && bIsNum) return na - nb;
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return a.groupNumber.localeCompare(b.groupNumber);
      });

    // 🔹 Возвращаем сгруппированные результаты
    return { groups, noGroup };
  }

  /**
   * Получает список файлов студента (для админа)
   * @param studentId - ID студента
   * @returns Promise с массивом файлов
   */
  async getStudentFiles(studentId: number) {
    try {
      this.logger.debug(`Getting files for student ${studentId}`);
      const files = await this.uploadService.getUserFiles(studentId);
      // Логируем для отладки
      if (files && files.length > 0) {
        this.logger.log(
          `Found ${files.length} files for student ${studentId}:`,
          files.map((f) => ({ name: f.fileName, key: f.key, size: f.size })),
        );
      } else {
        this.logger.debug(`No files found for student ${studentId}`);
      }
      return files || [];
    } catch (error) {
      // Логируем ошибку для отладки
      this.logger.error(
        `Error getting files for student ${studentId}:`,
        error instanceof Error ? error.message : String(error),
      );
      // Если файлов нет или произошла ошибка, возвращаем пустой массив
      return [];
    }
  }

  /**
   * Удаляет файл студента (для админа)
   * @param key - Ключ файла
   * @returns Promise<boolean>
   */
  async deleteStudentFile(key: string): Promise<boolean> {
    // Для админа используем метод uploadService с пропуском проверки принадлежности
    return this.uploadService.deleteFile(key, undefined, true);
  }

  /**
   * Получает URL для скачивания файла студента (для админа)
   * @param key - Ключ файла
   * @returns Promise<string> - URL для скачивания
   */
  async getStudentFileDownloadUrl(key: string): Promise<string> {
    // Используем uploadService для получения URL
    // Для админа пропускаем проверку принадлежности
    return this.uploadService.getDownloadUrl(key, 0, true);
  }

  /**
   * Удаляет пользователя и все его файлы (для админа)
   * @param userId - ID пользователя
   * @returns Promise<boolean> - true если пользователь успешно удален
   */
  async deleteUser(userId: number): Promise<boolean> {
    try {
      this.logger.log(`Deleting user ${userId} and all associated files`);

      // Проверяем, что пользователь существует и не является админом
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        throw new Error('Пользователь не найден');
      }

      if (user.role === 'admin') {
        this.logger.warn(`Attempt to delete admin user ${userId}`);
        throw new Error('Нельзя удалить администратора');
      }

      // Получаем все файлы пользователя
      const files = await this.getStudentFiles(userId);
      this.logger.debug(`Found ${files.length} files for user ${userId}`);

      // Удаляем все файлы из S3
      for (const file of files) {
        try {
          await this.deleteStudentFile(file.key);
          this.logger.debug(`Deleted file: ${file.key}`);
        } catch (error) {
          this.logger.error(
            `Error deleting file ${file.key}: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Продолжаем удаление остальных файлов даже если один не удалился
        }
      }

      // Удаляем пользователя из БД (файлы удалятся автоматически через cascade)
      await this.prisma.user.delete({
        where: { id: userId },
      });

      this.logger.log(`User ${userId} (${user.email}) deleted successfully`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting user ${userId}: ${errorMessage}`, error);
      throw error;
    }
  }
}
