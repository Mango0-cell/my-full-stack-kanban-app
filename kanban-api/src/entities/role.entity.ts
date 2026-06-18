import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectMember } from './project-member.entity';
import { Invitation } from './invitation.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id!: number;

  @Column({ name: 'role_name', type: 'varchar', length: 50, unique: true })
  role_name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => ProjectMember, (pm) => pm.role)
  members!: ProjectMember[];

  @OneToMany(() => Invitation, (inv) => inv.role)
  invitations!: Invitation[];
}
