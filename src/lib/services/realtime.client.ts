import { Context, Effect } from 'effect';
import type { UnknownException } from 'effect/Cause';
import {
    connect,
    usernamePasswordAuthenticator,
    type NatsConnection,
    type Subscription
} from 'nats.ws';

export class Realtime extends Context.Tag('Realtime')<
    Realtime,
    {
        subscribe(subject: string): Effect.Effect<Subscription, UnknownException>;
        readonly dispose: Effect.Effect<void, UnknownException>;
    }
>() {}

export interface NATSRealtimeOptions {
    servers: string | string[];
    username: string;
    password: string;
}

export class NATSRealtime implements Context.Tag.Service<Realtime> {
    private readonly _options: NATSRealtimeOptions;
    private _connection: NatsConnection = undefined!;

    public constructor(options: NATSRealtimeOptions) {
        this._options = options;
    }

    public subscribe(subject: string) {
        return Effect.gen(this, function* () {
            yield* Effect.tryPromise(() => this._ensure());
            return yield* Effect.succeed(this._connection.subscribe(subject));
        });
    }

    public get dispose() {
        if (!this._connection) {
            return Effect.void;
        }
        return Effect.tryPromise(() => this._connection?.close());
    }

    private async _ensure() {
        if (!this._connection) {
            this._connection = await connect({
                servers: this._options.servers,
                authenticator: usernamePasswordAuthenticator(
                    this._options.username,
                    this._options.password
                )
            });
        }
    }
}
