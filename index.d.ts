/* import Local from './lib/local';
import LocalDB from './lib/core/localdb';
import tcfactor from './lib/core/tcfactor';
import password from './lib/core/password';
import cipher from './lib/core/cipher';
import util from './lib/utils';
 */

export class LightDB {
  constructor(filename: string);
  static multiThread(options: {
    /** 数据库文件名 */
    filename: string;
    app?: string;
    /** 运行环境, cluster集群, electron, browser:流星器 */
    env: "cluster" | "electron" ;
    /** 是否是主线程 */
    isMaster: boolean;
    /** 当前线程 */
    thread;
  }): LightDB;
  /**
   * 设置值
   * @param key key关键字
   * @param value 值
   * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
   */
  set(key: string, value: Buffer | string | number | Object, ttl?: number): Promise<void>;
  /**
   * 设置值
   * @param key key关键字
   * @param value 值
   * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
   */
  put(key: string, value: Buffer | string | number | Object, ttl?: number): Promise<void>;
  /**
   * 获取数据
   * @param key
   * @param extension 是否自动延期(默认false, 如果在put时,设置的过期时间, 才会起作用)
   */
  get(key: string, extension?: boolean): Promise<any>;
  getSet(key: string, value: any, ttl?: number): Promise<any>;
  getIntSet(key: string, value: number, ttl?: number): Promise<number>;
  getStringSet(key: string, value: string, ttl?: number): Promise<string>;
  getFloatSet(key: string, value: number, ttl?: number): Promise<number>;
  getString(key: string, extension?: boolean): Promise<string>;
  getInt(key: string, extension?: boolean): Promise<number>;
  getFloat(key: string, extension?: boolean): Promise<number>;
  /**
   * 设置过期时间
   * @param key
   * @param ttl
   */
  expire(key: string, ttl: number): Promise<void>;
  /**
   * 取得增量后的值,并存储
   * @param key
   * @param increment 增量,默认为1
   */
  increment(key: string, increment?: number, ttl?: number): Promise<number>;
  /**
   * 删除
   * @param key
   */
  del(key: string): Promise<void>;
  /**
   * 批量操作
   * @param ops
   */
  batch(ops?: any): Promise<void>;
  clear(ops: { gt; lt; limit }): Promise<void>;
  iterator(
    options: {
      key: string;
      lt?;
      lte?;
      gt?;
      gte?;
      limit?: number;
    },
    callback,
  ): Promise<void>;
}
