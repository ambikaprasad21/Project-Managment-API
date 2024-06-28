const app = require("./app");
const connectDB = require("./utils/connectDB");

connectDB();

const port = process.env.PORT || 5000;
app.listen(process.env.PORT, () => {
  console.log(`Server 🌐 running on port ${port}`);
});
