declare module 'better-sqlite3' {
  export interface Statement {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  }
  export interface Database {
    pragma(source: string): unknown;
    exec(source: string): Database;
    prepare(source: string): Statement;
    transaction<T extends (...args: any[]) => unknown>(fn: T): T;
  }
  export default class DatabaseConstructor implements Database {
    constructor(filename: string);
    pragma(source: string): unknown;
    exec(source: string): Database;
    prepare(source: string): Statement;
    transaction<T extends (...args: any[]) => unknown>(fn: T): T;
  }
}
