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
         title: "zhougo",
         age: 28,
         addr: 'sun fixed'
      });
      await userDAO.create(user);
      console.info("user", user);
   }
   async function search() {
      //let list = await userDAO.find({});
      let list = await userDAO.find({ index: { name: "com", fields: ["zhougo"] } });
      console.info("list", list);
      let en = await userDAO.get("ruse53zzwDdrX");
      console.info("en", en);
   }
   await save();
   search();
})();
