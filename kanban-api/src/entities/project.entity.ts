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
import { User } from './user.entity';
import { ProjectMember } from './project-member.entity';
import { BoardColumn } from './column.entity';

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn({ name: 'project_id' })
  project_id!: number;

  @Column({ name: 'owner_user_id', type: 'int' })
  owner_user_id!: number;

  @ManyToOne(() => User, (user) => user.owned_projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @Column({ name: 'project_name', type: 'varchar', length: 255 })
  project_name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => ProjectMember, (pm) => pm.project)
  members!: ProjectMember[];

  @OneToMany(() => BoardColumn, (col) => col.project)
  columns!: BoardColumn[];
}
