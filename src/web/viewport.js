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
            fontSize: this.props.fontSize,
            scrollback: 0
        });
        this.terminal.attachCustomKeyEventHandler(() => false);

        // start the terminal
        this.terminal.open(this.root.current);
        this.terminal.focus();

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
            this.terminal.write(`\x1bc${frame.outputAnsi}`);

            // update the font size
            this.terminal.setOption('fontSize', this.props.fontSize);

            // perform the highlighting
            if (this.props.searchQuery) {
                // save the current cursor position
                let highlightings = '\x1b[s';

                // build a regexp to highlight the search results
                const regexp = new RegExp(this.props.searchQuery, `g${this.props.caseSensitivity ? '' : 'i'}`);
                for (const match of frame.outputText.matchAll(regexp)) {
                    // extract match coordinates
                    const row = Math.floor(match.index / frame.columns) + 1;
                    const column = match.index % frame.columns + 1;
                    const string = match[0];

                    // replace the original text with the highlighting
                    const move = `\x1b[${row};${column}H`;
                    const highlight = `\x1b[0m\x1b[48;2;255;96;0m\x1b[38;2;0;0;0m${match}\x1b[0m`; // XXX black on accent color
                    highlightings += `${move}${highlight}`;
                }

                // restore the cursor position and write the highlightings
                highlightings += '\x1b[u';
                this.terminal.write(highlightings);
            }
        }
    }
}
