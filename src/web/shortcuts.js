export default class Shortcuts {
    constructor(mapping) {
        this.mapping = {};
    }

    bind(mapping) {
        Object.assign(this.mapping, mapping);
    }

    register() {
        window.addEventListener('keydown', this._handler);
    }

    deregister() {
        window.removeEventListener('keydown', this._handler);
    }

    getMapping() {
        // return the mapping as an array without the actual action
        const mapping = [];
        for (const [trigger, [description, _]] of Object.entries(this.mapping)) {
            mapping.push([trigger, description]);
        }
        return mapping;
    }

    _handler = (event) => {
        const shortcut = this.mapping[event.key];
        if (shortcut) {
            event.preventDefault();
            const [_, action] = shortcut;
            action();
        }
    }
}
