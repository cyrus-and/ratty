import Button from './button';
import React from 'react';

import './search.scss';

export default class Search extends React.Component {
    constructor(props) {
        super(props)
        this.searchBox = React.createRef();
    }

    componentDidMount() {
        // register the shortcut
        window.shortcuts.bind({
            '/': ['Focus the search box', () => {
                searchBox.focus();
                searchBox.select();
            }]
        });
    }

    componentWillUnmount() {
        // deregister the shortcut
        window.shortcuts.unbind('/');
    }

    render() {
        const {cursor, matches} = this.props;
        const index = matches.indexOf(cursor);

        return (
            <div className="search">
                <input
                    id="searchBox"
                    placeholder="Search..."
                    onChange={this._handleChange}
                    onKeyDown={this._handleKeyDown} />
                <div style={{display: matches.length > 0 ? 'initial' : 'none'}}>
                    <Button
                        shortcut={{
                            trigger: 'N',
                            description: 'Jump to the previous matching frame'
                        }}
                        icon="fa-caret-left"
                        onClick={this._findPrevious} />
                    <span>{index === -1 ? '?' : index + 1}/{matches.length}</span>
                    <Button
                        shortcut={{
                            trigger: 'n',
                            description: 'Jump to the next matching frame'
                        }}
                        icon="fa-caret-right"
                        onClick={this._findNext} />
                </div>
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
