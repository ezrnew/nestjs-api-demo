import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { AuthorsModule } from 'src/authors/authors.module';
import { CreateAuthorDto } from 'src/authors/dto/create-author.dto';
import { BooksModule } from 'src/books/books.module';
import { CreateBookDto } from 'src/books/dto/create-book.dto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { setupDataSource } from './setup';

describe('Books Module', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await setupDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: 'postgres://localhost:5432/test',
          // entities: [Book, Author],
          autoLoadEntities: true,
          synchronize: true,
          database: ':memory:',
          migrations: [],
        }),
        BooksModule,
        AuthorsModule,
      ],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const createMockAuthor = async (authorDto: CreateAuthorDto) => {
    const response = await request(app.getHttpServer())
      .post('/authors')
      .send(authorDto);

    return response.body;
  };

  const createMockBook = async (bookDto: CreateBookDto) => {
    const response = await request(app.getHttpServer())
      .post('/books')
      .send(bookDto);
    return response.body;
  };

  it('should return an empty array for books', () => {
    return request(app.getHttpServer()).get('/books').expect(200).expect([]);
  });

  it('should return all books', async () => {
    const authorData: CreateAuthorDto = {
      firstName: 'first6',
      lastName: 'last6',
    };
    const createdAuthor = await createMockAuthor(authorData);

    const newBook1 = {
      title: 'newBook6',
      publicationYear: 2011,
      authorId: createdAuthor.id,
    };

    const newBook2 = {
      title: 'newBook7',
      publicationYear: 2012,
      authorId: createdAuthor.id,
    };

    await Promise.all([createMockBook(newBook1), createMockBook(newBook2)]);

    const response = await request(app.getHttpServer())
      .get('/books')
      .expect(200);

    expect(response.body).toHaveLength(2);

    const titles = response.body.map((book) => book.title);
    const authorIds = response.body.map((book) => book.author.id);

    expect(titles).toEqual(
      expect.arrayContaining([newBook1.title, newBook2.title]),
    );
    expect(authorIds).toEqual(
      expect.arrayContaining([createdAuthor.id, createdAuthor.id]),
    );
  });

  it('should create a new book', async () => {
    const authorData: CreateAuthorDto = {
      firstName: 'first1',
      lastName: 'last1',
    };
    const createdAuthor = await createMockAuthor(authorData);

    const newBook = {
      title: 'newBook1',
      publicationYear: 2000,
      authorId: createdAuthor.id,
    };

    const response = await request(app.getHttpServer())
      .post('/books')
      .send(newBook)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(newBook.title);
  });

  it('should get book by id', async () => {
    const authorData: CreateAuthorDto = {
      firstName: 'first2',
      lastName: 'last2',
    };
    const createdAuthor = await createMockAuthor(authorData);

    const newBook = {
      title: 'newBook2',
      publicationYear: 2022,
      authorId: createdAuthor.id,
    };
    const createdBook = await createMockBook(newBook);

    const response = await request(app.getHttpServer())
      .get(`/books/${createdBook.id}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdBook.id);
    expect(response.body.title).toBe(createdBook.title);
    expect(response.body.author.id).toBe(createdBook.authorId);
  });

  it('should update book by id', async () => {
    const authorData: CreateAuthorDto = {
      firstName: 'first3',
      lastName: 'last3',
    };
    const createdAuthor = await createMockAuthor(authorData);

    const newBook = {
      title: 'newBook3',
      publicationYear: 2025,
      authorId: createdAuthor.id,
    };
    const createdBook = await createMockBook(newBook);

    const updatedBookData = {
      title: 'updatedBook1',
      publicationYear: 2026,
      authorId: createdAuthor.id,
    };

    const updatedResponse = await request(app.getHttpServer())
      .patch(`/books/${createdBook.id}`)
      .send(updatedBookData)
      .expect(200);

    expect(updatedResponse.body).toHaveProperty('id', createdBook.id);
    expect(updatedResponse.body.title).toBe(updatedBookData.title);
    expect(updatedResponse.body.publicationYear).toBe(
      updatedBookData.publicationYear,
    );
  });

  it('should delete a book by id', async () => {
    const authorData: CreateAuthorDto = {
      firstName: 'first4',
      lastName: 'last4',
    };
    const createdAuthor = await createMockAuthor(authorData);

    const newBook = {
      title: 'newBook4',
      publicationYear: 2025,
      authorId: createdAuthor.id,
    };
    const createdBook = await createMockBook(newBook);

    await request(app.getHttpServer())
      .delete(`/books/${createdBook.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/books/${createdBook.id}`)
      .expect(404);
  });
});
