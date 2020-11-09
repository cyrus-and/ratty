import Button from './button';
import Cycle from './cycle';
import Progress from './progress';
import Search from './search';
import React from 'react';
import Seek from './seek';
import Timestamp from './timestamp';

import './controls.scss';

export default class Controls extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            progress: 0,
            // initial number of loaded frames
            totalFrames: this.props.session.getFrames().length
        };
    }

    componentDidMount() {
        // keep track of loaded frames
        this.props.session.on('frame', (_, totalFrames) => {
            this.setState({totalFrames});
        });

        // keep track of the overall progress
        this.props.session.on('progress', (progress) => {
            this.setState({progress});
        });
    }

    render() {
        const {cursor, player, matches, session} = this.props;
        const {totalFrames, progress} = this.state;

        // decide the playing icon
        const playingStatusIcon = totalFrames > 1 && cursor === totalFrames - 1
            ? 'fa-repeat'
            : (this.props.playing ? 'fa-pause' : 'fa-play');

        return (
            <div className="controls">
                <Progress ratio={progress} />
                <Button
                    icon={playingStatusIcon}
                    onClick={player._changePlayingStatus} />
                <Button
                    icon="fa-fast-backward"
                    onClick={player._seekToBegin} />
                <Button
                    icon="fa-step-backward"
                    onClick={player._stepBackward} />
                <Button
                    icon="fa-step-forward"
                    onClick={player._stepForward} />
                <Button
                    icon="fa-fast-forward"
                    onClick={player._seekToEnd} />
                <Timestamp frame={session.getFrames()[cursor]} />
                <Seek
                    cursor={cursor}
                    totalFrames={totalFrames}
                    onSeek={player._seek} />
                <Timestamp frame={session.getFrames()[totalFrames - 1]} />
                <Cycle
                    onChange={player._setMaxDelay} />
                <Search
                    player={player}
                    cursor={cursor}
                    matches={matches} />
                <Button
                    icon="fa-search-minus"
                    onClick={player._decreaseFontSize} />
                <Button
                    icon="fa-search-plus"
                    onClick={player._increaseFontSize} />
                <Button
                    icon="fa-question-circle"
                    onClick={player._toggleHelp} />
            </div>
        );
    }
}
