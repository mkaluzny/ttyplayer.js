import Timer from './timer'
import Terminal from '../libs/xterm.js'
import {assign} from './utils'

const EventEmitter = Terminal.EventEmitter

export default class TTYCorePlayer extends EventEmitter {
    constructor(options) {
        super()

        const term = new Terminal(options)
        term.open()

        this.term = term
    }

    atEnd() {
        return this.step === this.frames.length
    }

    preparePlayer(frames) {
        if (frames) {
            this.frames = frames
        }
        this.term.reset()
        this.step = 0
        this.writeFrame(0)
    }

    play(frames) {
        if (frames) {
            this.frames = frames
        }
        this.term.reset()
        if (!this.step || this.step >= this.frames.length) {
            this.step = 0
        }
        // this.renderFrame()
        this.jumpTo(this.step)
        this.resume()
    }

    jumpTo(nextStep) {
        if (this._nextTimer) {
            this._nextTimer.pause()
        }
        this.term.write('\x1bc')
        if (nextStep > 1) {
            for (let i = 0; i < nextStep; i++) {
                this.writeFrame(i);
            }
        }
        let currentStep = this.step
        this.step = nextStep

        if (nextStep < currentStep) {
            currentStep = 0
        }
        this._nextTimer = new Timer(
            _ => this.renderFrame(),
            1,
            this.speed
        )
        this._nextTimer.pause()
    }

    pause() {
        this._nextTimer.pause()
        this.emit('pause')
    }

    resume() {
        this._nextTimer.resume()
        this.emit('play')
    }

    renderFrame() {
        const step = this.step
        const frames = this.frames
        if (!frames) {
            this.next(null, null)
            return;
        }
        try {
            this.writeFrame(step)

            this.step = step + 1
        } catch (e) {
            console.log("Error while rendering frame", e);
        }
        this.emit('renderFrame')
        this.next(frames[step], frames[step + 1])
    }

    writeFrame(step) {
        const frames = this.frames
        const currentFrame = frames[step]
        const nextFrame = frames[step + 1]

        const str = currentFrame.content
        var metadata = /^.*\x1b\[8;([0-9]+);([0-9]+)t$/.exec(str);
        if (metadata) {
            // utf8 = metadata[1] === "G";
            let dimensions = {
                rows: +metadata[1],
                cols: +metadata[2]
            };
            this.term.resize(dimensions.cols, dimensions.rows);
        }
        // It seems to be unnecessary and may cause an unexpected behavior.
        // So I ignore it.
        else if (str !== '\u001b[?1h\u001b=') {
            this.term.write(str)
        }
    }

    next(currentFrame, nextFrame) {
        if (nextFrame) {
            this._nextTimer = new Timer(
                _ => this.renderFrame(),
                (nextFrame.time - currentFrame.time),
                this.speed
            )
        } else if (this.repeat) {
            this._nextTimer = new Timer(
                _ => this.play(),
                this.interval,
                this.speed
            )
        } else {
            this.emit('end')
        }
    }

    destroy() {
        this.term.destroy()
        this.removeAllListeners()
        this._nextTimer && this._nextTimer.clear()
    }
}

assign(TTYCorePlayer.prototype, {
    speed: 1,
    repeat: true,
    interval: 3000,
})

TTYCorePlayer.Terminal = Terminal
