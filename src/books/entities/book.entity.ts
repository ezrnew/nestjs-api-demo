import { Author } from 'src/authors/entities/author.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'int' })
  publicationYear: number;

  @Column()
  authorId: number;

  @ManyToOne(() => Author, (author) => author.books, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author: Author;
}
