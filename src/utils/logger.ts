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
import path from "path";
const isDev = process.env.NODE_ENV == "development";

const logger = getLogger();
logger.level = 'info';

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
  private logger: Logger;
  private categories = {};
  constructor(logger: Logger) {
    //super();
    this.logger = logger;
  }

  level: string;

  log(...args: any[]): void {
    this.logger.log(...args);
  }

  isLevelEnabled(level?: string): boolean {
    return this.logger.isLevelEnabled(level);
  }

  isTraceEnabled(): boolean {
    return this.logger.isTraceEnabled();
  }
  isDebugEnabled(): boolean {
    return this.logger.isDebugEnabled();
  }
  isInfoEnabled(): boolean {
    return this.logger.isInfoEnabled();
  }
  isWarnEnabled(): boolean {
    return this.logger.isWarnEnabled();
  }
  isErrorEnabled(): boolean {
    return this.logger.isErrorEnabled();
  }
  isFatalEnabled(): boolean {
    return this.logger.isFatalEnabled();
  }

  _log(level: string, data: any): void {
    return this.logger._log(level, data);
  }

  addContext(key: string, value: any): void {
    return this.logger.addContext(key, value);
  }

  removeContext(key: string): void {
    return this.logger.removeContext(key);
  }

  clearContext(): void {
    return this.logger.clearContext();
  }

  setParseCallStackFunction(parseFunction: Function): void {
    return this.logger.setParseCallStackFunction(parseFunction);
  }

  trace(message: any, ...args: any[]): void {
    return this.logger.trace(message, ...args);
  }

  debug(message: any, ...args: any[]): void {
    return this.logger.debug(message, ...args);
  }

  info(message: any, ...args: any[]): void {
    return this.logger.info(message, ...args);
  }

  warn(message: any, ...args: any[]): void {
    return this.logger.warn(message, ...args);
  }

  error(message: any, ...args: any[]): void {
    return this.logger.error(message, ...args);
  }

  fatal(message: any, ...args: any[]): void {
    return this.logger.fatal(message, ...args);
  }
  getLogger(category: string) {
    if (!this.categories[category]) this.categories[category] = new Log(getLogger(category));
    return this.categories[category];
  }

  get console() {
    return this.getLogger('console');
  }
  /** 运行耗时 */
  consume(msg?: string) {
    logger.info(`task info=${msg || ""} time=${Date.now() - time}ms`);
    time = Date.now();
  }
}

export default new Log(logger);
