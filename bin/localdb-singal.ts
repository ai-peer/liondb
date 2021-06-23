import program from "commander";
import path from "path";
import os from "os";

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

import LionDB from "index";
let localdb = new LionDB(path.join(os.homedir(), "ligdb-dev"));
(async () => {
   let list: any[] = [];
   for (let i = 0; i < 500; i++) {
      list.push({
         name: "asdfsdf_" + i,
         age: i,
         let: "xxxxxx_" + i,
      });
   }

   await localdb.set("aa_77", { name: "li" }, 5);
   await localdb.set("aa_78", { name: "zhang" });
   await localdb.set("aa_79", { name: "li79" });
   await localdb.set("bb_79", { name: "bb_79" });
   await localdb.set("xxxxxx", { name: "xxxxx" });
   //await localdb.del('NetService_net_user_91*');
   await localdb.set("NetService_net_user_91_getNetListByUserIdExpired", list);

   console.log(">>>>>>>s1 ");
   await localdb.iterator({ key: "NetService_net_user_91*" }, (skey, val) => {
      console.log("...0", skey);
   });
   setTimeout(async () => {
      console.log("...set get ", await localdb.get("aa_77"));
   }, 5000);
   //
   /*  console.log(">>>>>>>s2 del after");
  await localdb.iterator({key: 'aa*'}, (skey, val)=>{
    console.log("...1", skey, val)
  });
  console.log(">>>>>>>s3 end"); */
})();
