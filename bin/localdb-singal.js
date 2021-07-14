//import program from "commander";
const path = require("path");
const os = require("os");
const LionDB = require("../src");
/* 
const configFile = path.resolve(os.homedir(), ".light-app.json");

let configObj;
program
  .version(module.exports.version)
  .description(module.exports.description)
  .option("-P, --password [value]", "the password for server")
  .option("-L, --listen [value]", "the listen address for server")
  .option("-R, --remote [value]", "the remote server address")
  .parse(process.argv);

console.debug(`载入配置文件${configFile}`);
configObj = config.loadConfig(configFile);

if (program.password) {
  if (password.validatePassword(program.password)) {
    configObj.password = program.password;
  } else {
    console.error("密码不合法");
    process.exit(1);
  }
}
if (program.listen) {
  if (program.listen.split(":").length === 1) {
    configObj.listen = "0.0.0.0:" + program.listen;
  } else {
    configObj.listen = program.listen;
  }
} else {
  if (!configObj.listen) {
    configObj.listen = "0.0.0.0:1086";
  }
}
if (program.remote) {
  if (program.remote.split(":").length !== 2) {
    console.error("请按照<ip_address>:port的格式定义远程地址");
    process.exit(1);
  }
  configObj.remote = program.remote;
} else {
  if (!configObj.remote) {
    config.writeConfig(configObj, configFile);
    console.error("请在配置文件或命令行中定义远程服务器地址");
    process.exit(1);
  }
} */
//

let localdb = new LionDB(path.join(os.homedir(), "ligdb-dev"));
(async () => {
   let list = [];
   for (let i = 0; i < 500; i++) {
      list.push({
         name: "asdfsdf_" + i,
         age: i,
         let: "xxxxxx_" + i,
      });
   }
   await localdb.set("aa_75", { name: "li 75" });
   await localdb.set("aa_76", { name: "li 76" });
   await localdb.set("aa_77", { name: "li" });
   await localdb.set("aa_78", { name: "zhang" });
   await localdb.set("aa_79", { name: "li79" });
   await localdb.set("bb_79", { name: "bb_79" });
   await localdb.set("xxxxxx", { name: "xxxxx" });
   //await localdb.del('NetService_net_user_91*');
   await localdb.set("NetService_net_user_91_getNetListByUserIdExpired", list);

   console.log("get ", await localdb.get("aa_75"));
   localdb.iterator({ key: "aa_*" }, (skey, val) => {
      console.log("...--iterator", skey);
   });

   let list1 = await localdb.find({ key: "aa_*", start: 2, limit: 2 });
   console.info("list ", list1);

   //
   /*  console.log(">>>>>>>s2 del after");
  await localdb.iterator({key: 'aa*'}, (skey, val)=>{
    console.log("...1", skey, val)
  });
  console.log(">>>>>>>s3 end"); */
})();
async function wait(ttl) {
   return new Promise((resolve) => setTimeout(() => resolve(), ttl));
}
