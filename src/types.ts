
export const Type = {
   String: 1,
   Number: 2,
   Object: 3,
   Buffer: 4,
   Boolean: 5,
};
export type LionDBOptions = {
   env: "cluster" | "electron" | "egg" | "browser"; // 运行环境
   isMaster: boolean; //是否是主线程
   thread: any; //线程 cluster模式： cluster | cluster.worker ， egg模式： agent.messenger ， electron模式  browser浏览器模式
};
export interface ILionDB {
   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   set(key: string, value: any, ttl?: number): Promise<void>;
   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   put(key: string, value: any, ttl?: number): Promise<void>;
   getSet(key: string, value: any, ttl?: number): Promise<any>;
   getIntSet(key: string, value: any, ttl?: number): Promise<number>;
   getStringSet(key: string, value: any, ttl?: number): Promise<string>;
   getFloatSet(key: string, value: any, ttl?: number): Promise<number>;
   getString(key: string, extension: boolean): Promise<string>;
   getInt(key: string, extension: boolean): Promise<number>;
   getFloat(key: string, extension: boolean): Promise<number>;
   /**
    * 获取数据
    * @param key
    * @param extension 是否自动延期(默认false, 如果在put时,设置的过期时间, 才会起作用)
    */
   get(key: string, extension?: boolean): Promise<any>;
   getMany(...keys: string[]): Promise<any[]>;
   getProperty(property: "leveldb.num-files-at-levelN" | "leveldb.stats" | "leveldb.sstables"): Promise<any>;
   /**
    * 设置过期时间
    * @param key
    * @param ttl
    */
   expire(key: string, ttl?: number): Promise<void>;
   /**
    * 存在
    * @param key
    * @deprecated
    */
   exist(key: string): Promise<boolean>;
   /**
    * 是否存在
    * @param key
    */
   has(key: string): Promise<boolean>;
   /**
    * 取得增量后的值,并存储
    * @param key
    * @param increment 增量,默认为1
    */
   increment(key: string, increment: number, ttl?: number): Promise<number>;
   /**
    * 删除
    * @param key
    */
   del(...keys: string[]): Promise<void>;
   /**
    * 
    * @param {
    *  {  type : 'del' | 'put' ,  key : string  } , 
    {  type : 'put' ,  key : 'name' ,  value : 'Yuri Irsenovich Kim'  } , 
    {  type : 'put' ,  key : ' dob' ,  value : '16 February 1941'  } , 
    {  type : 'put' ,  key : 'spouse' , 价值: 'Kim Young-sook'  } , 
    {  type : 'put' ,  key : 'occupation' ,  value : 'Clown'  } 
    * } ops 
    * @returns 
    */
   batch(ops: { type: "del" | "put"; key: string; value?: any; ttl?: number }[]): Promise<void>;
   clear(ops?): Promise<void>;
   close(): Promise<void>;
   count(key: string, filter?: Filter): Promise<number>;
   /** 总条数 */
   total(): Promise<number>;
   /**
    * 查找
    * @param config
    *    key: 搜索词 结尾 * 表示匹配所有
    *    start: 开始位置 默认 0
    *    limit: 限制 默认100条， -1 表示无限
    *    reverse: 倒序查询， 默认false
    *    keys: 搜索结果是否包含key, 默认false
    *    flow: boolean, 顺流查找(模糊搜索才有效), 在查询关键字不匹配时,自动往下查询,默认false
    */
   find(config: {
      key: string;
      limit?: number;
      start?: number;
      reverse?: boolean;
      filter?: Filter;
      keys?: boolean;
      //isRef?: boolean;
   }): Promise<{ key: string; value: any }[] | any[]>;
      /**
    * 递归查询
    * @param param0 {
    *    key: 查询词, 结尾*表示模糊搜索
    *    limit: 查询限制条数,默认100条
    *    filter: 过滤器 (value: any, key: string) => boolean || Promise<boolean>
    *    reverse: boolean, 逆转,默认false true=逆转 false=正常
    *    flow: boolean, 顺流查找(模糊搜索才有效), 在查询关键字不匹配时,自动往下查询,默认false
    * }
    * @param callback
    */
   iterator(
      config: {
         key: string;
         limit?: number;
         start?: number;
         filter?: Filter;
         //isRef?: boolean;
      },
      callback: IteratorCallback,
   ): Promise<void>;
}
type Get = (key: string) => Promise<any>;
type GetMany = (...key: string[]) => Promise<any[]>;
export type Filter = (value: any, key: string, db: { get: Get; getMany: GetMany }) => Promise<boolean> | boolean;

export type IteratorCallback = (key: string, value?: any) => Promise<"break"> | "break" | Promise<any> | any;
