import { FavoriteService } from './favorite.service';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/@common/decorators/get-user.decorator';
import { User } from 'src/auth/user.entity';

@Controller('favorite')
@UseGuards(AuthGuard())
export class FavoriteController {
  constructor(private FavoriteService: FavoriteService) {}

  @Get('/my')
  async getMyFavoritePosts(@Query('page') page: number, @GetUser() user: User) {
    return this.FavoriteService.getMyFavoritePosts(page, user.id);
  }

  @Post('/:id')
  toggleFavorite(
    @Param('id', ParseIntPipe) postId: number,
    @GetUser() user: User,
  ) {
    return this.FavoriteService.toggleFavorite(postId, user.id);
  }
}
