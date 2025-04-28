import { Context } from 'effect';
import Sqids from 'sqids';

export class IdHasher extends Context.Tag('@app/IdHasher')<IdHasher, Sqids>() {}
