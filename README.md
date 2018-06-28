# Flock Mongo

Flock Mongo is a Flock plugin for Mongodb.

## Install

```
npm install gradealabs/flock-mongo
```

## Usage

```js
// .flockrc.js
const { DefaultMigrator, NodeModuleMigrationProvider } = require('@gradealabs/flock')
const { DataAccessProvider, TemplateProvider } = require('@gradealabs/flock-mongo')

const migrationDir = 'migrations'
const migrationTableName = 'migration'
const dap = new DataAccessProvider({ migrationTableName })
const mp = new NodeModuleMigrationProvider({ migrationDir })

exports.migrator = new DefaultMigrator(mp, dap)
exports.migrationDir = migrationDir
exports.templateProvider = new TemplateProvider()

```

## Migrations

When writing migrations that use `flock-mongo` the `QueryInterface#query`
method accepts a function that will be called with a `Mongo.Db` instance.

See: http://mongodb.github.io/node-mongodb-native/3.1/api/Db.html#executeDbAdminCommand

Example:
```js
exports.up = queryInterface => {
  return queryInterface.query(db => {
    return db.collection('user').find({ age: 1 })
  })
}
```

The `QueryInterface#query` method accepts a function with the following signature:

```ts
// Function that resolves to a Mongo Cursor instance, a document or an array
// of documents.
(db: Db): Promise<Cursor | {} | {}[]>
```

The result of running `QueryInterface#query` will be a `Flock.QueryResult` where
`rows` will be an array of documents.

Example:
```js
exports.up = async (queryInterface) => {
  const result = await queryInterface.query(db => {
    return db.collection('user').find({ age: 1 })
  })

  // Where result.rowCount is the number or documents returned.
  // And result.rows is an array of documents.
  console.log(result.rows)
}
```

## API

Flock Mongo exports implementations of Flock's `DataAccessProvider` and `TemplateProvider` as the `DataAccessProvider` and `TemplateProvider` classes.

The `DataAccessProvider` class will connect to your Mongo DB by reading
the connection string from the `DATABASE_URL` environment variable. Optionally you
can override the behaviour by passing in the `connectionString` option to the
constructor.

If the connection string does not contain a database then the `admin` database
will be used.

See: https://docs.mongodb.com/manual/reference/connection-string/

```js
class DataAccessProvider implements Flock.DataAccessProvider {
  constructor ({
    migrationTableName = 'migration',
    connectionString = process.env.DATABASE_URL } = {})
}
```
