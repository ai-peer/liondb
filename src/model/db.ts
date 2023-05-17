import fs from "fs";
import path from "path";
import os from "os";
import LionDB from "../index";
import cluster from "cluster";

function mkdirs(dir) {
   if (!fs.existsSync(dir)) {
      try {
         fs.mkdirSync(dir);
      } catch (err) {
         let par = dir.replace(/[\/\\][^\/\\]+$/, "");
         mkdirs(par);
         fs.mkdirSync(dir);
      }
   }
}

export function create(app: string, name: string): LionDB {
   let filenameMaster = path.join(os.homedir(), app, `liondb-${name}`);
   mkdirs(filenameMaster);

   let master: LionDB = LionDB.worker({
      filename: filenameMaster,
      env: "cluster",
      isMaster: cluster.isMaster,
      thread: cluster.isMaster ? cluster : cluster.worker,
   });
   return master;
}
export function createModel(app: string, tableName: string) {
   let filenameMaster = path.join(os.homedir(), app, "ldb", tableName, `model`);
   mkdirs(filenameMaster);

   let filenameMasterIndex = path.join(os.homedir(), app, "ldb", tableName, `index`);
   mkdirs(filenameMasterIndex);

   let master: LionDB = LionDB.worker({
      filename: filenameMaster,
      env: "cluster",
      isMaster: cluster.isMaster,
      thread: cluster.isMaster ? cluster : cluster.worker,
   });
   let index: LionDB = LionDB.worker({
      filename: filenameMasterIndex,
      env: "cluster",
      isMaster: cluster.isMaster,
      thread: cluster.isMaster ? cluster : cluster.worker,
   });
   return {
      masterdb: master,
      indexdb: index,
   };
}
