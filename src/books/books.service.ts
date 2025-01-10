import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Repository } from 'typeorm';
import { Author } from 'src/authors/entities/author.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(Author)
    private authorRepository: Repository<Author>,
  ) {}

  async create(createBookDto: CreateBookDto) {
    try {
      const authorExists = await this.authorRepository.findOne({
        where: { id: createBookDto.authorId },
      });

      if (!authorExists)
        throw new NotFoundException(
          `Author with id ${createBookDto.authorId} not found`,
        );

      const newBook = this.booksRepository.create(createBookDto);
      return await this.booksRepository.save(newBook);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating book');
    }
  }

  async findAll(): Promise<Book[]> {
    return await this.booksRepository.find({
      relations: ['author'],
      select: {
        // skip authorId
        id: true,
        title: true,
        publicationYear: true,
        author: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });
  }

  async findOne(id: number) {
    const book = await this.booksRepository.findOne({
      where: { id },
      relations: ['author'],
      select: {
        // skip authorId
        id: true,
        title: true,
        publicationYear: true,
        author: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    const authorExists = await this.authorRepository.findOne({
      where: { id: updateBookDto.authorId },
    });

    if (!authorExists) {
      throw new NotFoundException(
        `Author with ID ${updateBookDto.authorId} not found`,
      );
    }

    Object.assign(book, updateBookDto);

    try {
      return await this.booksRepository.save(book);
    } catch (error) {
      throw new InternalServerErrorException('Error updating the book');
    }
  }

  async remove(id: number): Promise<void> {
    const book = await this.booksRepository.findOne({ where: { id } });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    await this.booksRepository.remove(book);
  }
}
