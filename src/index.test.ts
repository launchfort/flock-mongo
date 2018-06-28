import * as Assert from 'assert'
import * as Path from 'path'
import { DataAccessProvider, MongoDataAccess, MongoQueryInterface, TemplateProvider } from './index'

describe('flock-mongo', function () {
  const dap = new DataAccessProvider()
  let da: MongoDataAccess = null
  let qi: MongoQueryInterface = null

  beforeEach(async function () {
    da = await dap.provide()
    qi = da['qi'] // the QueryInterface
  })

  afterEach(async function () {
    try {
      await qi.query(db => {
        return db.dropCollection(da.migrationTableName)
      })
      await da.close()
    } catch (error) {
      if (error.codeName === 'NamespaceNotFound') {
        await da.close()
      } else {
        await da.close()
        throw error
      }
    }
  })

  describe('TemplateProvider', function () {
    it('should provide a template file name when given a migration type that matches a template name', async function () {
      const tp = new TemplateProvider()
      let fileName = await tp.provideFileName('create-collection')
      Assert.strictEqual(fileName, Path.resolve(__dirname, './templates/create-collection.ejs'))
      fileName = await tp.provideFileName('alter-collection')
      Assert.strictEqual(fileName, Path.resolve(__dirname, './templates/alter-collection.ejs'))
      fileName = await tp.provideFileName('other')
      Assert.strictEqual(fileName, Path.resolve(__dirname, './templates/other.ejs'))
    })

    it('should reject when given a migration type that does not match a template name', async function () {
      const tp = new TemplateProvider()
      try {
        await tp.provideFileName('nope')
      } catch (error) {
        Assert.strictEqual(error.code, 'UNSUPPORTED_MIGRATION_TYPE')
      }
    })
  })

  describe('DataAccessProvider#provide', function () {
    it('should connect to the DB', async function () {
      Assert.strictEqual(dap.migrationTableName, 'migration')
    })
  })

  describe('MongoDataAccess', function () {
    describe('#getMigratedMigrations', function () {
      it('should retrieve migrated migrations', async function () {
        await qi.query(db => {
          return db.collection(da.migrationTableName).insertOne({
            id: 'one',
            created_at: new Date()
          })
        })
        const migrated = await da.getMigratedMigrations()
        Assert.deepStrictEqual(migrated.map(x => x.id), [ 'one' ])
        Assert.ok(migrated[0].migratedAt instanceof Date)
      })
    })

    describe('#migrate', function () {
      it('should migrate a migration', async function () {
        await da.migrate('two', qi => {
          /* do nothing */
          return Promise.resolve()
        })
        const migrated = await da.getMigratedMigrations()
        Assert.deepStrictEqual(migrated.map(x => x.id), [ 'two' ])
        Assert.ok(migrated[0].migratedAt instanceof Date)
      })
    })

    describe('#rollback', function () {
      it('should rollback a migration', async function () {
        await da.migrate('two', qi => {
          /* do nothing */
          return Promise.resolve()
        })
        await da.rollback('two', qi => {
          /* do nothing */
          return Promise.resolve()
        })
        const migrated = await da.getMigratedMigrations()
        Assert.strictEqual(migrated.length, 0)
      })
    })
  })
})
