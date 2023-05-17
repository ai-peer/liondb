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
         title: "lilei",
         age: (Date.now() % 50) + 10,
         addr: "sun fixed",
      });
      await userDAO.create(user);
      console.info("user", user);
   }
   async function search() {
      //let list = await userDAO.find({});
      let list = await userDAO.find({ index: { name: "com", fields: ["li"] } });
      console.info("list", list);
      let en = await userDAO.get("rusgdbzzwK4UE");
      console.info("en", en);
      //console.info("==list", await userDAO.gets("rusgdbzzwK4UE"))
   }
   async function update() {
      const id = "ruttmwzzw4FVu";
      const sdata = new User({ title: "liguo", age: 31 });
      let nv = await userDAO.save(id, sdata);
      let en = await userDAO.get(id);
      console.info("update end", en, sdata, nv, sdata === nv);
   }
   //await save();
   await search();
   await update();
})();
