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
        super(props);
        this.state = {
            fontSize: BASE_FONT_SIZE,
            cursor: 0,
            searchQuery: '', // XXX other search attributes are set by Cycle components
            matches: undefined,
            playing: false,
            showHelp: false
        };
        this._searchWorker = null;
        this._frameHandler = null;
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this._handleNavigationConfirmation);
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this._handleNavigationConfirmation);
    }

    render() {
        return (
            <div className="player">
                {this.state.showHelp && <Help />}
                <Controls
                    session={this.props.session}
                    cursor={this.state.cursor}
                    matches={this.state.matches}
                    playing={this.state.playing}
                    player={this} />
                <Viewport
                    session={this.props.session}
                    fontSize={this.state.fontSize}
                    searchQuery={this.state.searchQuery}
                    caseSensitivity={this.state.caseSensitivity}
                    cursor={this.state.cursor} />
            </div>
        );
    }

    _seekCursor({to, delta, noStop}) {
        // stop playing then jump
        if (!noStop) {
            this._stop();
        }
        this.setState((state) => {
            const maxCursor = this.props.session.getFrames().length - 1;
            const newCursor = (typeof to === 'undefined' ? state.cursor : to) + (delta || 0);
            return {
                cursor: Math.min(Math.max(newCursor, 0), maxCursor)
            };
        });
    }

    _adjustFontSize(delta) {
        this.setState((state) => {
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

    _doSearch() {
        const {searchQuery, caseSensitivity} = this.state;

        // kill any currently running search workers
        if (this._searchWorker) {
            this._searchWorker.terminate();
        }

        // deregister any previous frame handler
        if (this._frameHandler) {
            this.props.session.off('frame', this._frameHandler);
        }

        // clean the previous matches
        this.setState({matches: undefined});

        // an empty search query means no search query
        if (!this.state.searchQuery) {
            return;
        }

        // create a separate worker to do the search job
        this._searchWorker = new Worker('./searchWorker.js');

        // submit the processed frames so far
        this._searchWorker.postMessage({
            searchQuery,
            caseSensitivity,
            baseIndex: 0,
            frames: this.props.session.getFrames()
        });

        // submit new frames as soon as they are processed (saving the frame handler)
        this.props.session.on('frame', this._frameHandler = (frame, index) => {
            this._searchWorker.postMessage({
                searchQuery,
                caseSensitivity,
                baseIndex: index,
                frames: [frame]
            });
        });

        // append the index of the next matching frame
        this._searchWorker.addEventListener('message', (event) => {
            const index = event.data;
            this.setState((state) => {
                return {
                    // append the new index
                    matches: [...(state.matches || []), index]
                };
            });
        });
    }

    _jumpToMatch(forward) {
        const {cursor, matches} = this.state;

        // find the previous or the next matching frame
        let i;
        if (forward) {
            for (i = 0; i < matches.length && matches[i] <= cursor; i++);
        } else {
            for (i = matches.length - 1; i >= 0 && matches[i] >= cursor; i--);
        }

        // if no (more) matches
        if (i === -1 || i === matches.length) {
            return;
        }

        // stop then jump to match
        this._stop();
        this.setState({cursor: matches[i]});
    }

    _handleNavigationConfirmation(event) {
        // setting this propery to whatever value forces the browser to show a
        // confirmation dialog when the user navigates away from or reload the
        // page
        if (typeof __webpackDevServer === 'undefined') { // XXX this is defined in the command line
            event.returnValue = true;
        }
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

    _setSearchQuery = (searchQuery) => {
        this.setState({searchQuery}, () => this._doSearch());
    }

    _setCaseSensitivity = (caseSensitivity) => {
        this.setState({caseSensitivity}, () => this._doSearch());
    }

    _findPrevious = () => {
        this._jumpToMatch(false);
    }

    _findNext = () => {
        this._jumpToMatch(true);
    }

    _close = () => {
        // go back to the loader dropping the session file in the hash
        const {protocol, host} = window.location;
        window.location.href = `${protocol}//${host}`;
    }
}
