import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

@Entity({ name: 'invitations' })
export class Invitation {
  @PrimaryGeneratedColumn({ name: 'invitation_id' })
  invitation_id!: number;

  @Column({ name: 'project_id', type: 'int' })
  project_id!: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'inviter_user_id', type: 'int' })
  inviter_user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_user_id' })
  inviter!: User;

  @Column({ name: 'invitee_user_id', type: 'int', nullable: true })
  invitee_user_id!: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invitee_user_id' })
  invitee!: User | null;

  @Column({ name: 'invitee_email', type: 'varchar', length: 255 })
  invitee_email!: string;

  @Column({ name: 'role_id', type: 'int' })
  role_id!: number;

  @ManyToOne(() => Role, (role) => role.invitations)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ name: 'message', type: 'text', nullable: true })
  message!: string | null;

  @Column({ name: 'token', type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status!: InvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expires_at!: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  accepted_at!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;
}
