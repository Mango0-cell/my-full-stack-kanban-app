import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { CanceledColumnGroup } from './canceled-column-group.entity';
import { User } from './user.entity';

@Entity({ name: 'canceled_cards' })
export class CanceledCard {
  @PrimaryGeneratedColumn({ name: 'canceled_card_id' })
  canceled_card_id!: number;

  @Column({ name: 'project_id', type: 'int' })
  project_id!: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'canceled_group_id', type: 'int', nullable: true })
  canceled_group_id!: number | null;

  @ManyToOne(() => CanceledColumnGroup, (group) => group.cards, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'canceled_group_id' })
  group!: CanceledColumnGroup | null;

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

  @Column({ name: 'original_column_name', type: 'varchar', length: 100 })
  original_column_name!: string;

  @Column({ name: 'canceled_by_user_id', type: 'int' })
  canceled_by_user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canceled_by_user_id' })
  canceled_by!: User;

  @CreateDateColumn({ name: 'canceled_at', type: 'timestamptz' })
  canceled_at!: Date;
}
