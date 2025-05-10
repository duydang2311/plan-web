import { Select as Builder } from 'melt/builders';
import { IconChevronUpDown } from '../icons';
import Check from './Check.svelte';
import Option from './Option.svelte';
import SelectComponent from './Select.svelte';

const Select = Object.assign(SelectComponent, {
    Builder,
    Option,
    Check,
    Icon: IconChevronUpDown
});

export default Select;
