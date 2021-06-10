import * as regexps from './regexps';
import React from 'react';
import {Terminal} from 'xterm';

import './viewport.scss';

export default class Viewport extends React.PureComponent {
    constructor(props) {
        super(props);
        this._root = React.createRef();
    }

    componentDidMount() {
        // create and set up the terminal
        this.terminal = new Terminal({
            fontSize: this.props.fontSize,
            scrollback: 0
        });
        this.terminal.attachCustomKeyEventHandler(() => false);

        // start the terminal
        this.terminal.open(this._root.current);

        // XXX apparently, in xterm.js the cursor appears upon the first focus
        // event, so it is synthetically made visible
        this.terminal._core._showCursor();

        // XXX in xterm.js the unfocused terminals have a hollow block cursor,
        // since the focus has no meanng here, this behavior is patched away
        const cursorRenderLayer = this.terminal._core._renderService._renderer._renderLayers[3];
        cursorRenderLayer._renderBlurCursor = cursorRenderLayer._renderBlockCursor;

        // XXX additionally make the terminal and its text area not focusable by tabbing
        this.terminal.textarea.setAttribute('tabindex', '-1');
        this.terminal.element.setAttribute('tabindex', '-1');

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
                <div ref={this._root} />
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
                // build a regexp to highlight the search results
                const regexp = regexps.build(this.props.searchQuery, this.props.caseSensitivity, true);
                if (regexp === null) {
                    return;
                }

                // save the current cursor position
                let highlightings = '\x1b[s';

                // highlight the search results
                for (const match of frame.outputText.matchAll(regexp)) {
                    // extract match coordinates
                    const row = Math.floor(match.index / frame.columns) + 1;
                    const column = match.index % frame.columns + 1;
                    const text = match[0];

                    // replace the original text with the highlighting
                    const move = `\x1b[${row};${column}H`;
                    const highlight = `\x1b[0m\x1b[48;2;255;96;0m\x1b[38;2;0;0;0m${text}\x1b[0m`; // XXX black on accent color
                    highlightings += `${move}${highlight}`;
                }

                // restore the cursor position and write the highlightings
                highlightings += '\x1b[u';
                this.terminal.write(highlightings);
            }
        }
    }
}
