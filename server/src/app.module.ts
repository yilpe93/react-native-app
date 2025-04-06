import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModule } from './post/post.module';

@Module({
  imports: [
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
    PostModule,
  ],
  providers: [],
})
export class AppModule {}
