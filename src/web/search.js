import Button from './button';
import React from 'react';

import './search.scss';

export default class Search extends React.Component {
    render() {
        const {cursor, matches} = this.props;
        const index = matches.indexOf(cursor);

        const navigation = (
            <div>
                <Button
                    icon="fa-caret-left"
                    onClick={this._findPrevious} />
                <span>{index === -1 ? '?' : index + 1}/{matches.length}</span>
                <Button
                    icon="fa-caret-right"
                    onClick={this._findNext} />
            </div>
        );

        return (
            <div className="search">
                <input
                    id="searchBox"
                    placeholder="Search..."
                    onChange={this._handleChange}
                    onKeyDown={this._handleKeyDown} />
                {matches.length > 0 && navigation}
            </div>
        );
    }

    _handleChange = (event) => {
        const searchQuery = event.target.value;
        this.props.player._doSearch(searchQuery);
    }

    _handleKeyDown = (event) => {
        switch (event.key) {
            case 'Enter':
                if (event.getModifierState("Shift")) {
                    this._findPrevious();
                } else {
                    this._findNext();
                }
                break;

            case 'Escape':
                event.target.blur();
                break;
        }
    }

    _findPrevious = () => {
        this.props.player._findPrevious();
    }

    _findNext = () => {
        this.props.player._findNext();
    }
}
