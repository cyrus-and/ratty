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

        // if a maximum is provided use it to determine where to stop
        let stopAt = Infinity;
        let {maximum} = this.props;
        if (maximum) {
            for (stopAt = 0; stopAt < steps.length && maximum; stopAt++) {
                maximum = Math.floor(maximum / steps[stopAt].threshold);
            }
        }

        // break the milliseconds timestamp in its components
        let milliseconds = this.props.frame.cumulativeDelay;
        const components = [];
        for (const {threshold} of steps) {
            components.push(milliseconds % threshold);
            milliseconds = Math.floor(milliseconds / threshold);
        }

        // if a maximum is not provided drop the components that are zero
        if (!this.props.maximum) {
            while (components.length > 1 && components[components.length - 1] === 0) {
                components.pop();
            }
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
        }).slice(0, stopAt).reverse().join(':');
    }
}
