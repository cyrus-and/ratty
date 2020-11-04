import Button from './button';
import Cycle from './cycle';
import Progress from './progress';
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
        const {player} = this.props;

        // decide the playing icon
        const playingStatusIcon = this.props.cursor === this.state.totalFrames - 1
            ? 'fa-repeat'
            : (this.props.playing ? 'fa-pause' : 'fa-play');

        return (
            <div className="controls">
                <Progress ratio={this.state.progress} />
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
                <Timestamp frame={this.props.session.getFrames()[this.props.cursor]} />
                <Seek
                    cursor={this.props.cursor}
                    totalFrames={this.state.totalFrames}
                    onSeek={player._seek} />
                <Timestamp frame={this.props.session.getFrames()[this.state.totalFrames - 1]} />
                <Cycle
                    onChange={player._setMaxDelay} />
                <Button
                    icon="fa-minus"
                    onClick={player._decreaseFontSize} />
                <Button
                    icon="fa-plus"
                    onClick={player._increaseFontSize} />
                <Button
                    icon="fa-question"
                    onClick={player._toggleHelp} />
            </div>
        );
    }
}
