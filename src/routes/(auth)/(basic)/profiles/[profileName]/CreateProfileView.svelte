<script>
    import { Button, Field, Input, Label, TextArea } from '~/lib/components';
</script>

<main class="lg:max-w-paragraph-lg mx-auto grow content-center">
    <div>
        <h1>Create profile</h1>
        <p class="text-base-fg-3">A profile helps people know more about you.</p>
    </div>
    <form method="post" class="space-y-8 mt-4">
        <div class="flex max-lg:flex-wrap gap-4 basis-20">
            <Field class="grow">
                <Label for="firstName">First name</Label>
                <Input type="text" id="firstName" name="firstName" placeholder="John" />
            </Field>
            <Field class="grow">
                <Label for="lastName">Last name</Label>
                <Input type="text" id="lastName" name="lastName" placeholder="Smith" />
            </Field>
            <Field class="grow">
                <Label for="name">Username</Label>
                <Input type="text" id="name" name="name" placeholder="john.smith123" />
            </Field>
        </div>

        <fieldset class="space-y-4">
            <legend class="text-h4 text-base-fg-3">Optional information</legend>
            <Field class="w-full !mt-2">
                <Label for="name">Profile picture (optional)</Label>
                <Input type="file" id="imageUrl" name="imageUrl" />
            </Field>
            <Field class="w-full">
                <Label for="bio">Bio (optional)</Label>
                <TextArea
                    id="bio"
                    name="bio"
                    placeholder="Add your bio..."
                    rows={4}
                    class="resize-none"
                />
            </Field>
            <Field class="w-full">
                <Label for="bio">Social links (optional)</Label>
                <div class="space-y-4">
                    <Input type="text" id="socialLink" name="socialLink" placeholder="https://" />
                    <Input type="text" id="socialLink" name="socialLink" placeholder="https://" />
                </div>
            </Field>
        </fieldset>
        <div class="flex gap-4 justify-end">
            <Button type="reset" variant="base" outline class="w-fit">Reset</Button>
            <Button type="submit" variant="primary" outline class="w-fit">Create</Button>
        </div>
    </form>
</main>
