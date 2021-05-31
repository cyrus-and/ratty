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
        super(props);
        this.state = {
            progress: 0,
            // initial number of loaded frames
            totalFrames: this.props.session.getFrames().length
        };
    }

    componentDidMount() {
        // keep track of loaded frames
        this.props.session.on('frame', (_, index) => {
            this.setState({
                totalFrames: index + 1
            });
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
                    shortcut={{
                        trigger: ' ',
                        description: 'Play/pause the animation'
                    }}
                    icon={playingStatusIcon}
                    onClick={player._changePlayingStatus} />
                <Cycle
                    shortcut={{
                        trigger: 't',
                        description: 'Cycle max frame duration'
                    }}
                    choices={[
                        {label: 'REAL', value: Infinity},
                        {label: 'SLOW', value: 1000},
                        {label: 'FAIR', value: 500},
                        {label: 'FAST', value: 100}
                    ]}
                    onChange={player._setMaxDelay} />
                <Button
                    shortcut={{
                        trigger: 'g',
                        description: 'Jump to the first frame'
                    }}
                    icon="fa-fast-backward"
                    onClick={player._seekToBegin} />
                <Button
                    shortcut={{
                        trigger: ',',
                        description: 'Step one frame backward'
                    }}
                    icon="fa-step-backward"
                    onClick={player._stepBackward} />
                <Button
                    shortcut={{
                        trigger: '.',
                        description: 'Step one frame forward'
                    }}
                    icon="fa-step-forward"
                    onClick={player._stepForward} />
                <Button
                    shortcut={{
                        trigger: 'G',
                        description: 'Jump to the last frame'
                    }}
                    icon="fa-fast-forward"
                    onClick={player._seekToEnd} />
                <Timestamp
                    frame={session.getFrames()[cursor]}
                    maximum={session.getFrames()[totalFrames - 1].cumulativeDelay} />
                <Seek
                    cursor={cursor}
                    totalFrames={totalFrames}
                    onSeek={player._seek} />
                <Timestamp frame={session.getFrames()[totalFrames - 1]} />
                <Search
                    player={player}
                    cursor={cursor}
                    matches={matches} />
                <Cycle
                    shortcut={{
                        trigger: 'i',
                        description: 'Toggle case sensitivity'
                    }}
                    choices={[
                        {label: 'aa', value: false},
                        {label: 'Aa', value: true}
                    ]}
                    onChange={player._setCaseSensitivity} />
                <Button
                    shortcut={{
                        trigger: '-',
                        description: 'Decrease font size'
                    }}
                    icon="fa-search-minus"
                    onClick={player._decreaseFontSize} />
                <Button
                    shortcut={{
                        trigger: '+',
                        description: 'Increase font size'
                    }}
                    icon="fa-search-plus"
                    onClick={player._increaseFontSize} />
                <Button
                    shortcut={{
                        trigger: 'Escape',
                        description: 'Toggle this help screen'
                    }}
                    icon="fa-question-circle"
                    onClick={player._toggleHelp} />
                <Button
                    shortcut={{
                        trigger: 'q',
                        description: 'Close the player'
                    }}
                    icon="fa-times-circle"
                    onClick={player._close} />
            </div>
        );
    }
}
