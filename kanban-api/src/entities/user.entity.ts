import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  user_id!: number;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password', type: 'text' })
  password!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 100 })
  display_name!: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatar_url!: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'theme', type: 'varchar', length: 20, default: 'light', nullable: true })
  theme!: string | null;

  @Column({ name: 'timezone', type: 'varchar', length: 50, default: 'UTC', nullable: true })
  timezone!: string | null;

  @Column({ name: 'language', type: 'varchar', length: 10, default: 'en', nullable: true })
  language!: string | null;

  @Column({ name: 'job_title', type: 'varchar', length: 100, nullable: true })
  job_title!: string | null;

  @Column({ name: 'location', type: 'varchar', length: 100, nullable: true })
  location!: string | null;

  @Column({ name: 'website_url', type: 'text', nullable: true })
  website_url!: string | null;

  @Column({ name: 'notification_settings', type: 'jsonb', default: () => `'{}'::jsonb` })
  notification_settings!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Project, (project) => project.owner)
  owned_projects!: Project[];

  @OneToMany(() => ProjectMember, (pm) => pm.user)
  memberships!: ProjectMember[];
}
