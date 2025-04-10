/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthDto } from './dto/auth.dto';
import { EditProfileDto } from './dto/edit.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MarkerColor } from 'src/post/marker-color.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /** JWT를 생성하는 함수 */
  private async getTokens(payload: { email: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /** refreshToken을 암호화하여 DB에 업데이트 하는 함수 */
  private async updateRefreshToken(id: number, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    try {
      await this.userRepository.update(id, {
        hashedRefreshToken,
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'refreshToken 업데이트 도중 에러가 발생했습니다.',
      );
    }
  }

  async signup(authDto: AuthDto) {
    const { email, password } = authDto;

    /** 비밀번호를 보호하기 위한 랜덤 데이터 */
    const salt = await bcrypt.genSalt();
    /** 암호화된 비밀번호 */
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      loginType: 'email',
      nickname: email,
    });

    try {
      await this.userRepository.save(user);
    } catch (error) {
      /** code 23505:
       *  - unique constraint violation
       *  - unique constraint violation: "user_email_key" (email)
       */
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }

      throw new InternalServerErrorException(
        '회원가입 도중 에러가 발생했습니다.',
      );
    }
  }

  async signin(authDto: AuthDto) {
    const { email, password } = authDto;
    const user = await this.userRepository.findOneBy({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const { accessToken, refreshToken } = await this.getTokens({ email });
    await this.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async refreshToken(user: User) {
    const { email } = user;
    const { accessToken, refreshToken } = await this.getTokens({ email });

    if (!user.hashedRefreshToken) {
      throw new ForbiddenException();
    }

    await this.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  getProfile(user: User) {
    const { password, hashedRefreshToken, ...rest } = user;

    return { ...rest };
  }

  async editProfile(editProfileDto: EditProfileDto, user: User) {
    const profile = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    const { nickname, imageUri } = editProfileDto;

    if (!profile) {
      throw new ForbiddenException('프로필을 찾을 수 없습니다.');
    }

    profile.nickname = nickname;
    profile.imageUri = imageUri;

    try {
      await this.userRepository.save(profile);
    } catch (error) {
      console.error('Error saving profile:', error);
      throw new InternalServerErrorException(
        '프로필을 업데이트하는 도중 에러가 발생했습니다.',
      );
    }
  }

  async deleteRefreshToken(user: User) {
    try {
      await this.userRepository.update(user.id, {
        hashedRefreshToken: null,
      });
    } catch (error) {
      console.error('Error deleting refresh token:', error);
      throw new InternalServerErrorException(
        'refreshToken 삭제 도중 에러가 발생했습니다.',
      );
    }
  }

  async deleteAccount(user: User) {
    try {
      await this.userRepository
        .createQueryBuilder('user')
        .delete()
        .from(User)
        .where('user.id = :id', { id: user.id })
        .execute();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new InternalServerErrorException(
        '회원탈퇴 도중 에러가 발생했습니다.',
      );
    }
  }

  async updateCategory(categories: Record<string, string>, user: User) {
    const { RED, YELLOW, BLUE, GREEN, PURPLE } = MarkerColor;

    if (
      !Object.keys(categories).every((color: MarkerColor) =>
        [RED, YELLOW, BLUE, GREEN, PURPLE].includes(color),
      )
    ) {
      throw new BadRequestException('유효하지 않은 카테고리입니다.');
    }

    user[RED] = categories[RED];
    user[YELLOW] = categories[YELLOW];
    user[BLUE] = categories[BLUE];
    user[GREEN] = categories[GREEN];
    user[PURPLE] = categories[PURPLE];

    try {
      await this.userRepository.save(user);
    } catch (error) {
      console.error('Error updating categories:', error);
      throw new InternalServerErrorException(
        '카테고리 업데이트 도중 에러가 발생했습니다.',
      );
    }

    const { password, hashedRefreshToken, ...rest } = user;

    return { ...rest };
  }
}
