export declare class ConnectionUri {
    readonly user: string;
    readonly password: string;
    readonly db: string;
    readonly hosts: string[];
    readonly options: object;
    private readonly value;
    constructor(uri: string);
    toString(): string;
}
