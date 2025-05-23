<script lang="ts">
    import { Button, Logo } from '~/lib/components';
</script>

<nav class="container mx-auto px-6 py-6">
    <div class="flex items-center justify-between">
        <div class="flex items-center">
            <Logo class="text-base-fg-1 w-12" />
            <span
                class="text-base-fg-1 font-display ml-2 text-4xl font-black leading-none tracking-tight"
            >
                konekt
            </span>
        </div>
        <div class="text-base-fg-5 hidden space-x-8 text-sm md:flex">
            <a href="/" class="hover:text-base-fg-1 transition-colors">Features</a>
            <a href="/" class="hover:text-base-fg-1 transition-colors">Solutions</a>
            <a href="/" class="hover:text-base-fg-1 transition-colors">Templates</a>
            <a href="/" class="hover:text-base-fg-1 transition-colors">Pricing</a>
        </div>
        <div>
            <Button as="link" href="/login" variant="base" outline>Sign in</Button>
        </div>
    </div>
</nav>
<div class="via-base-2 h-px bg-gradient-to-r from-transparent to-transparent"></div>
<div class="relative overflow-hidden">
    <!-- Background subtle gradient -->
    <div
        class="from-primary-1/10 via-base-1 to-base-1 absolute inset-0 z-0 hidden bg-gradient-to-br dark:block"
    ></div>

    <!-- Hero content -->
    <div class="container relative z-10 mx-auto px-6 py-20 md:py-28">
        <div class="flex flex-col items-center justify-between md:flex-row">
            <!-- Text content -->
            <div class="mb-16 md:mb-0 md:pr-12">
                <h1
                    class="text-base-fg-1 mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
                >
                    Konekt.
                    <br />
                    Kreate.
                    <br />
                    Komplete.
                </h1>
                <p class="text-base-fg-4 md:text-h4 mb-8 max-w-lg font-normal leading-relaxed">
                    Organize, prioritize, and complete your tasks with a powerful platform designed
                    for high-performance teams.
                </p>
                <div class="flex flex-col gap-3 sm:flex-row">
                    <Button as="link" href="/login" variant="primary" class="w-fit">
                        Start for free
                    </Button>
                    <Button
                        as="link"
                        href="/login"
                        variant="base"
                        filled={false}
                        class="w-fit font-normal"
                    >
                        See how it works
                    </Button>
                </div>
            </div>

            <!-- Task Cards -->
            <div class="relative max-md:-translate-x-14">
                <div
                    class="animate-in grid place-items-center opacity-100 [grid-template-areas:'stack']"
                >
                    <!-- Completed Task Card -->
                    <div
                        class="task-card border-base-border-3 bg-base-2 hover:border-base-border-2 relative flex h-32 w-[20rem] select-none flex-col justify-between rounded-xl border px-4 py-3 transition-all duration-500 [grid-area:stack] hover:-translate-y-8"
                    >
                        <div class="flex items-center gap-2">
                            <span class="bg-positive-1/10 relative inline-block rounded-full p-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="text-positive-1"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </span>
                            <p class="text-positive-1 text-sm font-medium">Completed</p>
                        </div>
                        <p class="text-base font-medium">Finalize Q3 marketing plan</p>
                        <p class="text-sm text-gray-500">Yesterday, 5:30 PM</p>
                    </div>

                    <!-- In Progress Task Card -->
                    <div
                        class="task-card border-base-border-3 bg-base-2 hover:border-base-border-2 relative flex h-32 w-[20rem] translate-x-14 translate-y-8 select-none flex-col justify-between rounded-xl border px-4 py-3 transition-all duration-500 [grid-area:stack] hover:translate-y-0"
                    >
                        <div class="flex items-center gap-2">
                            <span class="relative inline-block rounded-full bg-amber-400/10 p-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="text-amber-400"
                                >
                                    <path
                                        d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                                    />
                                </svg>
                            </span>
                            <p class="text-sm font-medium text-amber-400">In Progress</p>
                        </div>
                        <p class="text-base font-medium">Client onboarding process</p>
                        <p class="text-sm text-gray-500">Due today, 3:00 PM</p>
                    </div>

                    <!-- Upcoming Task Card -->
                    <div
                        class="task-card border-base-border-3 bg-base-2 hover:border-base-border-2 relative flex h-32 w-[20rem] translate-x-28 translate-y-16 select-none flex-col justify-between rounded-xl border px-4 py-3 transition-all duration-500 [grid-area:stack] hover:translate-y-8"
                    >
                        <div class="flex items-center gap-2">
                            <span class="bg-info-1/10 relative inline-block rounded-full p-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="text-info-1"
                                >
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <p class="text-info-1 text-sm font-medium">Upcoming</p>
                        </div>
                        <p class="text-base font-medium">Product roadmap review</p>
                        <p class="text-sm text-gray-500">Tomorrow, 9:00 AM</p>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="via-primary-1 my-20 h-px bg-gradient-to-r from-transparent to-transparent"
        ></div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div
                class="bg-base-2 dark:bg-base-3 border-base-border-3 hover:border-base-border-2 rounded-lg border p-5 transition-all"
            >
                <p class="mb-1 text-3xl font-medium">85%</p>
                <p class="text-sm text-gray-500">Increased productivity</p>
            </div>
            <div
                class="bg-base-2 dark:bg-base-3 border-base-border-3 hover:border-base-border-2 rounded-lg border p-5 transition-all"
            >
                <p class="mb-1 text-3xl font-medium">15k+</p>
                <p class="text-sm text-gray-500">Active teams</p>
            </div>
            <div
                class="bg-base-2 dark:bg-base-3 border-base-border-3 hover:border-base-border-2 rounded-lg border p-5 transition-all"
            >
                <p class="mb-1 text-3xl font-medium">30%</p>
                <p class="text-sm text-gray-500">Less meetings</p>
            </div>
            <div
                class="bg-base-2 dark:bg-base-3 border-base-border-3 hover:border-base-border-2 rounded-lg border p-5 transition-all"
            >
                <p class="mb-1 text-3xl font-medium">50M+</p>
                <p class="text-sm text-gray-500">Tasks completed</p>
            </div>
        </div>
    </div>
</div>
