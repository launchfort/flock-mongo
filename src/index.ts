import * as Path from 'path'
import { URL } from 'url'
import { MongoClient, Db, Cursor } from 'mongodb'
import * as Flock from '@launchfort/flock'
import { ConnectionUri } from './connection-uri'

export class TemplateProvider implements Flock.TemplateProvider {
  readonly migrationTypes = [ 'create-collection', 'alter-collection', 'other' ]

  provideFileName (migrationType: string) {
    if (this.migrationTypes.indexOf(migrationType) >= 0) {
      return Promise.resolve(Path.join(__dirname, 'templates', migrationType + '.ejs'))
    } else {
      return Promise.reject(Object.assign(
        new Error(`Unsupported migration type [${migrationType}]`),
        { code: 'UNSUPPORTED_MIGRATION_TYPE' }
      ))
    }
  }
}

export class DataAccessProvider implements Flock.DataAccessProvider {
  readonly migrationTableName: string
  readonly connectionString: string

  constructor ({ migrationTableName = 'migration', connectionString = process.env.DATABASE_URL } = {}) {
    this.migrationTableName = migrationTableName
    this.connectionString = connectionString
  }

  async provide () {
    // @ts-ignore
    const client = await MongoClient.connect(this.connectionString, {
      useNewUrlParser: true,
      // (node:72920) DeprecationWarning: current Server Discovery and Monitoring
      // engine is deprecated, and will be removed in a future version. To use the
      // new Server Discover and Monitoring engine, pass option
      // { useUnifiedTopology: true } to MongoClient.connect.
      useUnifiedTopology: true
    })
    const uri = new ConnectionUri(this.connectionString)
    const databaseName = uri.db || 'admin'
    const db = client.db(databaseName)
    return new MongoDataAccess(client, this.migrationTableName, db)
  }
}

export class MongoDataAccess implements Flock.DataAccess {
  private client: MongoClient
  private qi: MongoQueryInterface
  readonly migrationTableName: string

  constructor (client, migrationTableName, db) {
    this.client = client
    this.qi = new MongoQueryInterface(db)
    this.migrationTableName = migrationTableName
  }

  async getMigratedMigrations () {
    const result = await this.qi.query(db => {
      return db.collection(this.migrationTableName).find()
    })
    return result.rows.map(x => {
      return { id: x.id, migratedAt: x.created_at }
    })
  }

  async migrate (migrationId: string, action: (qi: Flock.QueryInterface) => Promise<void>) {
    const hasMigrated = await this.hasMigrated(migrationId)

    if (hasMigrated) {
      return
    }

    await action(this.qi)
    await this.qi.query(db => {
      return db.collection(this.migrationTableName).insertOne({
        id: migrationId,
        created_at: new Date()
      })
    })
  }

  async rollback (migrationId: string, action: (qi: Flock.QueryInterface) => Promise<void>) {
    const hasMigrated = await this.hasMigrated(migrationId)

    if (!hasMigrated) {
      return
    }

    await action(this.qi)
    await this.qi.query(db => {
      return db.collection(this.migrationTableName).deleteOne({ id: migrationId })
    })
  }

  async close () {
    return this.client.close()
  }

  private async hasMigrated (migrationId: string) {
    const result = await this.qi.query(db => {
      return db.collection(this.migrationTableName).findOne({ id: migrationId })
    })
    return result.rowCount === 1
  }
}

export class MongoQueryInterface implements Flock.QueryInterface {
  readonly db: Db

  constructor (db: Db) {
    this.db = db
  }

  query (execute: (db: Db) => any): Promise<Flock.QueryResult> {
    return new Promise((resolve) => {
      resolve(execute(this.db))
    }).then(cursor => {
      // Allow execute function to return a cursor
      if (cursor instanceof Cursor) {
        return cursor.toArray()
      } else {
        return cursor
      }
    }).then(result => {
      let documents = []
      // Array of documents?
      if (Array.isArray(result)) {
        documents = result
      // Single document or document-like result
      } else if (result !== undefined && result !== null) {
        documents = [ result ]
      }

      return {
        rowCount: documents.length,
        rows: documents
      }
    })
  }

  async tableExists (tableName: string) {
    const result = await this.query(async (db) => {
      db.listCollections({ name: tableName }).next().then(() => {
        return true
      }).catch(() => {
        return []
      })
    })
    return result.rowCount === 1
  }

  async columnExists (tableName: string, columnName: string) {
    const tableExists = await this.tableExists(tableName)

    if (!tableExists) {
      return false
    }

    const result = await this.query(db => {
      db.collection(tableName).findOne({ [columnName]: { $exists: 1 }}).then(doc => {
        return doc ? true : []
      })
    })

    return result.rowCount === 1
  }

  async columnDataType (tableName: string, columnName: string): Promise<string|null> {
    return Promise.reject(new Error('QueryInterface#columnDataType not implemented'))
  }
}
