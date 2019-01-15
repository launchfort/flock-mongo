import { URL } from 'url'

const PATTERN = /^mongodb:\/\/([^@:]+:[^@]+@)?([^@?]+?(?::\d+)?(?:,[^@?]+?(?::\d+)?)*)(\/[^?]+)?(\?.*)?$/

export class ConnectionUri {
  public readonly user: string
  public readonly password: string
  public readonly db: string
  public readonly hosts: string[]
  public readonly options: object
  private readonly value: string

  constructor (uri: string) {
    if (typeof uri !== 'string') {
      throw new Error('URI must be a string')
    }

    uri = uri.trim()

    const m = PATTERN.exec(uri)

    if (!m) {
      throw new Error('Invalid connection URI. See https://docs.mongodb.com/manual/reference/connection-string/.')
    }

    this.value = uri
    this.user = m[1] ? m[1].split(':')[0] : ''
    this.password = m[1] ? m[1].split(':')[1].slice(0, -1) : ''
    this.hosts = m[2].split(',') || []
    this.db = m[3] ? m[3].slice(1) : ''
    this.options = m[4] ? new URL('http://example.com' + m[4]).searchParams : {}
  }

  public toString () {
    return this.value
  }
}
