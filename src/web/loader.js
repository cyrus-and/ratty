import Button from './button';
import Info from './info';
import React from 'react';
import Session from './session';
import packageJson from '../../package.json';
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
                            <i className="fa fa-exclamation-triangle"></i>Invalid session file
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

    _handleDragOver = (event) => {
        event.preventDefault();
    }

    _handleDragEnter = () => {
        // ignore drag and drop if the file dialog is open
        if (!this.state.enabled) {
            return;
        }

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
        this._loadSessionAndNotify(sessionFile);
    }

    _handleChange = () => {
        // re enable the dragging
        this.setState({enabled: true});

        // try to load the chosen file
        const sessionFile = this.fileInput.current.files[0];
        this._loadSessionAndNotify(sessionFile);
    }

    _handleClick = () => {
        // show the file open dialog, resetting errors and disabling drag and drop
        this.setState({
            error: null,
            enabled: false
        });
        this.fileInput.current.click();
    }

    async _loadSessionAndNotify(file) {
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
            // show the activity
            this.setState({
                processing: true
            });

            // read the file and start loading the session
            const data = await this._readFile(file);
            const name = file.name.replace(/\.[^.]+$/, '');
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
        return new Promise((fulfill, reject) => {
            const reader = new FileReader();

            reader.addEventListener('load', () => {
                try {
                    // apparently a buffer is needed despite the doc says otherwise...
                    const buffer = Buffer.from(reader.result);

                    // attempt to decompress the file
                    fulfill(gunzipSync(buffer).toString());
                } catch (error) {
                    reject(error);
                }
            });

            reader.addEventListener('error', () => {
                reject(reader.error);
            });

            reader.readAsArrayBuffer(file);
        });
    }

    _enableLoader = () => {
        this.setState({enabled: true});
    }
}
