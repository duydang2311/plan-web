import { Popover as Builder } from 'melt/builders';
import Arrow from './Arrow.svelte';
import Content from './Content.svelte';
import Wrapper from './Wrapper.svelte';

const Popover = Object.assign(Content, {
    Builder,
    Wrapper,
    Arrow
});

export default Popover;
