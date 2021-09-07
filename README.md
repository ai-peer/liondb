#  LionDB 应用在本地应用的存储系统, 支持分布式运行
### 可以做单机持久存储或缓存， 基于google开源的leveldb之上做的封装

## 使用例子
### nodejs环境
``` 
   
    // liondb.js
    import LionDB from "@ai-lion/liondb";
    
    //单个线程：
    let liondb = LionDB("path");

    //cluster 集群环境
    //const isMaster = cluster.isMaster;
    let liondb = LionDB.clusterThread({filename:  'path', env: "cluster", isMaster: cluster.isMaster, thread: cluster.isMaster ? cluster : cluster.worker， });


    //阿里 egg 框架 集群环境：
        const lionDB = require("@ai-lion/liondb");
        const cluster = require("cluster");

        let liondb;
        module.exports = (thread) => {
            if (liondb) return liondb;
            if (!thread) throw new Error("use liondb no thread");
            try {
                liondb = lionDB.clusterThread({ filename: ".liondb", env: "egg", isMaster: cluster.isMaster, thread: thread }, (err) => {
                    console.info("...........load ", err ? err.message : "");
                });
            } catch (err) {
                console.info("error load liondb ", err.message);
            }
            return liondb;
        };

    // agent.js //这个是egg框架内置的一个配置文件， 会 自动读取，优先加载，放在根目录 与 app.js同目录
        module.exports = async (agent) => {
            require("./liondb")(agent.messenger);
        };


    (async()=>{
        await liondb.set("aa", {name: 'aa'});
        let value = await liondb.get("aa);
        console.info("get ", value);
    })();



```
### 浏览器环境
``` 
 // 使用webpack 打包环境的
    import LionDB from "@ai-lion/liondb/dist/browser";
    或
    import LionDB = require("@ai-lion/liondb/dist/browser");

 // html页面直接引用： 
    https://cdn.jsdelivr.net/npm/@ai-lion/liondb/dist/liondb.js
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