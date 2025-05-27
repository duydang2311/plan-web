<script lang="ts">
    import { RadioGroup } from 'melt/builders';
    import { Button, Errors, Field, Input, Label, Main, toast } from '~/lib/components';
    import { IconCheck, IconXMark } from '~/lib/components/icons';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import EmojiSelectField from './EmojiSelectField.svelte';
    import { enhance } from '$app/forms';
    import { validateCreateMilestone } from './utils';
    import { stringifyActionFailureErrors } from '~/lib/utils/kit.client';
    import type { PageProps } from './$types';

    const { data }: PageProps = $props();
    const form = createForm({
        validator: formValidator(validateCreateMilestone)
    });
    const fields = {
        title: form.createField({ name: 'title' }),
        description: form.createField({ name: 'description' })
    };
    const colors = [
        'oklch(0.72 0.18 10)',
        'oklch(0.73 0.18 30)',
        'oklch(0.75 0.17 50)',
        'oklch(0.76 0.18 70)',
        'oklch(0.75 0.20 95)',
        'oklch(0.74 0.20 120)',
        'oklch(0.73 0.20 145)',
        'oklch(0.72 0.21 170)',
        'oklch(0.71 0.20 195)',
        'oklch(0.70 0.19 220)',
        'oklch(0.68 0.18 245)',
        'oklch(0.67 0.18 270)',
        'oklch(0.68 0.19 290)',
        'oklch(0.70 0.18 310)',
        'oklch(0.72 0.17 330)',
        'oklch(0.73 0.17 350)',
        'oklch(0.66 0.09 250)',
        'oklch(0.70 0.08 110)',
        'oklch(0.72 0.10 40)',
        'oklch(0.68 0.07 20)'
    ];
    const colorGroup = new RadioGroup({
        value: colors[0],
        orientation: 'horizontal'
    });
    let emoji = $state.raw('🐵');
</script>

<Main>
    <div class="max-w-paragraph-lg mx-auto">
        <h1 class="capitalize">Create milestone</h1>
        <p class="c-text-secondary">Add a new milestone to track your project progress.</p>
        <form
            method="post"
            class="mt-8 space-y-4"
            onreset={() => {
                emoji = '🐵';
                colorGroup.value = colors[0];
            }}
            use:form
            use:enhance={(e) => {
                form.validate();
                if (!form.isValid()) {
                    e.cancel();
                    return;
                }

                return async (e) => {
                    if (e.result.type === 'failure') {
                        toast({
                            type: 'negative',
                            header: 'Milestone creation failed',
                            body: 'Something went wrong while creating the milestone.',
                            footer: stringifyActionFailureErrors(
                                e.result.data!.errors as Record<string, string[]>
                            )
                        });
                    } else if (e.result.type === 'redirect') {
                        toast({
                            type: 'positive',
                            header: 'Milestone created successfully',
                            body: 'You can now view and manage your milestone.'
                        });
                    }
                    await e.update();
                };
            }}
        >
            <input type="hidden" name="projectId" value={data.project.id} />
            <Field>
                <Label for={fields.title.state.name}>Title</Label>
                <Input
                    type="text"
                    action={fields.title}
                    name={fields.title.state.name}
                    bind:value={fields.title.state.value}
                    required
                    placeholder="Enter milestone title"
                />
                <Errors errors={fields.title.state.errors} />
            </Field>
            <Field>
                <Label for={fields.description.state.name}>Description (optional)</Label>
                <Input
                    type="text"
                    action={fields.description}
                    name={fields.description.state.name}
                    bind:value={fields.description.state.value}
                    placeholder="Enter milestone description"
                />
            </Field>
            <div class="flex flex-wrap gap-4 *:flex-1 *:basis-16">
                <EmojiSelectField
                    {emoji}
                    onEmojiChange={(a) => {
                        emoji = a;
                    }}
                />
                <Field {...colorGroup.root}>
                    <input {...colorGroup.hiddenInput} name="color" value={colorGroup.value} />
                    <Label {...colorGroup.label}>Color</Label>
                    <div class="flex flex-wrap gap-2">
                        {#each colors as color (color)}
                            {@const item = colorGroup.getItem(color)}
                            <div
                                {...item.attrs}
                                class="focus-visible:ring-offset-base-1 size-10 rounded-md opacity-20 transition hover:opacity-60 focus-visible:outline-none focus-visible:ring focus-visible:ring-current focus-visible:ring-offset-1 data-[state=checked]:opacity-100"
                                style="color: {color}; background-color: {color};"
                            ></div>
                        {/each}
                    </div>
                </Field>
            </div>
            <div class="flex gap-2 *:w-fit">
                <Button type="reset" variant="base" outline class="flex items-center gap-2">
                    <IconXMark />
                    Reset
                </Button>
                <Button type="submit" variant="primary" class="flex items-center gap-2">
                    <IconCheck />
                    Create
                </Button>
            </div>
        </form>
    </div>
</Main>
