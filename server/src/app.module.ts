import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModule } from './post/post.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageController } from './image/image.controller';
import { ImageModule } from './image/image.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FavoriteModule } from './favorite/favorite.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables from .env file
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432, // default PostgreSQL port
      username: 'jkun', // replace with your PostgreSQL username
      password: 'a1234', // replace with your PostgreSQL password
      database: 'matzip-server', // replace with your PostgreSQL database name
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // path to your entities
      synchronize: true, // set to false in production
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
    }),
    PostModule,
    AuthModule,
    ImageModule,
    FavoriteModule,
  ],
  providers: [ConfigService],
  controllers: [ImageController],
})
export class AppModule {}
