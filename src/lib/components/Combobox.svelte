<script
    lang="ts"
    generics="Value, Multiple extends boolean = false, S extends ComboboxSelected<Multiple, Value> = ComboboxSelected<Multiple, Value>"
>
    import {
        createCombobox,
        createSync,
        type ComboboxSelected,
        type CreateComboboxProps
    } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        options?: CreateComboboxProps<Value, Multiple, S>;
        children: Snippet<
            [
                {
                    input: Parameters<Parameters<Elements['input']['subscribe']>[0]>[0];
                    label: Parameters<Parameters<Elements['label']['subscribe']>[0]>[0];
                    menu: Parameters<Parameters<Elements['menu']['subscribe']>[0]>[0];
                    option: Parameters<Parameters<Elements['option']['subscribe']>[0]>[0];
                    arrow: Parameters<Parameters<Elements['arrow']['subscribe']>[0]>[0];
                    group: Parameters<Parameters<Elements['group']['subscribe']>[0]>[0];
                    groupLabel: Parameters<Parameters<Elements['groupLabel']['subscribe']>[0]>[0];
                    hiddenInput: Parameters<Parameters<Elements['hiddenInput']['subscribe']>[0]>[0];
                    helpers: {
                        isSelected: (item: Value) => boolean;
                        isHighlighted: (item: Value) => boolean;
                        closeMenu: () => void;
                    };
                }
            ]
        >;
        open?: boolean;
        inputValue?: string;
    }

    type Elements = ReturnType<typeof createCombobox<Value, Multiple, S>>['elements'];

    let {
        options,
        open = $bindable(false),
        inputValue = $bindable(''),
        children
    }: Props = $props();

    const {
        elements: { input, label, menu, option, arrow, group, groupLabel, hiddenInput },
        states,
        helpers: { isSelected, isHighlighted, closeMenu }
    } = createCombobox<Value, Multiple, S>(options);

    const sync = createSync({
        open: states.open,
        inputValue: states.inputValue
    });

    $effect(() => {
        sync.open(open, (v) => (open = v));
        sync.inputValue(inputValue, (v) => (inputValue = v));
    });
</script>

{@render children({
    input: $input,
    label: $label,
    menu: $menu,
    option: $option,
    arrow: $arrow,
    group: $group,
    groupLabel: $groupLabel,
    hiddenInput: $hiddenInput,
    helpers: {
        isSelected: $isSelected,
        isHighlighted: $isHighlighted,
        closeMenu
    }
})}
