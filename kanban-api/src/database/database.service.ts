import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger('Database');

  constructor(private config: ConfigService) {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    this.pool = new Pool({
      connectionString: this.config.get<string>('DATABASE_URL'),
      ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT NOW()');
      this.logger.log('Connection verified');
    } catch (err) {
      this.logger.error('Connection failed', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query(text: string, params?: unknown[]): Promise<QueryResult> {
    return this.pool.query(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
