#  LionDB 应用在本地应用的缓存系统, 支持分布式运行

## 使用例子

```
    //单个：
    let liondb = new LionDB("path");
    //cluster 集群环境
    //const isMaster = cluster.isMaster;
    //let liondb = LionDB.cluster({filename:  ‘path’, env: "cluster", isMaster: cluster.isMaster, thread: cluster.isMaster ? cluster : cluster.worker  });





    (async()=>{
        await liondb.set("aa", {name: 'aa'});
        let value = await liondb.get("aa);
        console.info("get ", value);
    })();



```