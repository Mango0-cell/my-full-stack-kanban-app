import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Card } from './card.entity';
import { User } from './user.entity';

@Entity({ name: 'attachments' })
export class Attachment {
  @PrimaryGeneratedColumn({ name: 'attachment_id' })
  attachment_id!: number;

  @Column({ name: 'card_id', type: 'int' })
  card_id!: number;

  @ManyToOne(() => Card, (card) => card.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @Column({ name: 'uploaded_by_user_id', type: 'int' })
  uploaded_by_user_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploaded_by!: User;

  @Column({ name: 'file_url', type: 'text' })
  file_url!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  file_name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;
}
