import React from 'react';

import './button.scss';

export default class Button extends React.Component {
    componentDidMount() {
        const {shortcut} = this.props;
        if (shortcut) {
            window.shortcuts.bind({
                [shortcut.trigger]: [this.props.shortcut.description, this.props.onClick]
            });
        }
    }

    render() {
        return (
            <button
                className="button"
                type="button"
                autoFocus={this.props.autoFocus}
                onClick={this.props.onClick}>
                {this.props.content || <i className={`fa fa-fw ${this.props.icon}`} />}
            </button>
        );
    }
}
