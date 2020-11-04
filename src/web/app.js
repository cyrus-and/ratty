import Loader from './loader';
import Player from './player';
import React from 'react';
import Shortcuts from './shortcuts';

import './app.scss';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            session: null
        };
    }

    componentDidMount() {
        // register the global shortcuts handler
        window.shortcuts = new Shortcuts();
        window.shortcuts.register();
    }

    componentWillUnmount() {
        // deregister the global shortcuts handler and cleanup
        window.shortcuts.deregister();
        delete window.shortcuts;
    }

    render() {
        // show the loader and the player as soos as there is a session to play
        if (this.state.session) {
            return <Player session={this.state.session} />;
        } else {
            return <Loader onSessionLoaded={this._handleSessionLoaded} />;
        }
    }

    _handleSessionLoaded = (session) => {
        this.setState({session});
    }
}
