import React from 'react';

import './progress.scss';

export default class Progress extends React.Component {
    render() {
        return (
            <div
                className={`progress ${this.props.ratio in [0, 1] ? 'hidden' : 'visible'}`}
                style={{width: `${this.props.ratio * 100}%`}} />
        );
    }
}
