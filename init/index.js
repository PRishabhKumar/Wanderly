// This contains the complete database initialization code

const mongoose = require("mongoose");
const Listing = require("../models/listings.js");
const data = require("./data.js");
const { object } = require("joi");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const url = process.env.CLOUD_MONGODB_DATABASE_LINK;

createConnection()
  .then(() => {
    console.log("Connected successfully with the database !!!!");
  })
  .catch((err) => {
    console.log(`This error occurred in connecting with the database : ${err}`);
  });

async function createConnection() {
  await mongoose.connect(url);
}

// adding the data to the database

const initializeDatabase = async () => {
  // first we will clean any uneccessary data from the database
  Listing.deleteMany({})
    .then(async (res) => {
      console.log("Database cleaning completed !!!");
      console.log(res);
      data.data = data.data.map((obj) => ({
        ...obj,
        owner: "687bd6c3ef91023c18399449",
      }));
      await Listing.insertMany(data.data)
        .then((res) => {
          console.log("Sample data insertion completed !!!!");
          console.log(res);
        })
        .catch((err) => {
          console.log(
            `The sample data could not be inserted due to this error : ${err}`
          );
        });
    })
    .catch((err) => {
      console.log(`Database could not be cleaned due to this error : ${err}`);
    });
};

initializeDatabase();
