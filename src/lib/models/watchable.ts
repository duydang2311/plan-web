import { Duration } from 'effect';
import { toMillis, type DurationInput } from 'effect/Duration';

class Watchable<T> {
	private readonly _promise: Promise<T>;
	private _resolved = false;
	private _timeouts: number[] = [];

	public constructor(promise: Promise<T>) {
		this._promise = promise;
		promise.finally(() => {
			this._resolved = true;
			for (const timeout of this._timeouts) {
				clearTimeout(timeout);
			}
			this._timeouts.splice(0, this._timeouts.length);
		});
	}

	public then(callback: (value: T) => void) {
		this._promise.then(callback);
		return this;
	}

	public after(duration: DurationInput, callback: () => void): Watchable<T>;
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	public after(ms: number, callback: () => void): Watchable<T>;
	public after(input: number | DurationInput, callback: () => void) {
		if (!this._resolved) {
			this._timeouts.push(
				setTimeout(
					() => {
						if (!this._resolved) {
							callback();
						}
					},
					typeof input === 'number' ? input : toMillis(Duration.decode(input))
				) as unknown as number
			);
		}
		return this;
	}

	public finally(callback: () => void) {
		this._promise.finally(callback);
		return this;
	}
}

export function watch<T>(promise: Promise<T>) {
	return new Watchable(promise);
}
