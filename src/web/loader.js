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
            drag: false,
            error: null
        };
        this.fileInput = React.createRef();
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
                    <div className={`trigger ${this.state.hover || this.state.drag ? 'active' : ''}`}>
                        <Button
                            icon="fa-folder-open"
                            onClick={this._handleClick}
                            autoFocus={true} />
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
        this.setState({
            drag: true,
            error: null
        });
    }

    _handleDragLeave = () => {
        // skip if dragging over the button
        if (event.relatedTarget === null) {
            this.setState({drag: false});
        }
    }

    _handleDrop = (event) => {
        event.preventDefault();
        const sessionFile = event.dataTransfer.files[0];
        this._loadSessionAndNotify(sessionFile);
    }

    _handleChange = () => {
        const sessionFile = this.fileInput.current.files[0];
        this._loadSessionAndNotify(sessionFile);
    }

    _handleClick = () => {
        this.setState({error: null});
        this.fileInput.current.click();
    }

    async _loadSessionAndNotify(file) {
        if (!file) {
            return;
        }

        // common error handling
        const handleError = (error) => {
            console.error(error);
            this.setState({
                error,
                drag: false
            });

            // allow to select the same file again on error
            this.fileInput.current.value = '';
        };

        try {
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
}
