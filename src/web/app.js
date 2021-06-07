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
        // show the loader or the player (as soon as there is a session to play)
        if (this.state.session) {
            return <Player session={this.state.session} />;
        } else {
            return <Loader onSessionLoaded={this._handleSessionLoaded} />;
        }
    }

    _handleSessionLoaded = (session) => {
        this.setState({session});

        // set the window title
        const {name} = this.state.session.getMeta();
        window.document.title = `${name} - ${window.document.title}`;
    }
}
