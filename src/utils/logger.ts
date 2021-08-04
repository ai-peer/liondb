/**
 * {
  ALL: new Level(Number.MIN_VALUE, "ALL"),
  TRACE: new Level(5000, "TRACE"),
  DEBUG: new Level(10000, "DEBUG"),
  INFO: new Level(20000, "INFO"),
  WARN: new Level(30000, "WARN"),
  ERROR: new Level(40000, "ERROR"),
  FATAL: new Level(50000, "FATAL"),
  MARK: new Level(9007199254740992, "MARK"), // 2^53
  OFF: new Level(Number.MAX_VALUE, "OFF")
}
 * 
 */
import { configure, getLogger, ConsoleAppender, Logger } from "log4js";

const isDev = process.env.NODE_ENV == "development";

const logger = getLogger();
logger.level = "info";

/**
 * 日志输出格式
 * https://github.com/log4js-node/log4js-node/blob/master/docs/layouts.md
 */
const layout = {
   type: "pattern",
   //pattern: '{"date":"%d","level":"%p","category":"%c","host":"%h","pid":"%z","data":\'%m\'}'
   pattern: `%[[%d{yyyy-MM-dd hh:mm:ss}{GMT+8}] [%p] %c%] %m`,
};
configure({
   appenders: {
      console: { type: "console", layout },
      log: { type: "file", filename: "log.log", layout },
   },
   categories: {
      default: { appenders: ["console", "log"], level: logger.level },
      console: { appenders: ["console"], level: logger.level },
   },
});
let time = Date.now();
export class Log {
   logger; //Logger
   categories = {};
   /**
    *
    * @param {Logger} logger
    */
   constructor(logger) {
      //super();
      this.logger = logger;
   }

   level; //string

   /**
    *
    * @param  {any[]} args
    */
   log(...args) {
      this.logger.log(...args);
   }

   isLevelEnabled(level) {
      return this.logger.isLevelEnabled(level);
   }

   isTraceEnabled() {
      return this.logger.isTraceEnabled();
   }
   isDebugEnabled() {
      return this.logger.isDebugEnabled();
   }
   isInfoEnabled() {
      return this.logger.isInfoEnabled();
   }
   isWarnEnabled() {
      return this.logger.isWarnEnabled();
   }
   isErrorEnabled() {
      return this.logger.isErrorEnabled();
   }
   isFatalEnabled() {
      return this.logger.isFatalEnabled();
   }

   _log(level, data) {
      return this.logger._log(level, data);
   }

   addContext(key, value) {
      return this.logger.addContext(key, value);
   }

   removeContext(key) {
      return this.logger.removeContext(key);
   }

   clearContext() {
      return this.logger.clearContext();
   }
   /**
    *
    * @param {Function} parseFunction
    * @returns
    */
   setParseCallStackFunction(parseFunction) {
      return this.logger.setParseCallStackFunction(parseFunction);
   }
   /**
    *
    * @param {String} message
    * @param  {any[]} args
    * @returns
    */
   trace(message, ...args) {
      return this.logger.trace(message, ...args);
   }
   /**
    *
    * @param {string} message
    * @param  {any[]} args
    * @returns
    */
   debug(message, ...args) {
      return this.logger.debug(message, ...args);
   }

   info(message, ...args) {
      return this.logger.info(message, ...args);
   }

   warn(message, ...args) {
      return this.logger.warn(message, ...args);
   }

   error(message, ...args) {
      return this.logger.error(message, ...args);
   }

   fatal(message, ...args) {
      return this.logger.fatal(message, ...args);
   }
   getLogger(category) {
      if (!this.categories[category]) this.categories[category] = new Log(getLogger(category));
      return this.categories[category];
   }

   get console() {
      return this.getLogger("console");
   }
   /** 运行耗时 */
   consume(msg) {
      logger.info(`task info=${msg || ""} time=${Date.now() - time}ms`);
      time = Date.now();
   }
}

export default new Log(logger);
