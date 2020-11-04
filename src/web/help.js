import Info from './info';
import React from 'react';

import './help.scss';

export default class Help extends React.Component {
    render() {
        return (
            <div className="help">
                <div>
                    <Info />
                    <table>
                        <tbody>
                            {this._buildShortcutsTable()}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    _buildShortcutsTable() {
        // build a table from the shortcut mapping
        return window.shortcuts.getMapping().map(([key, description]) => {
            return (
                <tr key={key}>
                    <td>{this._normalizeKeyName(key)}</td>
                    <td>{description}</td>
                </tr>
            );
        });
    }

    _normalizeKeyName(key) {
        // make event keys human readable
        switch (key) {
            case ' ': return 'Space';
            default: return key;
        }
    }
}
