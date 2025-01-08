import { validator } from '~/lib/utils/validation';
import { Type } from '~/lib/utils/typebox';

export const validateActionFailureData = validator(
    Type.Object({
        errors: Type.Object({
            root: Type.Array(Type.String())
        })
    })
);
