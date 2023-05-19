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
      super({ table: "user", indexs: [{ name: "com", fields: ["title", "age"] }] });
   }
}
(async () => {
   console.info("model", Model, Schema);

   let userDAO = new UserDAO();
   async function save() {
      let user = new User({
         title: "chenkun",
         //age: 10,
         //addr: "sun fixed 10",
         sex: "man",
      });
      console.info("user1", user);

      //await userDAO.create(user);
      //console.info("user", user);
   }
   async function search() {
      //let list = await userDAO.find({});
      //     index
      let list = await userDAO.find({
         index: { name: "com", fields: ["chenkun"] },
         filter: async (entity, key) => {
            return entity.age < 12;
         },
      });
      console.info("list by index", list);
      let count = await userDAO.count({
         index: { name: "com", fields: ["chenkun"] },
         filter: async (entity, key) => {
            return entity.age < 12;
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
   }
   async function update() {
      const id = "ruttmwzzw4FVu";
      const sdata = new User({ title: "liguo", age: 31 });
      let nv = await userDAO.save(id, sdata);
      let en = await userDAO.get(id);
      console.info("update end", en, sdata, nv, sdata === nv);
   }
   await save();
   await search();
   //await update();
})();
