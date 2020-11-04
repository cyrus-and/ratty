import Button from './button';
import Info from './info';
import React from 'react';
import Session from './session';
import packageJson from '../../package.json';

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
                            onClick={this._handleClick} />
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
                    onChange={this._handleChange} />
            </div>
        );
    }

    _handleDragOver = (event) => {
        event.preventDefault();
    }

    _handleDragEnter = () => {
        this.setState({drag: true});
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
        this.fileInput.current.click();
    }

    async _loadSessionAndNotify(file) {
        if (!file) {
            return;
        }

        // read the file and start loading the session
        const data = await this._readFile(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        const session = new Session(name, data);

        // pass the session upward as soon as at least one frame is loaded
        session.once('frame', () => {
            this.props.onSessionLoaded(session);
        });

        // handle session parsing errors
        session.once('error', (error) => {
            console.error(error);
            this.setState({
                error,
                drag: false
            });
        });
    }

    _readFile(file) {
        return new Promise((fulfill, reject) => {
            const reader = new FileReader();

            reader.addEventListener('load', () => {
                fulfill(reader.result);
            });

            reader.addEventListener('error', (err) => {
                reject(err);
            });

            reader.readAsText(file);
        });
    }
}
