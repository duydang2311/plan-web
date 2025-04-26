import { Type } from './typebox';
import { validator } from './validation';

export const validateActionFailureData = validator(
    Type.Object({
        errors: Type.Record(Type.String(), Type.Array(Type.String()))
    }),
    { stripLeadingSlash: true }
);

export const flattenActionFailureErrors = (errors: Record<string, string[]>) => {
    return Object.entries(errors).map(([k, v]) => `${k}: ${v.join(', ')}`);
};

export const stringifyActionFailureErrors = (errors: Record<string, string[]>) => {
    return Object.entries(errors)
        .map(([k, v]) => `${k}: ${v.join(', ')}`)
        .join('; ');
};
