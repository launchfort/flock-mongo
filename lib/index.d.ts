import { Db } from 'mongodb';
import * as Flock from '@launchfort/flock';
export declare class TemplateProvider implements Flock.TemplateProvider {
    readonly migrationTypes: string[];
    provideFileName(migrationType: string): Promise<string>;
}
export declare class DataAccessProvider implements Flock.DataAccessProvider {
    readonly migrationTableName: string;
    readonly connectionString: string;
    constructor({ migrationTableName, connectionString }?: {
        migrationTableName?: string;
        connectionString?: string;
    });
    provide(): Promise<MongoDataAccess>;
}
export declare class MongoDataAccess implements Flock.DataAccess {
    private client;
    private qi;
    readonly migrationTableName: string;
    constructor(client: any, migrationTableName: any, db: any);
    getMigratedMigrations(): Promise<{
        id: any;
        migratedAt: any;
    }[]>;
    migrate(migrationId: string, action: (qi: Flock.QueryInterface) => Promise<void>): Promise<void>;
    rollback(migrationId: string, action: (qi: Flock.QueryInterface) => Promise<void>): Promise<void>;
    close(): Promise<void>;
    private hasMigrated;
}
export declare class MongoQueryInterface implements Flock.QueryInterface {
    readonly db: Db;
    constructor(db: Db);
    query(execute: (db: Db) => any): Promise<Flock.QueryResult>;
    tableExists(tableName: string): Promise<boolean>;
    columnExists(tableName: string, columnName: string): Promise<boolean>;
    columnDataType(tableName: string, columnName: string): Promise<string | null>;
}
