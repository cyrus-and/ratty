import Button from './button';
import React from 'react';

import './cycle.scss';

export default class Cycle extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            index: 0
        };
    }

    componentDidMount() {
        // register the shortcut
        const {shortcut} = this.props;
        if (shortcut) {
            window.shortcuts.bind({
                [shortcut.trigger]: [this.props.shortcut.description, this._handleClick]
            });
        }

        // synthetically trigger the first time with the default value
        this._notify();
    }

    render() {
        return (
            <Button
                className="cycle"
                onClick={this._handleClick}
                content={this.props.choices[this.state.index].label} />
        );
    }

    _notify = () => {
        // notify the parent of the current choice
        this.props.onChange(this.props.choices[this.state.index].value);
    }

    _handleClick = () => {
        this.setState((state) => {
            // cycle through the choices
            return {
                index: (state.index + 1) % this.props.choices.length
            };
        }, this._notify);
    }
}
