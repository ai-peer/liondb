import { Model, Schema, IsNotEmpty, Max, Column } from "../src";
Model.setApp("demo-app");

class User extends Schema {
   constructor(data?) {
      super(data);
   }
   @Column({ type: "string" })
   @IsNotEmpty()
   title: string;

   @Column({ default: 11, type: "number", index: (v) => "mx-" + v })
   @Max(200)
   age: number;

   @Column({
      type: "string",
      format(val, db) {
         return val + "->";
      },
   })
   @IsNotEmpty()
   addr: string;

   @Column({ type: "array" })
   @IsNotEmpty()
   pwds: string[];

   @Column({ type: "number", default: 1 })
   score: number;

   mobile: string;
}
class UserDAO extends Model<User> {
   constructor() {
      super({
         table: "user",
         indexs: [
            { name: "com", fields: ["title", "age"] },
            { name: "score", fields: ["score", "title"] },
         ],
         SchemaClass: User,
      });
      //this.masterdb.clear();
      //this.indexdb.clear();
   }
}
(async () => {
   //console.info("model", Model, Schema);

   let userDAO = new UserDAO();
   async function save() {
      const v = 8; // Math.ceil(Math.random() * 50 + 10);
      let user = {
         title: "chenkun",
         age: v,
         addr: "sun two 10",
         sex: "man",
         pwds: ["a", "b", "c"],
      };
      let euser = await userDAO.insert(user as any);
      console.info("save user", user, euser);
   }
   async function search() {
      //let list = await userDAO.find({});
      //     index
      let list = await userDAO.find({
         index: { name: "com", fields: ["chenkun"] },
         filter: async (entity, key) => {
            return entity.age < 100;
         },
         limit: 100,
      });
      console.info("list by index", list);
      let count = await userDAO.count({
         index: { name: "com", fields: ["chenkun"] },
         filter: async (entity, key) => {
            return entity.age < 100;
         },
      });
      console.info("count by index com", count);

      //      master
      list = await userDAO.find({ filter: async (user) => user.title.startsWith("chenkun") });
      //console.info("list by master", list);
      count = await userDAO.count({ filter: async (user) => user.title.startsWith("chenkun") });
      //console.info("count by master", count);
      //console.info("==list", await userDAO.gets("rusgdbzzwK4UE"))

      count = await userDAO.count({});
      console.info("count total", count);

      let v = await userDAO.get("1q1ESUzzy");
      console.info("v", v);
   }
   async function update() {
      const id = "1q0I33zzy";
      let nv = await userDAO.save(id, {
         pwds: ["ax===", "b13"],
         age: 18,
         mdi: "mdi",
         score: (v) => v + 2,
      });
      let en = await userDAO.get(id);
      console.info("update ", en, nv);
      console.info("===", nv.toColumnValue("updateAt", "2022/01/01"));
   }
   await save();
   //await search();
   //await update();
})();
