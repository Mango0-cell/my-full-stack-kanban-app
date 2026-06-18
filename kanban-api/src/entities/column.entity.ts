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
import { Project } from './project.entity';
import { User } from './user.entity';
import { Card } from './card.entity';

/**
 * The DB table is `columns`. Renamed in TS to BoardColumn because `Column`
 * collides with TypeORM's @Column decorator import name.
 */
@Entity({ name: 'columns' })
export class BoardColumn {
  @PrimaryGeneratedColumn({ name: 'column_id' })
  column_id!: number;

  @Column({ name: 'project_id', type: 'int' })
  project_id!: number;

  @ManyToOne(() => Project, (project) => project.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'created_by_user_id', type: 'int' })
  created_by_user_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  created_by!: User;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'position', type: 'int', default: 0 })
  position!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Card, (card) => card.column)
  cards!: Card[];
}
