import { AuthService } from './auth.service';
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { GetUser } from 'src/@common/decorators/get-user.decorator';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signup(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.signup(authDto);
  }

  @Post('/signin')
  signin(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.signin(authDto);
  }

  @Get('/refresh')
  /** JWT 인증 Guard를 사용하여 인증된 사용자만 접근 가능 */
  /** @GetUser() 데코레이터를 사용하여 인증된 사용자 정보를 가져옴 */
  @UseGuards(AuthGuard())
  refresh(@GetUser() user: User) {
    return this.authService.refreshToken(user);
  }
}
