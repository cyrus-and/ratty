import Button from './button';
import Info from './info';
import React from 'react';
import Session from './session';
import packageJson from '../../package.json';
import path from 'path';
import {Buffer} from 'buffer';
import {gunzipSync} from 'zlib';

import './loader.scss';

export default class Loader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dragging: false,
            processing: false,
            error: null,
            enabled: true
        };
        this.fileInput = React.createRef();
    }

    componentDidMount() {
        window.addEventListener('focus', this._enableLoader);

        // try to load the session from the server otherwise show the usual loader
        this._loadSessionFromServerAndNotify();
    }

    componentWillUnmount() {
        window.removeEventListener('focus', this._enableLoader);
    }

    render() {
        return (
            <div
                className="loader"
                onDragOver={this._handleDragOver}
                onDragEnter={this._handleDragEnter}
                onDragLeave={this._handleDragLeave}
                onDrop={this._handleDrop}>
                <div>
                    <Info />
                    <div className="hero">
                        {
                            this.state.processing
                            &&
                            <div className="spinner">
                                <i className="fa fa-cog" />
                            </div>
                            ||
                            <div className={`trigger ${this.state.dragging ? 'active' : ''}`}>
                                <Button
                                    icon="fa-folder-open"
                                    onClick={this._handleClick} />
                            </div>
                        }
                    </div>
                    {
                        this.state.error &&
                        <div className="error">
                            <i className="fa fa-exclamation-triangle"></i>Cannot load session file
                        </div>
                    }
                </div>
                <input
                    ref={this.fileInput}
                    type="file"
                    accept={`.${packageJson.name}`}
                    onChange={this._handleChange} />
            </div>
        );
    }

    async _loadSessionFromServerAndNotify() {
        // fetch the session path from the hash
        const sessionURL = window.location.hash.slice(1);
        if (sessionURL.length === 0) {
            return;
        }

        try {
            // try fetch the session data from the server
            const url = /^https?:/.test(sessionURL) ? sessionURL : path.join('/session', sessionURL);
            const response = await fetch(url);
            if (response.ok) {
                // immediately show the spinner if there is a response from the server
                this.setState({processing: true});

                // fetch the name from the path and the content from the server
                const name = path.basename(sessionURL).replace(/\.[^.]+$/, '');
                const buffer = await response.arrayBuffer();
                this._loadSessionAndNotify(name, buffer);
            } else {
                this.setState({error: response.status});
            }
        } catch (err) {
            this.setState({error: err});
        }
    }

    async _loadSessionFromClientAndNotify(file) {
        // show the spinner
        this.setState({processing: true});

        // read the file name and content from the HTML file input field
        const name = file.name.replace(/\.[^.]+$/, '');
        const buffer = await this._readFile(file);
        this._loadSessionAndNotify(name, buffer);
    }

    _loadSessionAndNotify(name, buffer) {
        // common error handling
        const handleError = (error) => {
            console.error(error);
            this.setState({
                processing: false,
                error,
                dragging: false
            });

            // allow to select the same file again on error
            this.fileInput.current.value = '';
        };

        try {
            // parse and decompress the array buffer
            // XXX apparently a buffer is needed despite the doc says otherwise
            const data = gunzipSync(Buffer.from(buffer)).toString();

            // start loading the session
            const session = new Session(name, data);

            // pass the session upward as soon as at least one frame is loaded
            session.once('frame', () => {
                this.props.onSessionLoaded(session);
            });

            // handle session parsing errors
            session.once('error', handleError);
        } catch (error) {
            handleError(error);
        }
    }

    _readFile(file) {
        // fetch the content of a file from a input field
        return new Promise((fulfill, reject) => {
            const reader = new FileReader();

            reader.addEventListener('load', () => {
                fulfill(reader.result);
            });

            reader.addEventListener('error', () => {
                reject(reader.error);
            });

            reader.readAsArrayBuffer(file);
        });
    }

    _resetHash() {
        // drop the session path in the hash
        window.location.hash = '';
    }

    _handleDragOver = (event) => {
        event.preventDefault();
    }

    _handleDragEnter = () => {
        // ignore drag and drop if the file dialog is open
        if (!this.state.enabled) {
            return;
        }

        // reset hash and errors
        this._resetHash();
        this.setState({
            dragging: true,
            error: null
        });
    }

    _handleDragLeave = () => {
        // ignore drag and drop if the file dialog is open
        if (!this.state.enabled) {
            return;
        }

        // skip if dragging over the button
        if (event.relatedTarget === null) {
            this.setState({dragging: false});
        }
    }

    _handleDrop = (event) => {
        event.preventDefault();

        // ignore drag and drop if the file dialog is open
        if (!this.state.enabled) {
            return;
        }

        // ignore non-file objects dropped
        const sessionFile = event.dataTransfer.files[0];
        if (!sessionFile) {
            this.setState({dragging: false});
            return;
        }

        // try to load the dropped file
        this._loadSessionFromClientAndNotify(sessionFile);
    }

    _handleChange = () => {
        // re enable the dragging
        this.setState({enabled: true});

        // try to load the chosen file
        const sessionFile = this.fileInput.current.files[0];
        this._loadSessionFromClientAndNotify(sessionFile);
    }

    _handleClick = () => {
        // show the file open dialog, resetting errors and hash, and disabling drag and drop
        this.setState({
            error: null,
            enabled: false
        });
        this._resetHash();
        this.fileInput.current.click();
    }

    _enableLoader = () => {
        this.setState({enabled: true});
    }
}
