export default class {
    constructor() {
        this.startTime = 0;
        this.oldTime = 0;
        this.elapsedTime = 0;
        this.elapsedLap = 0;

        this.running = false;

        this.startDate = Date.now();
        this.elapsedDate = new Date(this.startDate);
        this.multiplierValue = 200000;
    }

    start() {
        this.startTime = performance.now();
        this.oldTime = this.startTime;

        this.elapsedLap = 0;

        this.running = true;
    }

    stop() {
        this.tick();
        this.running = false;

        this.startDate = this.elapsedDate.getTime();
    }

    get elapsed() {
        this.tick();
        return this.elapsedTime;
    }

    get date() {
        this.tick();
        return this.elapsedDate;
    }

    get multiplier() {
        return this.multiplierValue;
    }

    set multiplier(value) {
        this.tick();

        this.multiplierValue = value;
        this.elapsedLap = 0;
        this.startDate = this.elapsedDate.getTime();
    }

    tick() {
        var Δt = 0;

        if (this.running) {
            var time = performance.now();

            Δt = (time - this.oldTime) / 1000.0;
            this.elapsedTime += Δt;
            this.elapsedLap += Δt;
            this.oldTime = time;

            this.elapsedDate.setTime(this.startDate + this.elapsedLap * 1000 * this.multiplier);
        }

        return Δt;
    }
}