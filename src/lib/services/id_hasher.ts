import Sqids from 'sqids';

export const createIdHasher = (alphabet: string) => new Sqids({ minLength: 8, alphabet });
