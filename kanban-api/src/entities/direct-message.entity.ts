import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DirectConversation } from './direct-conversation.entity';
import { User } from './user.entity';

@Entity({ name: 'direct_messages' })
export class DirectMessage {
  @PrimaryGeneratedColumn({ name: 'message_id' })
  message_id!: number;

  @Column({ name: 'conversation_id', type: 'int' })
  conversation_id!: number;

  @ManyToOne(() => DirectConversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: DirectConversation;

  @Column({ name: 'sender_user_id', type: 'int' })
  sender_user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  sender!: User;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;
}
