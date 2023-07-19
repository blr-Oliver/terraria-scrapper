export type WaitingCall<In, Out> = {
  readonly args: In;
  resolve: (result: Out | PromiseLike<Out>) => void;
  reject: (error: any) => void;
}

export class FloodGate<H extends (...args: any[]) => Promise<any>> {
  #limit = 0;
  #delay = 0;
  #processing = 0;
  #nextCall = -8640000000000000;
  #isNextScheduled = false;
  #paused = false;

  public readonly queue: WaitingCall<Parameters<H>, Awaited<ReturnType<H>>>[] = [];

  constructor(public readonly handler: H,
              limit: number = 1,
              delay: number = 0) {
    this.limit = limit;
    this.delay = delay;
  }

  get limit() {
    return this.#limit;
  }

  set limit(limit: number) {
    if (limit <= 0) throw new Error('limit must be > 0');
    this.#limit = limit;
  }

  get delay() {
    return this.#delay;
  }

  set delay(delay: number) {
    if (delay < 0) throw new Error('delay must be >= 0');
    this.#delay = delay;
  }

  get processing() {
    return this.#processing;
  }

  get paused() {
    return this.#paused;
  }

  set paused(paused: boolean) {
    if (!!paused !== this.#paused) {
      if (!(this.#paused = !!paused))
        this.#proceed();
    }
  }

  offer(...args: Parameters<H>): Promise<Awaited<ReturnType<H>>> {
    type T = Awaited<ReturnType<H>>;
    let
        res: (result: T | PromiseLike<T>) => void,
        rej: (error: any) => void;
    let promise = new Promise<T>((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    this.queue.push({
      args,
      resolve: res!,
      reject: rej!
    });
    this.#proceed();
    return promise;
  }

  dropWaiting(): void {
    let paused = this.#paused;
    this.#paused = true;
    while (this.queue.length) {
      const task = this.queue.shift()!;
      task.reject('dropped');
    }
    this.paused = paused;
  }

  #proceed() {
    // console.debug(`FloodGate.proceed(): checking limits [paused: ${this.#paused}; processing: ${this.#processing}/${this.#limit}; queued = ${this.queue.length}]`);
    if (!this.#paused && (this.#processing < this.#limit) && this.queue.length > 0) {
      // console.debug(`FloodGate.proceed(): limits ok`);
      const now = Date.now();
      // console.debug(`FloodGate.proceed(): checking time`);
      if (this.#nextCall <= now) {
        // console.debug(`FloodGate.proceed(): time ok`);
        const task = this.queue.shift()!;
        let promise;
        try {
          ++this.#processing;
          this.#nextCall = now + this.#delay;
          // console.debug(`FloodGate.proceed(): making a call`);
          promise = this.handler(...task.args);
        } catch (error) {
          --this.#processing;
          task.reject(error);
        }
        if (promise) {
          promise.finally(() => {
            --this.#processing;
            queueMicrotask(() => this.#proceed());
          });
          promise.then(result => task.resolve(result), error => task.reject(error));
        }
        queueMicrotask(() => this.#proceed());
      } else {
        // console.debug(`FloodGate.proceed(): too early`);
        if (!this.#isNextScheduled) {
          this.#isNextScheduled = true;
          const delay = Math.max(0, this.#nextCall - now);
          // console.debug(`FloodGate.proceed(): scheduling in ${delay} ms`);
          setTimeout(() => {
            this.#isNextScheduled = false;
            this.#proceed();
          }, delay);
        } else {
          // console.debug(`FloodGate.proceed(): already scheduled`);
        }
      }
    } else {
      // console.debug(`FloodGate.proceed(): ${(this.queue.length > 0 ? 'too flooded' : 'no tasks')}`);
    }
  }
}

export function parallelLimit<A extends (...args: any[]) => Promise<any>>(action: A, limit: number, delay: number): (...args: Parameters<A>) => Promise<Awaited<ReturnType<A>>> {
  const gate = new FloodGate<A>(action, limit, delay);
  return (...args: Parameters<A>) => gate.offer(...args);
}
