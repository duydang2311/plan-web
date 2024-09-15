<script lang="ts">
    import { enhance } from '$app/forms';
    import { D } from '@mobily/ts-belt';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import { hasProperty } from '~/lib/utils/commons';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { ActionData, PageData } from './$types';
    import { validate } from './utils';

    const errorMap = {
        root: {
            unknown: 'An unknown error has occurred on server',
            fetch: 'Could not issue the request',
            500: 'An unknown error has occurred on server',
            404: 'Could not connect to server'
        },
        name: {
            required: 'Enter workspace name'
        },
        identifier: {
            required: 'Enter workspace identifier',
            maxLength: 'Enter workspace identifier with 5 characters at most',
            invalid: 'The identifier has been reserved for internal usage'
        }
    };

    let { form, data }: { form: ActionData; data: PageData } = $props();
    let fields = $state({
        workspaceId: data.workspace.id,
        name: '',
        identifier: '',
        description: ''
    });
    let status = $state<'submitting' | null>(null);
    let validation: ValidationResult | undefined;
    let dirty = $state(false);

    const errors = $derived(form?.errors ?? {}) as Record<string, string[]>;

    function nameToIdentifier(name: string) {
        return name
            .replace(/[^A-Za-z0-9\s-]/g, '')
            .replace(/\s/g, '-')
            .toLocaleLowerCase();
    }
</script>

<main class="max-w-paragraph-lg mx-auto p-8 space-y-8">
    <div>
        <h2 class="mb-2">Create a project</h2>
        <p class="mb-8">Create a project to manage separate group of issues.</p>
        <hr />
    </div>

    <form
        method="post"
        class="space-y-2"
        onchange={() => {
            validation = validate(fields);
            form = validation.ok
                ? null
                : {
                      errors: D.filterWithKey(
                          validation.errors,
                          (k) => hasProperty(fields, k) && !!fields[k]
                      ) as typeof validation.errors
                  };
        }}
        use:enhance={(e) => {
            if (!validation?.ok) {
                e.cancel();
                return;
            }
            status = 'submitting';
            return async ({ update }) => {
                status = null;
                await update();
            };
        }}
    >
        <input type="hidden" name="workspaceId" value={fields.workspaceId} />
        <div class="flex gap-4 flex-wrap">
            <fieldset class="space-y-1 grow">
                <Label for="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    autofocus
                    required
                    aria-invalid={errors['name'] ? 'true' : undefined}
                    bind:value={fields.name}
                    oninput={() => {
                        if (!dirty) {
                            fields.identifier = nameToIdentifier(fields.name);
                        }
                    }}
                />
            </fieldset>
            <fieldset class="space-y-1 grow basis-48">
                <Label for="identifier">Identifier</Label>
                <Input
                    id="identifier"
                    name="identifier"
                    autofocus
                    required
                    aria-invalid={errors['identifier'] ? 'true' : undefined}
                    bind:value={fields.identifier}
                    oninput={() => {
                        if (fields.identifier === '') {
                            dirty = false;
                        } else if (fields.identifier !== nameToIdentifier(fields.name)) {
                            dirty = true;
                        }
                    }}
                    onblur={() => {
                        if (!dirty && fields.identifier === '') {
                            fields.identifier = nameToIdentifier(fields.name);
                        }
                    }}
                    class="lowercase"
                />
                <Errors errors={errors['identifier']} errorMap={errorMap.identifier} />
                <p class="text-base-fg-3">
                    <small
                        >The identifier (e.g. {fields.identifier.length
                            ? fields.identifier.toLocaleLowerCase()
                            : 'project-abc'}) of the project to be displayed in the URL.</small
                    >
                </p>
            </fieldset>
        </div>
        <fieldset class="space-y-1">
            <Label for="description">Description (optional)</Label>
            <Input
                id="description"
                name="description"
                autofocus
                aria-invalid={errors['description'] ? 'true' : undefined}
                bind:value={fields.description}
            />
        </fieldset>
        <Button variant="primary" class="!mt-4 capitalize w-fit" disabled={status === 'submitting'}>
            Create project
        </Button>
    </form>
    <Errors errors={errors['root']} errorMap={errorMap.root} />
</main>
