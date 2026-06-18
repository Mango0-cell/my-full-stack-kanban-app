import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity({ name: 'project_members' })
@Unique(['project_id', 'user_id'])
export class ProjectMember {
  @PrimaryGeneratedColumn({ name: 'project_member_id' })
  project_member_id!: number;

  @Column({ name: 'project_id', type: 'int' })
  project_id!: number;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'user_id', type: 'int' })
  user_id!: number;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'role_id', type: 'int' })
  role_id!: number;

  @ManyToOne(() => Role, (role) => role.members)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joined_at!: Date;
}
