const { ref } = require('joi');
const mongoose = require('mongoose');
const Review = require("./reviews")
const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    filename: {
      type: String,    
    },
    url: {
      type: String,
      set: (v)=>{
        return v===""?"https://unsplash.com/photos/a-couple-of-people-standing-on-top-of-a-beach-near-the-ocean-PEbw_8qZXIc":v
      },
      default: "https://unsplash.com/photos/a-couple-of-people-standing-on-top-of-a-beach-near-the-ocean-PEbw_8qZXIc",
      required: true
    }
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});


// Here we are defining the post middleware for the findOneAndDelete() function. When we call the Listing.findByIdAndDelete() function through mongoose, this middleware will get triggered and then here we have the code to delete all of the reviews that are a part of the listing
listingSchema.post("findOneAndDelete", async (listing)=>{
  if(listing){
    await Review.deleteMany({_id: {$in: listing.reviews}}) // this deletes all the reviews that have ids which are a part of the listing's reviews array
  }
})

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
