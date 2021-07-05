/**
 *
 * 前后台封装
 *
 */
const { EventEmitter } = require("events");
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
function makeSendFromWorkerFun(env, event) {
   //let send = this.env == 'electron' ? event.reply : this.env == 'cluster' ? event.send : self.postMessage;
   switch (env) {
      case "electron":
         return function(data) {
            event.reply("message", data);
         };
      case "cluster":
         return function(data) {
            //send(data);
            //process?.send?.apply(process, [data]);
            event.send(data);
         };
      case "egg":
         return function(data) {
            //process?.send?.apply(process, [data]);
            event.send(data);
         };
      case "browser":
         return function(data) {
            //send(data);
            global["self"] && global["self"].postMessage(data, "");
         };
   }
}
function makeSendFromMainFun(env, thread) {
   //let send = this.env == 'electron' ? this.options.workerThread.send : this.env == 'cluster' ? process.send : self.postMessage;
   switch (env) {
      case "electron":
         return function(data) {
            thread.send("message", data);
         };
      case "cluster":
         return function(data) {
            //send(data);
            thread.send && thread.send.apply(thread, [data]);
         };
      case "egg":
         return function(data) {
            //send(data);
            thread.sendMessage(data);
         };
      case "browser":
         return function(data) {
            //send(data);
            global["self"] && global["self"].postMessage(data, "");
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
class TCFactor extends EventEmitter {
   isMaster; //: boolean;
   env; //: "cluster" | "electron" | "browser";
   app; //: string;
   thread;
   executor; //: any;
   static ___apps = {};
   taskCallback = {}; //任务回调
   constructor({ app, thread, isMaster, executor, env } = {}) {
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
            let { app, task, method, args, pid } = data || event;
            if (app != this.app) return;
            if (this.env == "egg") {
               event = {
                  send: (datax) => thread.sendTo(pid, "message", datax),
               };
            }
            //let send = this.env == 'electron' ? event.reply : this.env == 'cluster' ? event.send : self.postMessage;
            let send = makeSendFromWorkerFun(this.env, event);
            if (args[args.length - 1] === "[function]") {
               //最后一位是回调函数
               args[args.length - 1] = (key, value) => {
                  send ? send({ app, task: task, code: 2, key, value }) : console.warn(`主线程环境${this.env}不存在发送方法`);
               };
            }
            let target = executor[method];
            let value = undefined;
            if (target instanceof Function) {
               value = await target.apply(executor, args);
            } else {
               value = target;
            }
            send ? send({ app, task: task, code: 1, value }) : console.warn(`主线程环境${this.env}不存在发送方法`);
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
            let data = {};
            if (this.env == "electron") {
               data = args[1];
            } else if (this.env == "cluster" || this.env == "egg") {
               data = args[0];
            } else {
               data = args[0] ? args[0].data : {};
            }
            let { app, task, code, value, key } = data;
            //console.log("<<<<<<<<<<<<<view ", key, code, task);
            this.emit(task, { code, value, key });
         });
         for (let key in this.executor) {
            if (key.startsWith("_")) continue;
            let targetFun = this.executor[key];
            if (targetFun instanceof Function) {
               this.executor[key] = new Proxy(this.executor[key], {
                  apply: function(target, thisArg, args) {
                     targetFun.bind(target)(...args);
                     return _this.execute(key, ...args);
                  },
               });
            }
         }
      }
   }
   execute(method, ...args) {
      if (this.isMaster) {
         return this.executor[method].apply(this.executor, args);
      }

      return new Promise((resolve, reject) => {
         let task = "task-" + Math.floor(Math.random() * 9999999999);
         if (args[args.length - 1] instanceof Function) {
            //最后一个是函数, 约定是回调函数
            this.taskCallback[task] = args[args.length - 1];
            args[args.length - 1] = "[function]"; //标记最后一位是任务回调
         }
         this.on(task, ({ code, value, key, message }) => {
            if (code == 1) {
               this.removeAllListeners(task);
               resolve(value);
            } else if (code == 2) {
               this.taskCallback[task](key, value);
            } else {
               reject(new Error(message));
            }
         });
         //let send = this.env == 'electron' ? this.options.workerThread.send : this.env == 'cluster' ? process.send : self.postMessage;
         //console.log('send====', this.env, send === process.send );
         //send = makeSendFun(this.env, process.send);
         //process.send?.apply(process, [{ task, method: method, args: args }]);
         //send({app: this.app, task, method: method, args: args });
         let send = makeSendFromMainFun(this.env, this.thread);

         send ? send({ app: this.app, task, method: method, args: args }) : console.warn(`子线程环境${this.env}不存在发送方法`);
      });
   }
}
module.exports = TCFactor;
