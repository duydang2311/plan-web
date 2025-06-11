<script lang="ts">
    import { enhance } from '$app/forms';
    import { RadioGroup } from 'melt/builders';
    import { Button, Errors, Field, Input, Label, Main, toast } from '~/lib/components';
    import { IconCheck, IconXMark } from '~/lib/components/icons';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import { stringifyActionFailureErrors } from '~/lib/utils/kit.client';
    import type { PageProps } from './$types';
    import EmojiSelectField from './EmojiSelectField.svelte';
    import StatusSelectField from './StatusSelectField.svelte';
    import { validateCreateMilestone } from './utils';
    import { milestoneColors } from '~/lib/features/milestones/utils';
    import EndDate from './EndDate.svelte';

    const { data }: PageProps = $props();
    const form = createForm({
        validator: formValidator(validateCreateMilestone)
    });
    const fields = {
        title: form.createField({ name: 'title' }),
        description: form.createField({ name: 'description' }),
        endTime: form.createField({
            name: 'endTime',
            validator: (state, props) => {
                if (!state.value) {
                    return props.error('required');
                }
            }
        })
    };
    const colorGroup = new RadioGroup({
        value: milestoneColors[0],
        orientation: 'horizontal'
    });
    let emoji = $state.raw('🐵');
</script>

<Main>
    <div class="max-w-paragraph-lg mx-auto">
        <h1 class="font-h-bold capitalize">Create milestone</h1>
        <p class="c-text-secondary">Add a new milestone to track your project progress.</p>
        <form
            method="post"
            class="mt-8 space-y-4"
            onreset={() => {
                emoji = '🐵';
                colorGroup.value = milestoneColors[0];
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
            <EndDate field={fields.endTime} />
            <div class="flex flex-wrap gap-4 *:flex-1 *:basis-60">
                <Field {...colorGroup.root}>
                    <input {...colorGroup.hiddenInput} name="color" value={colorGroup.value} />
                    <Label {...colorGroup.label}>Color</Label>
                    <div class="flex flex-wrap gap-2">
                        {#each milestoneColors as color (color)}
                            {@const item = colorGroup.getItem(color)}
                            <div
                                {...item.attrs}
                                class="focus-visible:ring-offset-base-1 size-10 rounded-md opacity-20 transition hover:opacity-60 focus-visible:outline-none focus-visible:ring focus-visible:ring-current focus-visible:ring-offset-1 data-[state=checked]:opacity-100"
                                style="color: {color}; background-color: {color};"
                            ></div>
                        {/each}
                    </div>
                </Field>
                <div class="flex flex-col gap-4">
                    <EmojiSelectField
                        {emoji}
                        onEmojiChange={(a) => {
                            emoji = a;
                        }}
                    />
                    <StatusSelectField projectId={data.project.id} />
                </div>
            </div>
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
