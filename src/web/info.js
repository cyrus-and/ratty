import React from 'react';
import packageJson from '../../package.json';

import './info.scss';

export default class Info extends React.Component {
    render() {
        return (
            <div className="info">
                <div>
                    <span className="name">{packageJson.name}</span>
                    <span className="version">v{packageJson.version}</span>
                </div>
                <a className="home" href={packageJson.repository} target="_blank" rel="noreferrer">
                    <i className="fa fa-fw fa-github" />
                </a>
            </div>
        );
    }
}
