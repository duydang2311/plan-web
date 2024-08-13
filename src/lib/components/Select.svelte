<script lang="ts" context="module">
    export function createSelectProps<
        Value = unknown,
        Multiple extends boolean = false,
        S extends SelectSelected<Multiple, Value> = SelectSelected<Multiple, Value>
    >(options: CreateSelectProps<Value, Multiple, S>): CreateSelectProps<Value, Multiple, S> {
        return options;
    }
</script>

<script
    lang="ts"
    generics="Value, Multiple extends boolean = false, S extends SelectSelected<Multiple, Value> = SelectSelected<Multiple, Value>"
>
    import {
        createSelect,
        createSync,
        type CreateSelectProps,
        type SelectSelected
    } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet<
            [
                {
                    trigger: Trigger;
                    menu: Menu;
                    option: Option;
                    group: Group;
                    groupLabel: GroupLabel;
                    label: Label;
                    arrow: Arrow;
                    hiddenInput: HiddenInput;
                    helpers: {
                        isSelected: IsSelected;
                        isHighlighted: IsHighlighted;
                        closeMenu: typeof closeMenu;
                    };
                }
            ]
        >;
        options?: CreateSelectProps<Value, Multiple, S>;
        open?: boolean;
    }

    type Trigger = Parameters<Parameters<typeof trigger.subscribe>[0]>[0];
    type Menu = Parameters<Parameters<typeof menu.subscribe>[0]>[0];
    type Option = Parameters<Parameters<typeof option.subscribe>[0]>[0];
    type Group = Parameters<Parameters<typeof group.subscribe>[0]>[0];
    type GroupLabel = Parameters<Parameters<typeof groupLabel.subscribe>[0]>[0];
    type Label = Parameters<Parameters<typeof label.subscribe>[0]>[0];
    type Arrow = Parameters<Parameters<typeof arrow.subscribe>[0]>[0];
    type HiddenInput = Parameters<Parameters<typeof hiddenInput.subscribe>[0]>[0];
    type IsSelected = Parameters<Parameters<typeof isSelected.subscribe>[0]>[0];
    type IsHighlighted = Parameters<Parameters<typeof isHighlighted.subscribe>[0]>[0];

    let { children, open = $bindable(false), options }: Props = $props();

    const {
        elements: { trigger, menu, option, group, groupLabel, label, arrow, hiddenInput },
        states,
        helpers: { isSelected, isHighlighted, closeMenu }
    } = createSelect<Value, Multiple, S>(options);

    const sync = createSync({
        open: states.open
    });

    $effect(() => {
        sync.open(open, (v) => (open = v));
    });
</script>

{@render children?.({
    trigger: $trigger,
    menu: $menu,
    option: $option,
    group: $group,
    groupLabel: $groupLabel,
    label: $label,
    arrow: $arrow,
    hiddenInput: $hiddenInput,
    helpers: {
        isSelected: $isSelected,
        isHighlighted: $isHighlighted,
        closeMenu
    }
})}
