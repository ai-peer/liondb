import { Model, Schema, IsNotEmpty, Max, Column } from "../src";
Model.setApp("demo-app");

class User extends Schema {
   constructor(data?) {
      super(data);
   }
   @Column({ type: "string", default: "" })
   @IsNotEmpty()
   title: string;

   @Column({})
   @Max(200)
   age: number;

   @Column({
      format(val, target) {
         console.info("format", val, target);
         return val.trim() + ">>>>ok|<";
      },
   })
   @IsNotEmpty()
   addr: number;

   @Column({ default: [] })
   @IsNotEmpty()
   pwds: string[];

   mobile: string;
}
class UserDAO extends Model<User> {
   constructor() {
      super({ table: "user", indexs: [{ name: "com", fields: ["title", "age"] }], SchemaClass: User });
   }
}
(async () => {
   console.info("model", Model, Schema);

   let userDAO = new UserDAO();
   async function save() {
      let user = {
         title: "chenkun",
         age: Math.ceil(Math.random() * 50 + 10),
         addr: "sun two 10",
         sex: "man",
         pwds: ["a", "b", "c"],
      };
      let euser = await userDAO.create(user as any);
      console.info("save user", euser);
   }
   async function search() {
      //let list = await userDAO.find({});
      //     index
      let list = await userDAO.find({
         index: { name: "com", fields: ["chenkun"] },
         filter: async (entity, key) => {
            return entity.age < 100;
         },
      });
      console.info("list by index", list);
      let count = await userDAO.count({
         index: { name: "com", fields: ["chenkun"] },
         filter: async (entity, key) => {
            return entity.age < 100;
         },
      });
      console.info("count by index", count);

      //      master
      list = await userDAO.find({ filter: async (user) => user.title.startsWith("chenkun") });
      //console.info("list by master", list);
      count = await userDAO.count({ filter: async (user) => user.title.startsWith("chenkun") });
      //console.info("count by master", count);
      //console.info("==list", await userDAO.gets("rusgdbzzwK4UE"))

      count = await userDAO.count({});
      console.info("count total", count);

      let v = await userDAO.get("ruttmwzzw4FVu1");
      console.info("v", v);
   }
   async function update() {
      const id = "1q0I33zzy";
      let nv = await userDAO.save(id, {
         pwds: ["ax===", "b13"],
         age: 39,
         mdi: "mdi",
      });
      let en = await userDAO.get(id);
      console.info("update ", en, nv);
      console.info("===", nv.toColumnValue("updateAt", "2022/01/01"));
   }
   //await save();
   await search();
   await update();
})();
