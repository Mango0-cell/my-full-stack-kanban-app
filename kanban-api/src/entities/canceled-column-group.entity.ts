import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { CanceledCard } from './canceled-card.entity';

@Entity({ name: 'canceled_column_groups' })
export class CanceledColumnGroup {
  @PrimaryGeneratedColumn({ name: 'canceled_group_id' })
  canceled_group_id!: number;

  @Column({ name: 'project_id', type: 'int' })
  project_id!: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'column_name', type: 'varchar', length: 100 })
  column_name!: string;

  @Column({ name: 'canceled_by_user_id', type: 'int' })
  canceled_by_user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canceled_by_user_id' })
  canceled_by!: User;

  @CreateDateColumn({ name: 'canceled_at', type: 'timestamptz' })
  canceled_at!: Date;

  @OneToMany(() => CanceledCard, (cc) => cc.group)
  cards!: CanceledCard[];
}
