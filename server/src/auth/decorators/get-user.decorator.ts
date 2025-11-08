//Кастомный декоратор @GetUser()
// Позволяет легко получать данные текущего авторизованного пользователя из объекта запроса.
// Работает в связке с JwtAuthGuard или другими guard'ами, которые добавляют user в request.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../types/user.types';

interface RequestWithUser {
  user: JwtUser;
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
