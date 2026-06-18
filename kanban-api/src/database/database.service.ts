import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

/**
 * Thin TypeORM-backed compatibility layer for raw SQL queries.
 *
 * After the TypeORM migration, services prefer Repository / QueryBuilder.
 * A handful of complex SQL queries (CTEs, LATERAL joins, UNION ALL with
 * NOT EXISTS subqueries) are still routed through this service, which
 * forwards them to TypeORM's DataSource so everything goes through one
 * connection pool.
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger('Database');

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query('SELECT NOW()');
      this.logger.log('TypeORM DataSource connection verified');
    } catch (err) {
      this.logger.error('Connection failed', (err as Error).message);
    }
  }

  /**
   * Run a parameterized raw query. The pg driver uses `$1`/`$2`/... so
   * existing SQL keeps working. Returns a `{ rows }` shape to match the
   * legacy `pg.Pool.query` signature used by services that still rely on
   * it.
   */
  async query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    const rows = (await this.dataSource.query(text, params as unknown[])) as T[];
    return { rows, rowCount: rows.length };
  }

  /**
   * Acquire a transactional query runner. Mirrors the legacy
   * `db.getClient()` API while routing through TypeORM. The returned
   * object exposes a `query()` method, a `release()` method, and the
   * underlying QueryRunner for advanced use.
   */
  async getClient(): Promise<{
    query<T = Record<string, unknown>>(
      text: string,
      params?: unknown[],
    ): Promise<{ rows: T[]; rowCount: number }>;
    release(): Promise<void>;
    runner: QueryRunner;
  }> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    return {
      async query<T = Record<string, unknown>>(
        text: string,
        params?: unknown[],
      ): Promise<{ rows: T[]; rowCount: number }> {
        const rows = (await runner.query(text, params as unknown[])) as T[];
        return { rows, rowCount: rows.length };
      },
      async release() {
        await runner.release();
      },
      runner,
    };
  }

  /** Expose the underlying DataSource for QueryBuilder access if needed. */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
