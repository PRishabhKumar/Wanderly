const mongoose = require('mongoose')


let reviewSchema = mongoose.Schema({
    content: {
        type: String,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now() // set the current date and time in case nothing is explicitly provided
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

let Review = new mongoose.model("Review", reviewSchema)

module.exports = Review;