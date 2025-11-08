//Сервис верхнего уровня приложения.
// AppService — это базовый сервис, который используется контроллером AppController.
// Метод getHello() возвращает простое сообщение, подтверждающее работу сервера.
// В данном случае строка 'Students Skill Tracker API' служит индикатором,
//что API успешно запущено и отвечает на запросы.

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Students Skill Tracker API';
  }
}
