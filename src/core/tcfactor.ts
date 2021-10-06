/**
 *
 * 前后台封装
 *
 */
import { EventEmitter } from "events";
//const { EventEmitter } = require("events");
// interface Options {
//   /** 应用标记, 防止冲突 */
//   app: string;
//   /** 环境 */
//   env: "cluster" | "electron" | "browser";
//   /** 线程 */
//   thread;
//   /**是否是主线程或主进程 */
//   isMaster: boolean;
//   /** 获取方法创建实体对象 */
//   executor: Function;
// }
function makeSend2WorkerFun(env, event) {
   //let send = this.env == 'electron' ? event.reply : this.env == 'cluster' ? event.send : self.postMessage;
   switch (env) {
      case "electron":
         return function (data, callback?) {
            event.reply("message", data);
         };
      case "egg":
         return function (data, callback?) {
            //process?.send?.apply(process, [data]);
            event.send(data);
         };
      case "browser":
         return function (data, callback?) {
            //send(data);
            global["self"] && global["self"].postMessage(data, "");
         };
      case "cluster":
      default:
         return function (data, callback?) {
            //send(data);
            //process?.send?.apply(process, [data]);
            event.send(data);
         };
   }
}
function makeSend2MainFun(env, thread) {
   //let send = this.env == 'electron' ? this.options.workerThread.send : this.env == 'cluster' ? process.send : self.postMessage;
   switch (env) {
      case "electron":
         return function (data) {
            thread.send("message", data);
         };

      case "egg":
         return function (data) {
            //send(data);
            thread.sendMessage(data);
         };
      case "browser":
         return function (data) {
            //send(data);
            global["self"] && global["self"].postMessage(data, "");
         };
      case "cluster":
      default:
         return function (data) {
            //send(data);
            thread.send && thread.send.apply(thread, [data]);
         };
   }
}
/**
  * 装饰主副线程(进程)通信, 把应用封装进来, 让api使用都感觉不到主副线程的差异,<br/> 可以像正常使用api一样使用(否则就会涉及到主进程有api,子进程没有)
  *
   app: string;
   env: "cluster" | "electron" | "browser" | "egg";
   thread;
   isMaster: boolean;
   executor: Function;
  *
  *
  */
class TCFactor<T> extends EventEmitter {
   isMaster; //: boolean;
   env; //: "cluster" | "electron" | "browser";
   app; //: string;
   thread;
   executor; //: any;
   static ___apps = {};
   taskCallback = {}; //任务回调
   constructor({ thread, isMaster, executor, env, app }: { isMaster: boolean; env: "cluster" | "electron" | "egg" | "browser"; thread: any; app: string; executor: Function }) {
      super();
      this.setMaxListeners(9999);
      this.env = env;
      this.app = app;
      if (TCFactor.___apps[this.app]) throw new Error(`已经存在应用${this.app}`);
      TCFactor.___apps[this.app] = true;
      this.isMaster = isMaster;
      this.executor = executor();

      this.thread = thread;
      this.initEvent(this.thread);
   }
   async initEvent(thread) {
      let _this = this;
      if (!thread) throw new Error("工作线程或进程都不存在");
      if (this.isMaster) {
         let executor = this.executor;
         thread.on("message", async (event, data) => {
            let { app, task, method, args, pid, isCallback } = data || event;
            if (app != this.app) return;
            if (this.env == "egg") {
               event = {
                  send: (datax) => thread.sendTo(pid, "message", datax),
               };
            }
            if (isCallback == true) {
               _this.emit(task);
               return;
            }
            //let send = this.env == 'electron' ? event.reply : this.env == 'cluster' ? event.send : self.postMessage;
            let send = makeSend2WorkerFun(this.env, event);
            let isLastCallback = args[args.length - 1] === "[function]";
            if (isLastCallback) {
               //最后一位是回调函数
               args[args.length - 1] = async (key, value) => {
                  if (key) {
                     return new Promise((resolve) => {
                        send({ app, task: task, code: 2, key, value });
                        _this.once(task, () => resolve(undefined));
                     });
                  } else {
                     send({ app, task: task, code: 1, key: undefined, value: undefined });
                  }
               };
            }
            let target = executor[method];
            let value = undefined;
            if (target instanceof Function) {
               value = await target.apply(executor, args);
            } else {
               value = target;
            }
            if (!isCallback) send ? send({ app, task: task, code: 1, value }) : console.warn(`主线程环境${this.env}不存在发送方法`);
         });
      } else {
         if (this.env == "egg") {
            thread.sendMessage = (data) => {
               data.pid = thread.pid;
               thread.sendToAgent("message", data);
            };
         }
         thread.on("message", async (...args) => {
            //{ task, code, value }
            let data: any = {};
            if (this.env == "electron") {
               data = args[1];
            } else if (this.env == "cluster" || this.env == "egg") {
               data = args[0];
            } else {
               data = args[0] ? args[0].data : {};
            }
            let { app, task, code, value, key } = data;
            this.emit(task, { code, value, key });
         });
         for (let key in this.executor) {
            if (key.startsWith("_")) continue;
            let targetFun = this.executor[key];
            if (targetFun instanceof Function) {
               this.executor[key] = new Proxy(this.executor[key], {
                  apply: function (target, thisArg, args) {
                     targetFun.bind(target)(...args);
                     return _this.execute(key, ...args);
                  },
               });
            }
         }
      }
   }
   execute(method, ...args): Promise<T> {
      if (this.isMaster) {
         return this.executor[method].apply(this.executor, args);
      }
      let send = makeSend2MainFun(this.env, this.thread);
      return new Promise((resolve, reject) => {
         let task = "task-" + Math.floor(Math.random() * 9999999999);
         if (args[args.length - 1] instanceof Function) {
            //最后一个是函数, 约定是回调函数
            this.taskCallback[task] = args[args.length - 1];
            args[args.length - 1] = "[function]"; //标记最后一位是任务回调
         }
         this.on(task, async ({ code, value, key, message }) => {
            if (code == 1) {
               this.removeAllListeners(task);
               resolve(value);
            } else if (code == 2) {
               await this.taskCallback[task](key, value);
               send({ app: this.app, task, isCallback: true });
            } else {
               reject(new Error(message));
            }
         });
         //let send = this.env == 'electron' ? this.options.workerThread.send : this.env == 'cluster' ? process.send : self.postMessage;
         //console.log('send====', this.env, send === process.send );
         //send = makeSendFun(this.env, process.send);
         //process.send?.apply(process, [{ task, method: method, args: args }]);
         //send({app: this.app, task, method: method, args: args });
         send({ app: this.app, task, method: method, args: args });
      });
   }
}
export default TCFactor;
