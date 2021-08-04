#  LionDB 应用在本地应用的存储系统, 支持分布式运行
### 可以做单机持久存储或缓存， 基于google开源的leveldb之上做的封装

## 使用例子

```
    import LionDB from "@ai-lion/liondb";
    //单个线程：
   
    let liondb = LionDB("path");

    //cluster 集群环境
    //const isMaster = cluster.isMaster;
    let liondb = LionDB.clusterThread({filename:  'path', env: "cluster", isMaster: cluster.isMaster, thread: cluster.isMaster ? cluster : cluster.worker， app: "app name"  });





    (async()=>{
        await liondb.set("aa", {name: 'aa'});
        let value = await liondb.get("aa);
        console.info("get ", value);
    })();



```

## api

```
    let liondb = LionDB("path");
    liondb.get("key"): Promise<any>;
    liondb.set("key", {name: "xxxxxx any value"}, ttl?);//ttl=过期时间， 单位秒
    liondb.increment("key", increment?, ttl?); //增量写入， increment=增量值， 默认1， ttl=过期时间， 单位秒
    liondb.del("key");
    liondb.count("key-*"): Promise<number>; //统计有多少个， 后辍的*表示通配符， 只能在最后使用
    liondb.find({key: "key-*", start: 0, limit: 100}): Promise<{key, value}[]>;//内容查找
    liondb.iterator({key: "key-*", start: 0, limit: 100}, async(key, value)=>{ //内容迭代查询
    });
    liondb.batch([{
        type: "put",//表示写入
        key: 'xxx',
        value: 'xxx'
    }, {
        type: "del",//表示删除
        key: 'aaa',
    }])
    
```