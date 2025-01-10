import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { NotFoundException } from '@nestjs/common';
import { Author } from 'src/authors/entities/author.entity';

describe('BooksService', () => {
  let service: BooksService;

  const mockAuthor1 = {
    id: 1,
    firstName: 'first1',
    secondName: 'second1',
  };
  const mockAuthor2 = {
    id: 2,
    firstName: 'first2',
    secondName: 'second2',
  };

  const mockBooks1 = [
    { id: 1, title: 'title1', publicationYear: 2000, author: mockAuthor1 },
    { id: 2, title: 'title2', publicationYear: 2001, author: mockAuthor1 },
    { id: 3, title: 'title3', publicationYear: 2005, author: mockAuthor2 },
  ];

  const mockBooks2 = [];

  const mockBookRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthorRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockBookRepository,
        },
        {
          provide: getRepositoryToken(Author),
          useValue: mockAuthorRepository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('should return all books', async () => {
    mockBookRepository.find.mockResolvedValue(mockBooks1);

    const books = await service.findAll();
    expect(books).toEqual(mockBooks1);
    expect(mockBookRepository.find).toHaveBeenCalledTimes(1);
  });

  it('should return empty array if no books in db', async () => {
    mockBookRepository.find.mockResolvedValue(mockBooks2);

    const books = await service.findAll();
    expect(books).toEqual([]);
    expect(mockBookRepository.find).toHaveBeenCalledTimes(1);
  });

  it('should return single book', async () => {
    mockBookRepository.findOne.mockResolvedValue(mockBooks1[0]);

    const book = await service.findOne(mockBooks1[0].id);
    expect(book).toEqual(mockBooks1[0]);
    expect(mockBookRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('should not include authorId prop directly on book findOne', async () => {
    mockBookRepository.findOne.mockResolvedValue(mockBooks1[0]);

    const book = await service.findOne(mockBooks1[0].id);
    expect(book).not.toHaveProperty('authorId');
    expect(mockBookRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('should throw exception if book with given ID does not exist', async () => {
    mockBookRepository.findOne.mockResolvedValue(null); //?

    await expect(service.findOne(-1)).rejects.toThrow(NotFoundException);
    expect(mockBookRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('should create new book', async () => {
    const newBookDto = {
      title: 'newtitle1',
      publicationYear: 2022,
      authorId: mockAuthor1.id,
    };

    const createdBook = { ...newBookDto, id: 500 };

    mockAuthorRepository.findOne.mockResolvedValue(mockAuthor1);

    mockBookRepository.create.mockReturnValue(createdBook);
    mockBookRepository.save.mockResolvedValue(createdBook);

    const result = await service.create(newBookDto);

    expect(result).toEqual(createdBook);
    expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
      where: { id: newBookDto.authorId },
    });
    expect(mockBookRepository.create).toHaveBeenCalledWith(newBookDto);
    expect(mockBookRepository.save).toHaveBeenCalledWith(createdBook);
  });

  it('should throw exception if creating book with invalid author id', async () => {
    const newBookDto = {
      title: 'newtitle1',
      publicationYear: 2022,
      authorId: -1,
    };

    mockAuthorRepository.findOne.mockResolvedValue(null);

    await expect(service.create(newBookDto)).rejects.toThrow(NotFoundException);

    expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
      where: { id: newBookDto.authorId },
    });

    expect(mockBookRepository.create).not.toHaveBeenCalled();
    expect(mockBookRepository.save).not.toHaveBeenCalled();
  });

  it('should update book', async () => {
    const updateBookDto = {
      title: 'updatedtitle1',
      publicationYear: 2000,
      authorId: mockAuthor1.id,
    };

    const updatedBook = { ...mockBooks1[0], ...updateBookDto };

    mockBookRepository.findOne.mockResolvedValue(mockBooks1[0]);
    mockAuthorRepository.findOne.mockResolvedValue(mockAuthor1);
    mockBookRepository.save.mockResolvedValue(updatedBook);

    const result = await service.update(1, updateBookDto);

    expect(result).toEqual(updatedBook);
    expect(mockBookRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
      where: { id: updateBookDto.authorId },
    });
    expect(mockBookRepository.save).toHaveBeenCalledWith(updatedBook);
  });

  it('should throw exception if updating book with invalid book id', async () => {
    const updateBookDto = {
      title: 'updatedtitle1',
      publicationYear: 2000,
      authorId: mockAuthor1.id,
    };

    mockBookRepository.findOne.mockResolvedValue(null);

    await expect(service.update(-1, updateBookDto)).rejects.toThrow(
      NotFoundException,
    );

    expect(mockBookRepository.findOne).toHaveBeenCalledWith({
      where: { id: -1 },
    });
    expect(mockAuthorRepository.findOne).not.toHaveBeenCalled();
    expect(mockBookRepository.save).not.toHaveBeenCalled();
  });

  it('should throw exception if updating book with invalid author id', async () => {
    const updateBookDto = {
      title: 'updatedtitle1',
      publicationYear: 2000,
      authorId: -1,
    };

    mockBookRepository.findOne.mockResolvedValue(mockBooks1[0]);

    mockAuthorRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(mockBooks1[0].id, updateBookDto),
    ).rejects.toThrow(NotFoundException);

    expect(mockBookRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockBooks1[0].id },
    });
    expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
      where: { id: updateBookDto.authorId },
    });
    expect(mockBookRepository.save).not.toHaveBeenCalled();
  });

  it('should delete book', async () => {
    const bookId = mockBooks1[0].id;

    mockBookRepository.findOne.mockResolvedValue(mockBooks1[0]);

    mockBookRepository.remove.mockResolvedValue(mockBooks1[0]);

    const result = await service.remove(bookId);

    expect(result).toBeUndefined();

    expect(mockBookRepository.findOne).toHaveBeenCalledWith({
      where: { id: bookId },
    });
    expect(mockBookRepository.remove).toHaveBeenCalledWith(mockBooks1[0]);
  });

  it('should throw exception if deleting book with invalid book id', async () => {
    const bookId = -1;

    mockBookRepository.findOne.mockResolvedValue(null);

    await expect(service.remove(bookId)).rejects.toThrow(NotFoundException);

    expect(mockBookRepository.findOne).toHaveBeenCalledWith({
      where: { id: bookId },
    });
    expect(mockBookRepository.remove).not.toHaveBeenCalled();
  });
});
