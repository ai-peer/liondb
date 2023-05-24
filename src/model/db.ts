import fs from "fs";
import path from "path";
import os from "os";
import cluster from "cluster";
import LionDB from "@/core/liondb.node";

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
function isNode() {
   try {
      return !!process.platform && !!process.cwd() && !globalThis.document;
   } catch (err) {
      return false;
   }
}
function createLiondb(app: string, name: string): LionDB {
   if (isNode()) {
      let filename = path.join(os.homedir(), app, `${name}`);
      //console.info("create liondb", filename);
      mkdirs(filename);
      let master: LionDB = LionDB.worker({
         filename: filename,
         env: "cluster",
         isMaster: cluster.isPrimary,
         thread: cluster.isPrimary ? cluster : cluster.worker,
      });
      return master;
   } else {
      let filename = app + "-" + name;
      let master: LionDB = LionDB.worker({ filename: filename });
      return master;
   }
}
export function create(app: string, name: string): LionDB {
   let master: LionDB = createLiondb(app, `liondb-${name}`);
   return master;
}

export function createModel(app: string, tableName: string) {
   /* let filenameMaster = path.join(os.homedir(), app, "ldb", tableName, `model`);
   mkdirs(filenameMaster);
   let filenameMasterIndex = path.join(os.homedir(), app, "ldb", tableName, `index`);
   mkdirs(filenameMasterIndex); */

   let master: LionDB = createLiondb(app, `ldb/${tableName}/model`);
   let index: LionDB = createLiondb(app, `ldb/${tableName}/index`);
   return {
      masterdb: master,
      indexdb: index,
   };
}
