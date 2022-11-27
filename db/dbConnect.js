const mongoose = require("mongoose");
require("dotenv").config();

async function dbConnect() {
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log("Successfully connected");
    })
    .catch((err) => {
      console.log("Could not connect");
      console.log(err);
    });
}

module.exports = dbConnect;
