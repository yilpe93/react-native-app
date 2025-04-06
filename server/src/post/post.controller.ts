import { CreatePostDto } from './dto/create-post.dto';
import { PostService } from './post.service';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Get('/posts')
  getPosts(@Query('page') page: number) {
    return this.postService.getPosts(page);
  }

  @Post('/posts')
  createPost(@Body() createPostDto: CreatePostDto) {
    return this.postService.createPost(createPostDto);
  }
}
