import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { DirectMessage } from './direct-message.entity';

@Entity({ name: 'direct_conversations' })
@Unique(['user_one_id', 'user_two_id'])
export class DirectConversation {
  @PrimaryGeneratedColumn({ name: 'conversation_id' })
  conversation_id!: number;

  @Column({ name: 'user_one_id', type: 'int' })
  user_one_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_one_id' })
  user_one!: User;

  @Column({ name: 'user_two_id', type: 'int' })
  user_two_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_two_id' })
  user_two!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => DirectMessage, (msg) => msg.conversation)
  messages!: DirectMessage[];
}
