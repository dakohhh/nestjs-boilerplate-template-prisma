// import mongoose from "mongoose";

// // Disable automatic population globally that sherriff caused
// mongoose.Query.prototype.populate = function (this: mongoose.Query<any, any>, ...args: any[]) {
//   if (this.getOptions()?.skipPopulate !== false) {
//     return this;
//   }
//   return mongoose.Query.prototype.populate.apply(this, args);
// };
