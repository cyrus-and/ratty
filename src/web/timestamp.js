import React from 'react';

import './timestamp.scss';

export default class Timestamp extends React.Component {
    render() {
        return (
            <div className="timestamp">
                {this._formatTimestamp()}
            </div>
        );
    }

    _formatTimestamp() {
        const steps = [
            {threshold: 1000, label: 'ms'},
            {threshold: 60, label: 's'},
            {threshold: 60, label: 'm'},
            {threshold: 24, label: 'h'},
            {threshold: Infinity, label: 'd'}
        ];

        // break the milliseconds timestamp in its components
        let milliseconds = this.props.frame.cumulativeDelay;
        const components = [];
        for (const {threshold} of steps) {
            components.push(milliseconds % threshold);
            milliseconds = Math.floor(milliseconds / threshold);
        }

        // format the timestamp string
        return components.map((component, index) => {
            let output = component.toString();

            // pad all the components except for the last
            if (steps[index].threshold !== Infinity) {
                output = output.padStart((steps[index].threshold - 1).toString().length, '0');
            }

            // apply the label
            return output + steps[index].label;
        }).reverse().join(':');
    }
}
