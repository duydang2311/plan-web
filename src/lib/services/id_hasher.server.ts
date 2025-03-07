import { Context, Layer } from 'effect';
import Sqids from 'sqids';
import { createIdHasher } from './id_hasher';

export class IdHasher extends Context.Tag('@app/IdHasher')<IdHasher, Sqids>() {
    public static readonly Live = Layer.sync(IdHasher, () => createIdHasher());
}
