import Button from './button';
import React from 'react';

import './cycle.scss';

const CHOICES = [
    {label: 'REAL', value: Infinity},
    {label: 'SLOW', value: 1000},
    {label: 'FAIR', value: 500},
    {label: 'FAST', value: 100}
];

export default class Cycle extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            index: 0
        };
        window.shortcuts.bind({
            't': ['Cycle max frame duration', this._handleClick]
        });
    }

    render() {
        return (
            <Button
                className="cycle"
                onClick={this._handleClick}
                content={CHOICES[this.state.index].label} />
        );
    }

    _handleClick = () => {
        this.setState((state) => {
            // cycle through the choices
            return {
                index: (state.index + 1) % CHOICES.length
            };
        }, () => {
            // notify the parent of the current choice
            this.props.onChange(CHOICES[this.state.index].value);
        });
    }
}
