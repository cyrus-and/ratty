import Controls from './controls';
import Help from './help';
import React from 'react';
import Viewport from './viewport';

import './player.scss';

const BASE_FONT_SIZE = 14;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 20;

export default class Player extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            fontSize: BASE_FONT_SIZE,
            cursor: 0,
            playing: false,
            showHelp: false
        };
        this.maxDelay = Infinity;
        window.shortcuts.bind({
            // order apparently matters for key strings so keep this entry first
            'Escape': ['Toggle this help screen', this._toggleHelp],
            ',': ['Step backward', this._stepBackward],
            '.': ['Step forward', this._stepForward],
            'g': ['Jump to the first frame', this._seekToBegin],
            'G': ['Jump to the last frame', this._seekToEnd],
            '-': ['Decrease font size', this._decreaseFontSize],
            '+': ['Increase font size', this._increaseFontSize],
            ' ': ['Play/pause', this._changePlayingStatus]
        });
    }

    render() {
        return (
            <div className="player">
                {this.state.showHelp && <Help />}
                <Controls
                    session={this.props.session}
                    cursor={this.state.cursor}
                    playing={this.state.playing}
                    player={this} />
                <Viewport
                    session={this.props.session}
                    fontSize={this.state.fontSize}
                    cursor={this.state.cursor} />
            </div>
        );
    }

    _seekCursor({to, delta, noStop}) {
        // stop playing then jump
        if (!noStop) {
            this._stop();
        }
        this.setState((state, props) => {
            const maxCursor = this.props.session.getFrames().length - 1;
            const newCursor = (typeof to === 'undefined' ? state.cursor : to) + (delta || 0);
            return {
                cursor: Math.min(Math.max(newCursor, 0), maxCursor)
            };
        });
    }

    _adjustFontSize(delta) {
        this.setState((state, props) => {
            return {
                fontSize: Math.min(Math.max(state.fontSize + delta, MIN_FONT_SIZE), MAX_FONT_SIZE)
            };
        });
    }

    _play() {
        // rewind if at end
        if (this.state.cursor === this.props.session.getFrames().length - 1) {
            this._seekCursor({to: 0});
            return;
        }

        // frame loop function
        this._playLoop();
    }

    _playLoop() {
        const nextFrame = this.props.session.getFrames()[this.state.cursor + 1];
        if (nextFrame) {
            // wait the frame delay
            this.timeout = window.setTimeout(() => {
                // display the next frame then start over if still playing
                this._seekCursor({delta: +1, noStop: true});
                if (this.state.playing) {
                    this._playLoop();
                }
            }, Math.min(nextFrame.delay, this.maxDelay));
        } else {
            this._stop();
        }
    }

    _stop() {
        // stop by clearing the current timout if any
        window.clearTimeout(this.timeout);
        this.setState({playing: false});
    }

    _toggleHelp = () => {
        this.setState((state) => {
            return {
                showHelp: !state.showHelp
            };
        });
    }

    _changePlayingStatus = () => {
        // toggle the playing status
        this.setState((state) => {
            return {
                playing: !state.playing
            };
        }, () => {
            if (this.state.playing) {
                this._play();
            } else {
                this._stop();
            }
        });
    }

    _seekToBegin = () => {
        this._seekCursor({delta: -Infinity});
    }

    _stepBackward = () => {
        this._seekCursor({delta: -1});
    }

    _stepForward = () => {
        this._seekCursor({delta: +1});
    }

    _seekToEnd = () => {
        this._seekCursor({delta: +Infinity});
    }

    _seek = (ratio) => {
        const to = Math.round(ratio * (this.props.session.getFrames().length - 1));
        this._seekCursor({to});
    }

    _setMaxDelay = (maxDelay) => {
        this.maxDelay = maxDelay;

        // restart the frame (if playing)
        if (this.state.playing) {
            window.clearTimeout(this.timeout);
            this._playLoop();
        }
    }

    _decreaseFontSize = () => {
        this._adjustFontSize(-1);
    }

    _increaseFontSize = () => {
        this._adjustFontSize(+1);
    }
}
