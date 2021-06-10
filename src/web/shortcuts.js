export default class Shortcuts {
    constructor() {
        this._mapping = {};
    }

    bind(mapping) {
        Object.assign(this._mapping, mapping);
    }

    unbind(triggers) {
        for (const trigger of triggers) {
            delete this._mapping[trigger];
        }
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
        for (const [trigger, [description, _]] of Object.entries(this._mapping)) {
            mapping.push([trigger, description]);
        }
        return mapping;
    }

    _handler = (event) => {
        // skip the case where an input is focused
        if (event.target.tagName === 'INPUT') {
            return;
        }

        // execute the associated handler, if any
        const shortcut = this._mapping[event.key];
        if (shortcut) {
            event.preventDefault();
            const [_, action] = shortcut;
            action();
        }
    }
}
