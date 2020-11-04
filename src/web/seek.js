import React from 'react';

import './seek.scss';

export default class Seek extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            active: false
        };
        this.trigger = React.createRef();
    }

    render() {
        const ratio = this.props.cursor / (this.props.totalFrames - 1);

        return (
            <div
                ref={this.trigger}
                className={`seek ${this.state.active ? 'active' : ''}`}
                onMouseDown={this._handleMouseDown}>
                <div style={{width: `${ratio * 100}%`}} />
            </div>
        );
    }

    _handleMouseDown = (event) => {
        event.preventDefault();

        const move = (event) => {
            // compute the ratio according to the mouse move event
            this.setState({active: true});
            const rect = this.trigger.current.getBoundingClientRect();
            const ratio = Math.max(Math.min((event.clientX - rect.x) / rect.width, 1), 0);
            this.props.onSeek(ratio);
        };

        const up = () => {
            // remove global event handlers
            this.setState({active: false});
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };

        // once selected then the event is registered globally for better interaction
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        move(event);
    }
}
