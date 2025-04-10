import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack';
import { onMount } from 'svelte';

export interface Hub {
    on(name: string, callback: (...args: any[]) => void): unknown;
    dispose(): Promise<void>;
}

class SignalRHub implements Hub {
    #connection: HubConnection | null = null;
    #accessTokenFactory: (() => string | Promise<string>) | null = null;
    #url: string;

    constructor(url: string, accessTokenFactory?: () => string | Promise<string>) {
        this.#url = url;
        if (accessTokenFactory) {
            this.#accessTokenFactory = accessTokenFactory;
        }
    }

    private get connection() {
        if (!this.#connection) {
            this.#connection = new HubConnectionBuilder()
                .withUrl(this.#url, { accessTokenFactory: this.#accessTokenFactory ?? undefined })
                .withHubProtocol(new MessagePackHubProtocol())
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Information)
                .build();
        }
        return this.#connection;
    }

    public on(name: string, callback: (...args: any[]) => void) {
        onMount(() => {
            this.connection.on(name, callback);
            return () => {
                this.connection.off(name, callback);
            };
        });
    }

    public dispose() {
        if (!this.#connection) {
            return Promise.resolve();
        }
        return this.#connection.stop();
    }
}

export const createSignalRHub = (
    url: string,
    accessTokenFactory?: () => string | Promise<string>
) => {
    return new SignalRHub(url, accessTokenFactory);
};
