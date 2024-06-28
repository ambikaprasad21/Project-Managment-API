const mongoose = require("mongoose");

const connectDB = function () {
  let db =
    process.env.NODE_ENV == "development"
      ? process.env.LOCAL_DB_URL
      : process.env.MONGO_URL;

  mongoose
    .connect(db)
    .then(() => console.log("Database connect successfully 🛜"));
};
module.exports = connectDB;
