import { A, D, pipe } from '@mobily/ts-belt';
import { untrack } from 'svelte';
import type { Action } from 'svelte/action';
import { isEmptyObject } from './commons';
import type { Validator } from './validation';

let count = 0;

interface FormValidatorUtils {
    error: (name: string, ...errors: string[]) => void;
}

interface ValidatorUtils {
    error: (...errors: string[]) => void;
}

interface CreateFormOptions {
    validator?: (form: HelperForm, props: FormValidatorUtils) => void;
}

interface CreateFieldOptions {
    name?: string;
    initialValue?: string;
    hint?: 'array';
    validateOnTouched?: boolean;
    validateOnDirty?: boolean;
    validator?: (state: HelperFieldState, props: ValidatorUtils) => void;
}

export interface HelperForm {
    fields: HelperField[];
    createField: (options?: CreateFieldOptions) => HelperField;
    validate: () => void;
    getErrors: () => { [k in string]: string[] };
    setErrors: (errors: { [k in string]: string[] }) => void;
    isValid: () => boolean;
    reset: () => void;
}

export type HelperField = Action & {
    state: HelperFieldState;
    reset: () => void;
    validate: () => string[] | null;
    setErrors: (errors?: string[] | null) => void;
    getNode: () => HTMLElement | null;
};

class HelperFieldState {
    private readonly _name: string;
    private readonly _hint?: 'array';
    public dirty = $state.raw(false);
    public touched = $state.raw(false);
    public value = $state.raw('');
    public errors = $state.raw<string[] | null>(null);

    public constructor(initial?: {
        name?: string;
        hint?: 'array';
        dirty?: boolean;
        touched?: boolean;
        value?: string;
        errors?: string[];
    }) {
        this._name = initial?.name ?? `field_${++count}`;
        this._hint = initial?.hint;
        this.dirty = initial?.dirty ?? false;
        this.touched = initial?.touched ?? false;
        this.value = initial?.value ?? '';
        this.errors = initial?.errors ?? null;
    }

    public get name() {
        return this._name;
    }

    public get hint() {
        return this._hint;
    }
}

export const createForm = ({ validator }: CreateFormOptions = {}) => {
    const fields: HelperField[] = [];
    const fieldsMap = new Map<string, HelperField>();
    const isValid = () =>
        fields.every(({ state: { errors } }) => errors == null || errors.length === 0);
    const getErrors = () =>
        Object.fromEntries(
            form.fields
                .filter((a) => a.state.errors != null && a.state.errors.length > 0)
                .map((a) => [a.state.name, a.state.errors])
        ) as {
            [k in string]: string[];
        };
    const validate = () => {
        let anyErrors = false;
        const r: { [k in string]: string[] } = {};
        for (const field of fields) {
            const errors = field.validate();
            if (errors) {
                anyErrors = true;
                r[field.state.name] = errors;
            }
        }

        if (anyErrors) {
            return r;
        }

        if (validator) {
            const fieldErrors: { [k in string]: string[] } = {};
            validator(form, {
                error: (name, ...errors) => {
                    if (!fieldErrors[name]) {
                        fieldErrors[name] = errors;
                    } else {
                        fieldErrors[name].push(...errors);
                    }
                }
            });
            return isEmptyObject(fieldErrors) ? null : fieldErrors;
        }
        return null;
    };

    const handleBlur = () => {
        const errors = validate();
        if (errors) {
            for (const [k, v] of Object.entries(errors)) {
                const field = fieldsMap.get(k);
                if (!field) {
                    continue;
                }

                const node = field.getNode();
                if (!node || !node.hasAttribute('data-dirty')) {
                    continue;
                }
                field.setErrors(v);
            }
        }
    };
    const form: HelperForm = {
        fields,
        createField: (options?: CreateFieldOptions) => {
            const __field = createField(options);
            const field = Object.assign((node: HTMLElement) => {
                const ret = __field(node);
                node.addEventListener('blur', handleBlur);
                return {
                    destroy: () => {
                        ret.destroy();
                        node.removeEventListener('blur', handleBlur);
                    }
                };
            }, __field);
            fields.push(field);
            fieldsMap.set(field.state.name, field);
            return field;
        },
        validate: () => {
            const errors = validate();
            for (const [name, field] of fieldsMap) {
                field.setErrors(errors?.[name]);
            }
        },
        getErrors,
        setErrors: (errors) => {
            for (const [k, v] of Object.entries(errors)) {
                const field = fieldsMap.get(k);
                if (field) {
                    field.setErrors(v);
                }
            }
        },
        isValid,
        reset: () => {
            for (const field of form.fields) {
                field.reset();
            }
        }
    };

    return Object.assign((node: HTMLFormElement) => {
        node.noValidate = true;
        node.addEventListener('reset', form.reset);
        return {
            destroy: () => {
                node.removeEventListener('reset', form.reset);
                fields.splice(0);
                fieldsMap.clear();
            }
        };
    }, form);
};

export const createField = <T extends CreateFieldOptions>(options?: T) => {
    const {
        name,
        initialValue = '',
        validator,
        hint,
        validateOnDirty = false,
        validateOnTouched = true
    } = options ?? {};
    const state = new HelperFieldState({ name, value: initialValue, hint });
    const reset = () => {
        state.dirty = false;
        state.errors = null;
        state.touched = false;
        state.value = initialValue ?? '';
        if (capturedNode) {
            toggleAttribute(capturedNode, 'data-touched', false);
            toggleAttribute(capturedNode, 'data-dirty', false);
            toggleAttribute(capturedNode, 'aria-invalid', false);
        }
    };

    const validate = () => {
        if (capturedNode instanceof HTMLInputElement && !capturedNode.checkValidity()) {
            return pickValidityErrors(capturedNode.validity);
        } else if (validator) {
            const arr: string[] = [];
            validator(state, { error: (errors) => errorFn(arr, errors) });
            return arr;
        }
        return null;
    };

    const setErrors = (errors?: string[] | null) => {
        if (errors && errors.length) {
            state.errors = errors;
            if (capturedNode) {
                toggleAttribute(capturedNode, 'aria-invalid', true);
            }
        } else {
            state.errors = null;
            if (capturedNode) {
                toggleAttribute(capturedNode, 'aria-invalid', false);
            }
        }
    };

    let capturedNode: HTMLElement | null = null;
    let dirty = false;

    const field = Object.assign(
        (node: HTMLElement) => {
            capturedNode = node;

            const handleInput = () => {
                if (!dirty) {
                    dirty = true;
                }
                if (!state.touched) {
                    state.touched = true;
                    toggleAttribute(node, 'data-touched', true);
                }
                if (!state.dirty) {
                    state.dirty = true;
                    toggleAttribute(node, 'data-dirty', true);
                }
                if (node.hasAttribute('aria-invalid') || validateOnDirty) {
                    setErrors(validate());
                }
            };

            $effect.pre(() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                state.value;
                untrack(() => {
                    if (!state.dirty && state.value !== initialValue) {
                        state.dirty = true;
                        toggleAttribute(node, 'data-dirty', true);
                    }
                });
            });

            const handleBlur = () => {
                if (!state.touched) {
                    state.touched = true;
                    toggleAttribute(node, 'data-touched', true);
                }
                if (dirty && !state.dirty) {
                    state.dirty = true;
                    toggleAttribute(node, 'data-dirty', true);
                }
                if (state.dirty && validateOnTouched) {
                    validate();
                }
            };

            node.addEventListener('input', handleInput);
            node.addEventListener('blur', handleBlur);
            return {
                destroy: () => {
                    node.removeEventListener('input', handleInput);
                    node.removeEventListener('blur', handleBlur);
                    capturedNode = null;
                }
            };
        },
        {
            state,
            reset,
            validate,
            getNode: () => capturedNode,
            setErrors
        }
    );
    return field;
};

export const formValidator =
    <T>(validator: Validator<T>): ((form: HelperForm, props: FormValidatorUtils) => void) =>
    (form, { error }) => {
        const input = pipe(
            form.fields,
            A.groupBy((a) => a.state.name),
            D.map((a) =>
                a.some((b) => b.state.hint === 'array')
                    ? a.flatMap((a) => a.state.value)
                    : a[0].state.value
            )
        );
        const validation = validator(input);
        if (!validation.ok) {
            for (const [name, errors] of Object.entries(validation.errors)) {
                error(name, ...errors);
            }
        }
    };

const toggleAttribute = (node: HTMLElement, attribute: string, toggle: boolean) => {
    if (toggle) {
        node.setAttribute(attribute, '');
    } else {
        node.removeAttribute(attribute);
    }
};

const errorFn = (arr: string[], ...errors: string[]) => {
    arr.push(...errors);
};

const pickValidityErrors = (validity: ValidityState) => {
    const errors: string[] = [];
    if (validity.badInput) {
        errors.push('badInput');
    }
    if (validity.customError) {
        errors.push('customError');
    }
    if (validity.patternMismatch) {
        errors.push('patternMismatch');
    }
    if (validity.rangeOverflow) {
        errors.push('rangeOverflow');
    }
    if (validity.rangeUnderflow) {
        errors.push('rangeUnderflow');
    }
    if (validity.stepMismatch) {
        errors.push('stepMismatch');
    }
    if (validity.tooLong) {
        errors.push('tooLong');
    }
    if (validity.tooShort) {
        errors.push('tooShort');
    }
    if (validity.typeMismatch) {
        errors.push('typeMismatch');
    }
    if (validity.valid) {
        errors.push('valid');
    }
    if (validity.valueMissing) {
        errors.push('valueMissing');
    }
    return errors;
};
