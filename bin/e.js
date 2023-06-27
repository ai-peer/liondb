const { LionDB, Model, Schema, IsNotEmpty, Max, Column } = require("../publish/dist/node");

//const { Model, Schema, IsNotEmpty, Max, Column } = LionDB;
console.info("====", LionDB, Model);
Model.setApp("demo-app");

class User extends Schema {
   constructor(data) {
      super();
      this.reduce(data);
   }
   title;
   age;
   addr;
   sn;
}
class UserDAO extends Model {
   constructor() {
      super({ table: "user", indexs: [{ name: "com", fields: ["title", "age"] }], SchemaClass: User });
   }
}
(async () => {
   await new Promise((resolve) => {
      Model.onReady(() => {
         console.info("ready===========");
         // setTimeout(()=>resolve(), 1000);
         resolve();
      });
   });
   let userDAO = new UserDAO();
   async function save() {
      let user = new User({
         title: "lix",
         age: 38,
         addr: "sun fixed",
         createAt: new Date(),
         sn: Date.now(),
      });
      user.age = 18;
      user = await userDAO.insert(user);
      console.info("insert user", user);
   }
   async function search() {
      //let list = await userDAO.find({});
      let list = await userDAO.find({ index: { name: "com", fields: ["li"] } });
      console.info("list", list);
      let en = await userDAO.get("1q4Z0kzzy");
      console.info("en", en);
   }
   await save();
   search();
})();
