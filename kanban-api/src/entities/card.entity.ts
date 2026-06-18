import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardColumn } from './column.entity';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { CardActivity } from './card-activity.entity';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn({ name: 'card_id' })
  card_id!: number;

  @Column({ name: 'column_id', type: 'int' })
  column_id!: number;

  @ManyToOne(() => BoardColumn, (col) => col.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column!: BoardColumn;

  @Column({ name: 'created_by_user_id', type: 'int' })
  created_by_user_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  created_by!: User;

  @Column({ name: 'assigned_user_id', type: 'int', nullable: true })
  assigned_user_id!: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assigned!: User | null;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  due_date!: string | null;

  @Column({ name: 'priority', type: 'varchar', length: 50, default: 'medium' })
  priority!: string;

  @Column({ name: 'position', type: 'int', default: 0 })
  position!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Comment, (comment) => comment.card)
  comments!: Comment[];

  @OneToMany(() => Attachment, (attachment) => attachment.card)
  attachments!: Attachment[];

  @OneToMany(() => CardActivity, (activity) => activity.card)
  activity!: CardActivity[];
}
