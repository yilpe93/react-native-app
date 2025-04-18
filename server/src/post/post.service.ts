import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Repository } from 'typeorm';
import { User } from 'src/auth/user.entity';
import { Image } from 'src/image/image.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  async getAllMarkers(user: User) {
    try {
      const markers = await this.postRepository
        .createQueryBuilder('post')
        .where('post.userId = :userId', { userId: user.id })
        .select([
          'post.id',
          'post.latitude',
          'post.longitude',
          'post.color',
          'post.score',
        ])
        .getMany();

      return markers;
    } catch (error) {
      console.error('Error fetching markers:', error);
      throw new InternalServerErrorException(
        '마커를 가져오는 도중 에러가 발생했습니다.',
      );
    }
  }

  private getPostsWithOrderImages(posts: Post[]) {
    return posts.map((post) => {
      const { images, ...rest } = post;
      const newImages = [...images].sort((a, b) => a.id - b.id);

      return {
        ...rest,
        images: newImages,
      };
    });
  }

  async getPosts(page: number, user: User) {
    const perPage = 10;
    const offset = (page - 1) * perPage;

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.images', 'image')
      .where('post.userId = :userId', { userId: user.id })
      .orderBy('post.date', 'DESC')
      .skip(offset)
      .take(perPage)
      .getMany();

    return this.getPostsWithOrderImages(posts);
  }

  async getPostById(id: number, user: User) {
    try {
      const foundPost = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.images', 'image')
        .leftJoinAndSelect(
          'post.favorites',
          'favorite',
          'favorite.userId = :userId',
          {
            userId: user.id,
          },
        )
        .where('post.userId = :userId', { userId: user.id })
        .andWhere('post.id = :id', { id })
        .getOne();

      if (!foundPost) {
        throw new NotFoundException('존재하지 않는 피드입니다.');
      }

      const { favorites, ...rest } = foundPost;
      const postWithFavorites = { ...rest, isFavorite: favorites.length > 0 };

      return postWithFavorites;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw new InternalServerErrorException(
        '피드를 가져오는 도중 에러가 발생했습니다.',
      );
    }
  }

  async createPost(createPostDto: CreatePostDto, user: User) {
    const {
      latitude,
      longitude,
      color,
      address,
      title,
      description,
      date,
      score,
      imageUris,
    } = createPostDto;

    const post = this.postRepository.create({
      latitude,
      longitude,
      color,
      address,
      title,
      description,
      date,
      score,
      user,
    });

    const images = imageUris.map((uri) => this.imageRepository.create(uri));
    post.images = images;

    try {
      await this.imageRepository.save(images);
      await this.postRepository.save(post);
    } catch (error) {
      console.error('Error saving post:', error);
      throw new InternalServerErrorException(
        '장소를 추가하는 도중 에러가 발생했습니다.',
      );
    }

    const { user: _, ...postWithoutUser } = post;
    return postWithoutUser;
  }

  async deletePost(id: number, user: User) {
    try {
      const result = await this.postRepository
        .createQueryBuilder('post')
        .delete()
        .from(Post)
        .where('userId = :userId', { userId: user.id })
        .andWhere('post.id = :id', { id })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException('존재하지 않는 피드입니다.');
      }

      return id;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new InternalServerErrorException(
        '피드를 삭제하는 도중 에러가 발생했습니다.',
      );
    }
  }

  async updatePost(
    id: number,
    updatePostDto: Omit<CreatePostDto, 'latitude' | 'longitude' | 'address'>,
    user: User,
  ) {
    const post = await this.getPostById(id, user);
    const { color, title, description, date, score, imageUris } = updatePostDto;

    post.title = title;
    post.description = description;
    post.color = color;
    post.date = date;
    post.score = score;

    const images = imageUris.map((uri) => this.imageRepository.create(uri));
    post.images = images;

    try {
      await this.imageRepository.save(images);
      await this.postRepository.save(post);
    } catch (error) {
      console.error('Error updating post:', error);
      throw new InternalServerErrorException(
        '피드를 수정하는 도중 에러가 발생했습니다.',
      );
    }

    return post;
  }
}
