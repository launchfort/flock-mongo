"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const connection_uri_1 = require("./connection-uri");
describe('flock-mongo/connection-uri', function () {
    it('should match MongoDB standalone connection strings', function () {
        const connectionString = 'mongodb://myDBReader:D1fficultP%40ssw0rd@mongodb0.example.com:27017/?authSource=admin';
        Assert.doesNotThrow(() => new connection_uri_1.ConnectionUri(connectionString));
        const c = new connection_uri_1.ConnectionUri(connectionString);
        Assert.strictEqual(c.user, 'myDBReader');
        Assert.strictEqual(c.password, 'D1fficultP%40ssw0rd');
        Assert.deepStrictEqual(c.hosts, ['mongodb0.example.com:27017']);
        Assert.strictEqual(c.db, '');
        Assert.deepStrictEqual(c.options, {
            authSource: 'admin'
        });
    });
    it('should match MongoDB replica set connection strings', function () {
        const connectionString = 'mongodb://myDBReader:D1fficultP%40ssw0rd@mongodb0.example.com:27017,mongodb1.example.com:27017,mongodb2.example.com:27017/?authSource=admin&replicaSet=myRepl';
        Assert.doesNotThrow(() => new connection_uri_1.ConnectionUri(connectionString));
        const c = new connection_uri_1.ConnectionUri(connectionString);
        Assert.strictEqual(c.user, 'myDBReader');
        Assert.strictEqual(c.password, 'D1fficultP%40ssw0rd');
        Assert.deepStrictEqual(c.hosts, ['mongodb0.example.com:27017', 'mongodb1.example.com:27017', 'mongodb2.example.com:27017']);
        Assert.strictEqual(c.db, '');
        Assert.deepStrictEqual(c.options, {
            authSource: 'admin',
            replicaSet: 'myRepl'
        });
    });
    it('should match MongoDB shareded cluster connection strings', function () {
        const connectionString = 'mongodb://myDBReader:D1fficultP%40ssw0rd@mongos0.example.com:27017,mongos1.example.com:27017,mongos2.example.com:27017/?authSource=admin';
        Assert.doesNotThrow(() => new connection_uri_1.ConnectionUri(connectionString));
        const c = new connection_uri_1.ConnectionUri(connectionString);
        Assert.strictEqual(c.user, 'myDBReader');
        Assert.strictEqual(c.password, 'D1fficultP%40ssw0rd');
        Assert.deepStrictEqual(c.hosts, ['mongos0.example.com:27017', 'mongos1.example.com:27017', 'mongos2.example.com:27017']);
        Assert.strictEqual(c.db, '');
        Assert.deepStrictEqual(c.options, {
            authSource: 'admin'
        });
    });
    it('should accept DNS Seedlist Connection Format', function () {
        const connectionString = 'mongodb+srv://myDBReader:D1fficultP%40ssw0rd@mongodb0.example.com:27017/admin';
        Assert.doesNotThrow(() => new connection_uri_1.ConnectionUri(connectionString));
        const c = new connection_uri_1.ConnectionUri(connectionString);
        Assert.strictEqual(c.user, 'myDBReader');
        Assert.strictEqual(c.password, 'D1fficultP%40ssw0rd');
        Assert.deepStrictEqual(c.hosts, ['mongodb0.example.com:27017']);
        Assert.strictEqual(c.db, 'admin');
        Assert.deepStrictEqual(c.options, {});
    });
});
