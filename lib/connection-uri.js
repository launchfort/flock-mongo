"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
// See: https://docs.mongodb.com/manual/reference/connection-string/
const PATTERN = /^mongodb(?:\+srv)?:\/\/([^@:]+:[^@]+@)?([^@?/]+?(?::\d+)?(?:,[^@?/]+?(?::\d+)?)*)(\/[^?]*)?(\?.*)?$/;
class ConnectionUri {
    constructor(uri) {
        if (typeof uri !== 'string') {
            throw new Error('URI must be a string');
        }
        uri = uri.trim();
        const m = PATTERN.exec(uri);
        if (!m) {
            throw new Error('Invalid connection URI. See https://docs.mongodb.com/manual/reference/connection-string/.');
        }
        this.value = uri;
        this.user = m[1] ? m[1].split(':')[0] : '';
        this.password = m[1] ? m[1].split(':')[1].slice(0, -1) : '';
        this.hosts = m[2].split(',') || [];
        this.db = m[3] ? m[3].slice(1) : '';
        this.options = m[4] ?
            [...new url_1.URL('http://example.com' + m[4]).searchParams.entries()].reduce((opts, [key, value]) => {
                return Object.assign({}, opts, { [key]: value });
            }, {})
            : {};
    }
    toString() {
        return this.value;
    }
}
exports.ConnectionUri = ConnectionUri;
