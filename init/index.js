// This contains the complete database initialization code

const mongoose = require('mongoose');
const Listing = require("../models/listings.js"); // ✅ FIXED
const data = require("./data.js");

const url = "mongodb://127.0.0.1:27017/wanderly";

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


const initializeDatabase = async ()=>{
    // first we will clean any uneccessary data from the database
    Listing.deleteMany({})
    .then(async (res)=>{
        console.log("Database cleaning completed !!!")
        console.log(res)
        await Listing.insertMany(data.data)
        .then((res)=>{
            console.log("Sample data insertion completed !!!!")
            console.log(res)
        })
        .catch((err)=>{
            console.log(`The sample data could not be inserted due to this error : ${err}`)
        })
    })
    .catch((err)=>{
        console.log(`Database could not be cleaned due to this error : ${err}`)
    })
}


initializeDatabase()