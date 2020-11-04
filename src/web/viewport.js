import React from 'react';
import {Terminal} from 'xterm';

import './viewport.scss';

export default class Viewport extends React.Component {
    constructor(props) {
        super(props)
        this.root = React.createRef();
    }

    componentDidMount() {
        // create and set up the terminal
        this.terminal = new Terminal({
            fontSize: this.props.fontSize
        });
        this.terminal.attachCustomKeyEventHandler(() => false);

        // open the terminal and hide the cursor
        this.terminal.open(this.root.current);
        this.terminal.write('\x1b[?25l');

        // force yet another UI update since the first invocation of render
        // simply created the DOM but did not display the frame (since the
        // terminal is created here: render, componentDidMount, render,
        // render, etc.)
        this.forceUpdate();
    }

    componentWillUnmount() {
        this.terminal.dispose();
    }

    render() {
        // write the frame when the properties (e.g., the cursor) changes
        this._displayFrame();

        return (
            <div className="viewport">
                <div ref={this.root} />
            </div>
        );
    }

    _displayFrame() {
        // display the current frame (the first time the terminal is yet to be created)
        if (this.terminal) {
            // first resize to accomodate the frame, then clear the terminal
            // content and writes the frame atomically
            const frame = this.props.session.getFrames()[this.props.cursor];
            this.terminal.resize(frame.columns, frame.rows);
            this.terminal.write(`\x1bc${frame.output}`);

            // update the font size
            this.terminal.setOption('fontSize', this.props.fontSize);
        }
    }
}
