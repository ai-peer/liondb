import { Model, Schema, IsNotEmpty, Max, Column } from "../src";
Model.setApp("demo-app");

class User extends Schema {
   constructor(data?) {
      super(data);
   }
   @Column
   @IsNotEmpty()
   title: string;

   @Column
   @Max(200)
   age: number;

   @Column
   @IsNotEmpty()
   addr: number;

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
      };
      await userDAO.create(user as any);
      //console.info("user", user);
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
      const id = "ruttmwzzw4FVu";
      const sdata = new User({ title: "liguo", age: 99 });
      let nv = await userDAO.save(id, sdata);
      let en = await userDAO.get(id);
      console.info("update ", sdata, en, nv, en === nv);
   }
   //await save();
   await search();
   //await update();
})();
