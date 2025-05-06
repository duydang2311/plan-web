import { Tabs as Builder } from 'melt/builders';
import TabsComponent from './Tabs.svelte';
import Trigger from './Trigger.svelte';

const Tabs = Object.assign(TabsComponent, {
    Builder,
    Trigger
});

export default Tabs;
