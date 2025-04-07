import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/auth/user.entity';

export const GetUser = createParamDecorator(
  (_, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();

    return request.user;
  },
);
