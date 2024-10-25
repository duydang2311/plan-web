import type { Action } from 'svelte/action';
import type { Validator } from './validation';
import { A, D, pipe } from '@mobily/ts-belt';

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
    isValid: () => boolean;
    reset: () => void;
}

export type HelperField = Action & {
    state: HelperFieldState;
    reset: () => void;
    validate: () => void;
};

class HelperFieldState {
    private readonly _name: string;
    private readonly _hint?: 'array';
    public dirty = $state.raw(false);
    public touched = $state.raw(false);
    public value = $state.raw('');
    public errors = $state.raw<string[]>();

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
        this.errors = initial?.errors;
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
    const form: HelperForm = {
        fields,
        createField: (options?: CreateFieldOptions) => {
            const field = createField(options);
            fields.push(field);
            fieldsMap.set(field.state.name, field);
            return field;
        },
        validate: () => {
            for (const field of form.fields) {
                field.validate();
            }
            if (isValid() && validator) {
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
                for (const [name, errors] of Object.entries(fieldErrors)) {
                    const field = fieldsMap.get(name);
                    if (field) {
                        field.state.errors = errors;
                    }
                }
            }
        },
        getErrors: () =>
            Object.fromEntries(
                form.fields
                    .filter((a) => a.state.errors != null && a.state.errors.length > 0)
                    .map((a) => [a.state.name, a.state.errors])
            ) as {
                [k in string]: string[];
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
        initialValue,
        validator,
        hint,
        validateOnDirty = false,
        validateOnTouched = true
    } = options ?? {};
    const state = new HelperFieldState({ name, value: initialValue, hint });
    const reset = () => {
        state.dirty = false;
        state.errors = undefined;
        state.touched = false;
        state.value = initialValue ?? '';
        if (capturedNode) {
            toggleAttribute(capturedNode, 'data-touched', false);
            toggleAttribute(capturedNode, 'data-dirty', false);
            toggleAttribute(capturedNode, 'aria-invalid', false);
        }
    };

    const validate = () => {
        if (!capturedNode) {
            return;
        }

        let valid = capturedNode.checkValidity();
        if (!valid) {
            state.errors = pickValidityErrors(capturedNode.validity);
        } else if (validator) {
            const arr: string[] = [];
            validator(state, { error: (errors) => errorFn(arr, errors) });
            state.errors = arr;
            valid = arr.length > 0;
        } else {
            state.errors = undefined;
        }
        toggleAttribute(capturedNode, 'aria-invalid', !valid);
    };

    let capturedNode: HTMLInputElement | null = null;
    let dirty = false;

    const field = Object.assign(
        (node: HTMLInputElement) => {
            capturedNode = node;

            const handleInput = () => {
                if (!dirty) {
                    dirty = true;
                }
                if (!state.touched) {
                    state.touched = true;
                    toggleAttribute(node, 'data-touched', true);
                }
                if (node.hasAttribute('aria-invalid') || validateOnDirty) {
                    validate();
                }
            };

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
        { state, reset, validate }
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
