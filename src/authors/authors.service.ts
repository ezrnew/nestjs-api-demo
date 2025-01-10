import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Author } from './entities/author.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private authorsRepository: Repository<Author>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    try {
      const newAuthor = this.authorsRepository.create(createAuthorDto);
      return await this.authorsRepository.save(newAuthor);
    } catch (error) {
      throw new InternalServerErrorException('Error creating author');
    }
  }

  async findAll(): Promise<Author[]> {
    return await this.authorsRepository.find({ relations: ['books'] });
  }

  async findOne(id: number): Promise<Author> {
    const author = await this.authorsRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async update(id: number, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    const author = await this.authorsRepository.findOne({ where: { id } });

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    Object.assign(author, updateAuthorDto); 
    return await this.authorsRepository.save(author);
  }

  async remove(id: number): Promise<void> {
    const author = await this.authorsRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    if (author.books.length > 0) {
      throw new ConflictException(
        `Cannot delete author with ID ${id} because they have books`,
      );
    }

    await this.authorsRepository.remove(author);
  }
}
