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

@Entity({ name: 'card_activity' })
export class CardActivity {
  @PrimaryGeneratedColumn({ name: 'activity_id' })
  activity_id!: number;

  @Column({ name: 'card_id', type: 'int' })
  card_id!: number;

  @ManyToOne(() => Card, (card) => card.activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @Column({ name: 'user_id', type: 'int' })
  user_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'action_type', type: 'varchar', length: 100 })
  action_type!: string;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  old_value!: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  new_value!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;
}
