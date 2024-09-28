import * as AsyncEither from '@baetheus/fun/async_either';
import { type KindAsyncEither } from '@baetheus/fun/async_either';
import * as E from '@baetheus/fun/either';
import type { Failable } from '@baetheus/fun/failable';
import { flow } from '@baetheus/fun/fn';
import type { $, Kind } from '@baetheus/fun/kind';

type TapLeft<U extends Kind> = <A, B>(
    onLeft: (value: B) => void
) => <C = never, D = unknown, E = unknown>(
    ua: $<U, [A, B, C], [D], [E]>
) => $<U, [A, B, C], [D], [E]>;

type TapRight<U extends Kind> = <A, B>(
    onRight: (value: A) => void
) => <C = never, D = unknown, E = unknown>(
    ua: $<U, [A, B, C], [D], [E]>
) => $<U, [A, B, C], [D], [E]>;

const noop = <B>(e: unknown) => e as B;

const tryCatch = <AS extends unknown[], A, B>(
    fasr: (...as: AS) => A | PromiseLike<A>,
    onThrow?: (e: unknown, as: AS) => B
): ((...as: AS) => AsyncEither.AsyncEither<B, A>) =>
    AsyncEither.tryCatch<AS, A, B>(fasr, onThrow ?? noop);

const left = <B = void, A = never>(left?: B): AsyncEither.AsyncEither<B, A> =>
    AsyncEither.left<B>(left!);

function createTapLeft<U extends Kind>({
    fail,
    recover
}: Failable<U>): <A, B>(
    onLeft: (value: B) => void
) => <C = never, D = unknown, E = unknown>(
    ua: $<U, [A, B, C], [D], [E]>
) => $<U, [A, B, C], [D], [E]> {
    return (onLeft) =>
        flow(
            recover((b) => {
                onLeft(b);
                return fail(b);
            })
        );
}

function createTapRight<U extends Kind>({
    wrap,
    flatmap
}: Failable<U>): <A, B>(
    onRight: (value: A) => void
) => <C = never, D = unknown, E = unknown>(
    ua: $<U, [A, B, C], [D], [E]>
) => $<U, [A, B, C], [D], [E]> {
    return (onRight) =>
        flow(
            flatmap((a) => {
                onRight(a);
                return wrap(a);
            })
        );
}

const tapLeft: TapLeft<KindAsyncEither> = (onLeft) =>
    createTapLeft<KindAsyncEither>(AsyncEither.FailableAsyncEitherParallel)(onLeft);

const tapRight: TapRight<KindAsyncEither> = (onRight) =>
    createTapRight<KindAsyncEither>(AsyncEither.FailableAsyncEitherParallel)(onRight);

const {
    flatmap,
    tryCatch: _1,
    mapSecond: _2,
    tap: _3,
    ...TE
} = {
    ...AsyncEither,
    fromPromise: tryCatch,
    flatMap: AsyncEither.flatmap,
    tryCatch,
    left,
    leftVoid: left(),
    mapLeft: AsyncEither.mapSecond,
    tapLeft,
    tapRight,
    tapBoth: AsyncEither.tap
};

export { E, TE };
