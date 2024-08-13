type RequestRecord = Record<string, unknown>;
type RequestArray = unknown[];

export interface HttpClientOptions {
    baseUrl: string;
    version?: string;
}

export interface HttpClientFetchRequestInit extends Omit<RequestInit, 'body'> {
    query?: RequestRecord;
    body?: RequestInit['body'] | RequestRecord | RequestArray;
}

export interface HttpClient {
    fetch(path: string, init?: HttpClientFetchRequestInit): Promise<Response>;
    get(path: string, init?: HttpClientFetchRequestInit): Promise<Response>;
    post(path: string, init?: HttpClientFetchRequestInit): Promise<Response>;
    head(path: string, init?: HttpClientFetchRequestInit): Promise<Response>;
    patch(path: string, init?: HttpClientFetchRequestInit): Promise<Response>;
    delete(path: string, init?: HttpClientFetchRequestInit): Promise<Response>;
    put(path: string, init?: HttpClientFetchRequestInit): Promise<Response>;
}
