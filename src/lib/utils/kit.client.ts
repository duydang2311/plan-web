import { Type } from './typebox';
import { validator } from './validation';

export const validateActionFailureData = validator(
    Type.Object({
        errors: Type.Record(Type.String(), Type.Array(Type.String()))
    }),
    { stripLeadingSlash: true }
);

export const flattenActionFailureErrors = (errors: Record<string, string[]>) => {
    return Object.entries(errors).flatMap(([k, a]) => a.flatMap((b) => `${k}:${b}`));
};

export const stringifyActionFailureErrors = (errors: Record<string, string[]>) => {
    return flattenActionFailureErrors(errors).join(', ');
};
