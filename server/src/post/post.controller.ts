import { CreatePostDto } from './dto/create-post.dto';
import { PostService } from './post.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

@Controller()
export class PostController {
  constructor(private postService: PostService) {}

  @Get('/markers')
  getAllMarkers() {
    return this.postService.getAllMarkers();
  }

  @Get('/posts')
  getPosts(@Query('page') page: number) {
    return this.postService.getPosts(page);
  }

  @Get('/posts/:id')
  getPostById(@Param('id', ParseIntPipe) id: number) {
    return this.postService.getPostById(id);
  }

  @Post('/posts')
  @UsePipes(ValidationPipe)
  createPost(@Body() createPostDto: CreatePostDto) {
    return this.postService.createPost(createPostDto);
  }

  @Delete('/posts/:id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postService.deletePost(id);
  }

  @Patch('/posts/:id')
  @UsePipes(ValidationPipe)
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updatePostDto: Omit<CreatePostDto, 'latitude' | 'longitude' | 'address'>,
  ) {
    return this.postService.updatePost(id, updatePostDto);
  }

  // @Get('/posts/like/:id')
  // getPostLike(@Param('id', ParseIntPipe) id: number) {
  //   return this.postService.getPostLike(id);
  // }
  // @Get('/posts/like')
  // getPostLikeList(@Query('page') page: number) {
  //   return this.postService.getPostLikeList(page);
  // }
  // @Get('/posts/like/:id/like')
}
