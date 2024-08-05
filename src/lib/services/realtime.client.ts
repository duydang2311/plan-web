import {
    connect,
    usernamePasswordAuthenticator,
    type NatsConnection,
    type Subscription
} from 'nats.ws';
import { okAsync, ResultAsync } from 'neverthrow';
import { GenericError } from '~/lib/models/errors';
import { tryPromise } from '~/lib/utils/neverthrow';

export interface Realtime {
    subscribe(subject: string): ResultAsync<Subscription, GenericError>;
    dispose(): ResultAsync<void, GenericError>;
}

export interface NATSRealtimeOptions {
    servers: string | string[];
    username: string;
    password: string;
}

export class NATSRealtime implements Realtime {
    private readonly _options: NATSRealtimeOptions;
    private _connection: NatsConnection = undefined!;

    public constructor(options: NATSRealtimeOptions) {
        this._options = options;
    }

    public subscribe(subject: string) {
        return this._connectResult().map((a) => a.subscribe(subject));
    }

    public dispose() {
        if (!this._connection) {
            return okAsync(void 0);
        }
        return okAsync(this._connection).andThen((a) =>
            tryPromise(a.close(), (e) =>
                e instanceof Error
                    ? new GenericError({ code: 'dispose', message: e.message })
                    : new GenericError({
                          code: 'dispose',
                          message: 'Could not disconnect from websocket server'
                      })
            )
        );
    }

    private _connectResult() {
        return tryPromise(this._connect(), (e) => {
            if (e instanceof Error) {
                return new GenericError({ code: 'connect', message: e.message });
            }
            return new GenericError({
                code: 'connect',
                message: 'Could not connect to websocket server'
            });
        });
    }

    private async _connect() {
        if (!this._connection) {
            this._connection = await connect({
                servers: this._options.servers,
                authenticator: usernamePasswordAuthenticator(
                    this._options.username,
                    this._options.password
                )
            });
        }
        return this._connection;
    }
}
