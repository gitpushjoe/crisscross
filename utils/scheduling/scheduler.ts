class Scheduler {
    private _agenda: NodeJS.Timeout[];
    constructor(
        private _cycle: number = 0, // an interal state value to determine which tasks are too "old" to be visited
        private _threads: Map<string, Scheduler> = new Map(), // a map of Scheduler instances, each with their own cycle
        private _lockRevisitDelay: number = 200, // the delay after which a task will be revisited if the schedule is locked
        private _locked: boolean = false,
    ) {
        this._agenda = [];
    }

    private _schedule(callback: (...args: any) => void, delayMs: number, ...args: any[]) {
        this._agenda.push(setTimeout(callback, delayMs, ...args)); // add setTimeout to agenda
        setTimeout((timeout) => { // remove setTimeout from agenda after executed
            this._agenda = this._agenda.filter((t) => t != timeout);
        }, delayMs + 100, this._agenda.at(-1));
    }

    public push(task: Task, delayMs: number) { // schedule task to be visited after delayMs
        if (task.cycle < 0) 
            task.cycle = this._cycle;
        this._schedule(() => {
            this.visit(task);
        }, delayMs, task);
    }

    public clearAgenda() {
        this._agenda.forEach((t) => clearTimeout(t));
        this._agenda = [];

    }

    private visit(task: Task, revisit = false) { // visit task
        // console.log(this.getAgenda());
        if (this._locked) { // if schedule is locked, reschedule task to be visited after lockRevisitDelay
            this._schedule((t) => {
                this.visit(t);
            }, this._lockRevisitDelay, task);
            return;
        }
        if (!revisit) { 
            if (task.isAnOrder()) { // Orders increment the cycle, invalidating all tasks from the current cycle (including other Orders)
                this._cycle++;
                task.cycle = this._cycle;
            }
            if (task.lock && task.lockBeforeDelay) { 
                this._locked = true;
            }
            if (task.delayMs > 0) {
                this._schedule((t) => {
                    this.visit(t, true);
                }, task.delayMs, task);
                return;
            }
        }
        if (task.lock && !task.lockBeforeDelay) {
            this._locked = true;
        }
        if (this._cycle != task.cycle) {
            return;
        }
        // if task returns another task, visit it (chain of tasks)
        // Note that if another Task is returned, and not an Order, the Task will receive the same cycle as the previous Task
        // and could be subject to an invalidation by an Order, even if the Task was returned from an Order.
        // In short, if the current cycle is 3, an infinite Task chain will all have cycle 3, and will come to a stop if an Order pushes the cycle to 4.
        task.execute().then((nextTask) => { 
            this._locked = false;
            if (!nextTask) return;
            this.visit(nextTask);
        });
    }

    public makeThread(name: string): Boolean {
        if (this._threads.has(name)) return false;
        this._threads.set(name, new Scheduler(this._cycle, new Map() as Map<string, Scheduler>, this._lockRevisitDelay, false));
        return true;
    }

    public destroyThread(name: string): Boolean {
        if (!this._threads.has(name)) return false;
        this._threads.get(name)?.clearAgenda();
        this._threads.delete(name);
        return true;
    }
}

class Task {
    private _isAnOrder: boolean;
    constructor(
        public callback: (...args: any) => void,
        public args: any[] = [],
        public cycle = -1, // if -1, the task will be updated with the current cycle before delayMs
        public delayMs = 0, // if > 0, the task will be delayed by delayMs before being executed
        public lock = false, // if true, the schedule will be locked while the task is being completed
        public lockBeforeDelay = false, // if true, the schedule will be locked before the delayMs
    ) {
        this._isAnOrder = false;
    }

    protected makeOrder() {
        this._isAnOrder = true;
    }

    public isAnOrder() {
        return this._isAnOrder;
    }

    public execute(): Promise<Task|null> {
        return new Promise((resolve, reject) => {
            const result: any = this.callback(...this.args);
            if (result instanceof Task) {
                resolve(result);
            }
            resolve(null);
        });
    }
}

class Order extends Task {
    constructor(
        public callback: (...args: any) => void,
        public args: any[] = [],
        public cycle = -1,
        public delayMs = 0,
        public lock = false,
        public lockBeforeDelay = false,
    ) {
        super(callback, args, cycle, delayMs, lock, lockBeforeDelay);
        this.makeOrder();
    }
}

export { Scheduler, Task, Order };