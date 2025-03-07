import Sqids from 'sqids';

export const createIdHasher = () => new Sqids({ minLength: 8 });
