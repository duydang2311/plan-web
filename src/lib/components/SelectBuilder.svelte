<script lang="ts" module>
    export function createSelectProps<
        Value = unknown,
        Multiple extends boolean = false,
        S extends SelectSelected<Multiple, Value> = SelectSelected<Multiple, Value>
    >(options: CreateSelectProps<Value, Multiple, S>): CreateSelectProps<Value, Multiple, S> {
        return options;
    }

    type Elements = ReturnType<typeof createSelect>['elements'];
    type Helpers = ReturnType<typeof createSelect>['helpers'];
    type Trigger = Parameters<Parameters<Elements['trigger']['subscribe']>[0]>[0];
    type Menu = Parameters<Parameters<Elements['menu']['subscribe']>[0]>[0];
    type Option = Parameters<Parameters<Elements['option']['subscribe']>[0]>[0];
    type Group = Parameters<Parameters<Elements['group']['subscribe']>[0]>[0];
    type GroupLabel = Parameters<Parameters<Elements['groupLabel']['subscribe']>[0]>[0];
    type Label = Parameters<Parameters<Elements['label']['subscribe']>[0]>[0];
    type Arrow = Parameters<Parameters<Elements['arrow']['subscribe']>[0]>[0];
    type HiddenInput = Parameters<Parameters<Elements['hiddenInput']['subscribe']>[0]>[0];
    type IsSelected = Parameters<Parameters<Helpers['isSelected']['subscribe']>[0]>[0];
    type IsHighlighted = Parameters<Parameters<Helpers['isHighlighted']['subscribe']>[0]>[0];
    type CloseMenu = Helpers['closeMenu'];

    export interface SelectChildrenProps {
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
            closeMenu: CloseMenu;
        };
    }
</script>

<script
    lang="ts"
    generics="Value, Multiple extends boolean = false, S extends SelectSelected<Multiple, Value> = SelectSelected<Multiple, Value>"
>
    import { createSelect, type CreateSelectProps, type SelectSelected } from '@melt-ui/svelte';
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

    let { children, options }: Props = $props();

    const {
        elements: { trigger, menu, option, group, groupLabel, label, arrow, hiddenInput },
        helpers: { isSelected, isHighlighted, closeMenu }
    } = createSelect<Value, Multiple, S>(options);
    const extendedMenu = $derived(
        options?.multiple
            ? Object.assign($menu, {
                  'data-melt-select-multiple': '' as const
              })
            : $menu
    );
</script>

{@render children?.({
    trigger: $trigger,
    menu: extendedMenu,
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
