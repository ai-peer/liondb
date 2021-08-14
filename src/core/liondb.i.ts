export interface ILionDB {
   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   set(key: string, value: any, ttl: number): Promise<undefined>;
   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   put(key: string, value: any, ttl: number): Promise<undefined>;
   getSet(key: string, value: any, ttl: number): Promise<any>;
   getIntSet(key: string, value: any, ttl: number): Promise<number>;
   getStringSet(key: string, value: any, ttl: number): Promise<string>;
   getFloatSet(key: string, value: any, ttl: number): Promise<number>;
   getString(key: string, extension: boolean): Promise<string>;
   getInt(key: string, extension: boolean): Promise<number>;
   getFloat(key: string, extension: boolean): Promise<number>;
   /**
    * 获取数据
    * @param key
    * @param extension 是否自动延期(默认false, 如果在put时,设置的过期时间, 才会起作用)
    */
   get(key: string, extension: boolean): Promise<any>;
   /**
    * 设置过期时间
    * @param key
    * @param ttl
    */
   expire(key: string, ttl: number): Promise<undefined>;
   /**
    * 取得增量后的值,并存储
    * @param key
    * @param increment 增量,默认为1
    */
   increment(key: string, increment: number, ttl: number): Promise<number>;
   /**
    * 删除
    * @param key
    */
   del(key): Promise<{ key: string; value: any }[] | { key: string }[]>;
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
   batch(ops: { type: "del" | "put"; key: string; value?: any; ttl?: number }[]): Promise<undefined>;
   clear(ops): Promise<undefined>;
   close(): Promise<undefined>;
   count(key: string): Promise<number>;
   find(config: { key: string; limit?: number; start?: number }): Promise<{ key: string; value: any }[]>;
   iterator(config: { key: string; limit?: number; start?: number }, callback: Function): Promise<undefined>;
}
