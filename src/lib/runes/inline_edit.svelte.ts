import type { Attachment } from 'svelte/attachments';

export const createInlineEdit = (editing?: boolean) => {
    return new SvelteInlineEdit(editing);
};

class SvelteInlineEdit {
    editing = $state.raw(false);
    #ignoreKeyUp = false;

    constructor(editing?: boolean) {
        this.editing = editing ?? false;
    }

    get input(): Attachment<HTMLElement> {
        return (element) => {
            element.addEventListener('keydown', SvelteInlineEdit.handleInputKeyDown);
            element.addEventListener('keyup', this.handleInputKeyUp);
            element.focus();
            return () => {
                element.removeEventListener('keydown', SvelteInlineEdit.handleInputKeyDown);
                element.removeEventListener('keyup', this.handleInputKeyUp);
            };
        };
    }

    get root(): Attachment<HTMLElement> {
        return (element) => {
            element.addEventListener('dblclick', this.handleRootDblClick);
            element.addEventListener('keydown', this.handleRootKeyDown);
            element.addEventListener('keyup', this.handleRootKeyUp);
            return () => {
                element.removeEventListener('dblclick', this.handleRootDblClick);
                element.removeEventListener('keydown', this.handleRootKeyDown);
                element.removeEventListener('keyup', this.handleRootKeyUp);
            };
        };
    }

    private static handleInputKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            e.preventDefault();
        } else if (e.key === 'Enter') {
            e.stopPropagation();
        }
    }

    private handleInputKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.editing = false;
        }
    };

    private handleRootDblClick = () => {
        if (!this.editing) {
            this.editing = true;
        }
    };

    private handleRootKeyDown = (e: KeyboardEvent) => {
        if (!this.editing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
        }
    };

    private handleRootKeyUp = (e: KeyboardEvent) => {
        if (this.#ignoreKeyUp) {
            this.#ignoreKeyUp = false;
            return;
        }
        if (!this.editing && (e.key === 'Enter' || e.key === ' ')) {
            this.editing = true;
        }
    };
}
