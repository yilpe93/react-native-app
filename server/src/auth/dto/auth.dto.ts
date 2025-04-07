import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AuthDto {
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: '이메일 형식이 아닙니다.',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  //   @Matches(/^[a-zA-z0-9!@#$%^&*]{8,50}$/, {
  //     message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.',
  //   })
  @Matches(/^[a-zA-z0-9]*$/, {
    message: '비밀번호가 영어 또는 숫자 조합이 아닙니다.',
  })
  password: string;
}
