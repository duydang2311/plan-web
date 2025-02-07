import { Type } from './typebox';
import { validator } from './validation';

export const validateActionFailureData = validator(
    Type.Object({
        errors: Type.Record(Type.String(), Type.Array(Type.String()))
    }),
    { stripLeadingSlash: true }
);
