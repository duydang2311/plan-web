import { Context } from 'effect';

export class Fetcher extends Context.Tag('Fetcher')<Fetcher, typeof fetch>() {}
