"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const url_1 = require("url");
const mongodb_1 = require("mongodb");
class TemplateProvider {
    constructor() {
        this.migrationTypes = ['create-table', 'alter-table', 'other'];
    }
    provideFileName(migrationType) {
        if (this.migrationTypes.indexOf(migrationType) >= 0) {
            return Promise.resolve(Path.join(__dirname, 'templates', migrationType + '.ejs'));
        }
        else {
            return Promise.reject(Object.assign(new Error(`Unsupported migration type [${migrationType}]`), { code: 'UNSUPPORTED_MIGRATION_TYPE' }));
        }
    }
}
exports.TemplateProvider = TemplateProvider;
class DataAccessProvider {
    constructor({ migrationTableName = 'migration', connectionString = process.env.DATABASE_URL } = {}) {
        this.migrationTableName = migrationTableName;
        this.connectionString = connectionString;
    }
    provide() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield mongodb_1.MongoClient.connect(this.connectionString);
            const connectionUrl = new url_1.URL(this.connectionString);
            const databaseName = connectionUrl.pathname.slice(1) || 'admin';
            const db = client.db(databaseName);
            return new MongoDataAccess(client, this.migrationTableName, db);
        });
    }
}
exports.DataAccessProvider = DataAccessProvider;
class MongoDataAccess {
    constructor(client, migrationTableName, db) {
        this.client = client;
        this.qi = new MongoQueryInterface(db);
        this.migrationTableName = migrationTableName;
    }
    getMigratedMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.qi.query(db => {
                return db.collection(this.migrationTableName).find();
            });
            return result.rows.map(x => {
                return { id: x.id, migratedAt: x.created_at };
            });
        });
    }
    migrate(migrationId, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasMigrated = yield this.hasMigrated(migrationId);
            if (hasMigrated) {
                return;
            }
            yield action(this.qi);
            yield this.qi.query(db => {
                return db.collection(this.migrationTableName).insertOne({
                    id: migrationId,
                    created_at: new Date()
                });
            });
        });
    }
    rollback(migrationId, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasMigrated = yield this.hasMigrated(migrationId);
            if (!hasMigrated) {
                return;
            }
            yield action(this.qi);
            yield this.qi.query(db => {
                return db.collection(this.migrationTableName).deleteOne({ id: migrationId });
            });
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.close();
        });
    }
    hasMigrated(migrationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.qi.query(db => {
                return db.collection(this.migrationTableName).findOne({ id: migrationId });
            });
            return result.rowCount === 1;
        });
    }
}
exports.MongoDataAccess = MongoDataAccess;
class MongoQueryInterface {
    constructor(db) {
        this.db = db;
    }
    query(execute) {
        return new Promise((resolve) => {
            resolve(execute(this.db));
        }).then(cursor => {
            // Allow execute function to return a cursor
            if (cursor instanceof mongodb_1.Cursor) {
                return cursor.toArray();
            }
            else {
                return cursor;
            }
        }).then(result => {
            let documents = [];
            // Array of documents?
            if (Array.isArray(result)) {
                documents = result;
                // Single document or document-like result
            }
            else if (result !== undefined && result !== null) {
                documents = [result];
            }
            return {
                rowCount: documents.length,
                rows: documents
            };
        });
    }
    tableExists(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.query((db) => __awaiter(this, void 0, void 0, function* () {
                db.listCollections({ name: tableName }).next().then(() => {
                    return true;
                }).catch(() => {
                    return [];
                });
            }));
            return result.rowCount === 1;
        });
    }
    columnExists(tableName, columnName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tableExists = yield this.tableExists(tableName);
            if (!tableExists) {
                return false;
            }
            const result = yield this.query(db => {
                db.collection(tableName).findOne({ [columnName]: { $exists: 1 } }).then(doc => {
                    return doc ? true : [];
                });
            });
            return result.rowCount === 1;
        });
    }
    columnDataType(tableName, columnName) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.reject(new Error('QueryInterface#columnDataType not implemented'));
        });
    }
}
exports.MongoQueryInterface = MongoQueryInterface;
