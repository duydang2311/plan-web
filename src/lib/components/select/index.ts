import { Select as Builder } from 'melt/builders';
import SelectComponent from './Select.svelte';
import Option from './Option.svelte';
import Check from './Check.svelte';

const Select = Object.assign(SelectComponent, {
    Builder,
    Option,
    Check,
})

export default Select;

