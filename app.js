const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const Listing = require('./models/listings.js')
const Review = require("./models/reviews.js")
const User = require("./models/user.js")
const passport = require('passport')
const localStrategy = require('passport-local')
const ejsMate = require("ejs-mate")
const app = express()
const wrapAsync = require("./utils/wrapAsync.js")
const expressError = require("./utils/expressError")
const {listingSchema} = require("./schemaValidation.js")
const ExpressSession = require('express-session')
const flash = require('connect-flash')
const razorpay = require('razorpay')
const crypto = require('crypto')
require('dotenv').config()
app.set("view engine", "ejs")
app.engine("ejs", ejsMate) // using ejs mate 
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(methodOverride("_method"))

const sessionOptions = {
    secret: "MySecretKey",
    resave: false,
    saveUninitialized: true
}

app.use(ExpressSession(sessionOptions))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware for using flash using res.locals

app.use((req, res, next)=>{
    res.locals.success = req.flash("success")
    res.locals.failure = req.flash("error")
    next()
})

// connecting to the database
let mongooseUrl = "mongodb://127.0.0.1:27017/wanderly" 


createConnection()
.then((res)=>{
    console.log("Connected successfully with the database !!!")
})
.catch((err)=>{
    console.log(`This error occured in connecting with the database : ${err}`)
})

async function createConnection(){
    await mongoose.connect(mongooseUrl)
}



app.listen(5000, ()=>{
    console.log("The server is now ready and is listening for requests or port number : 5000")
})

app.get("/", (req, res)=>{
    res.render("home", {title: "Wanderly-Home"})
})

// Route to render the form to sign up user

app.get("/signup", (req, res)=>{
    res.render("signup", {title: "SignUp", styles:["/css/signUpStyle.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"]})
})

// Route to save user data to database

app.post("/signup", async (req,res)=>{
    try{
        let {email, username, password} = req.body
        let newUser= new User({
            email,
            username
        })
        const registeredUser = await User.register(newUser, password) // this is a static method provided by passport
        console.log(registeredUser)
        req.flash("success", "User registered successfully. Welcome to Wanderly !!!")
        res.redirect("/listings")
    }
    catch(e){
        req.flash("error", "A user with any one of these credentials already exists !!!")
        res.redirect("/signup")
    }
})


// Route to render the login form

app.get("/login", (req, res)=>{
    res.render("login", {title: "LogIn to Wanderly", styles: ["/css/loginStyle.css", ""]})
})

// Route to authenticate user

app.post("/login", passport.authenticate("local", {failureRedirect: "/login", failureFlash: true}), async (req, res)=>{
    req.flash("success", "Login Successfull !! Welcome back to Wanderly !!!")
    res.redirect("/listings")
})

// Route to display all listings

app.get("/listings", wrapAsync(async (req, res, next)=>{
    let listings = await Listing.find()      
    res.render("allListings", {listings, title: "Wanderly-All Stays", styles: ["/css/allListingsStyle.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"]}) // here we are passing the page specific title and stylesheet so that it can be applied to that page only while the common styles will apply to all the pages
}))

// Route to book a stay

app.get("/listings/:id/book", wrapAsync(async (req, res)=>{
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        throw new expressError(404, "Listing not found");
    }
    res.render("bookStay", {
        title: "Book your stay",
        styles: ["/css/bookStayStyle.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"],
        listing,
        hideOverlay: true
    });
}));

// Route to parse data from booking form

app.post("/listings/:id/book", wrapAsync(async (req, res)=>{
    let id = req.params['id'];
    let listing = await Listing.findById(id);
    let {passengers} = req.body // get all the parents details in the form of an array
    console.log(passengers)
    res.render("showPassengerDetails", {title: "Verify passenger details", listing, passengers, styles: ["/css/showPassengerDetailsStyle.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"], hideOverlay: true});


}))

// Route to create an order

app.post("/listings/:id/book/create-order", wrapAsync(async (req, res) => {
    let id = req.params['id']
    let listing = await Listing.findById(id);
    const price = listing.price*100;
    const instance = new razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
        amount: price, 
        currency: "INR",
        receipt: "order_rcptid_11",
    };

    const order = await instance.orders.create(options);
    res.json(order); // returns { id, amount, currency, etc. }
}));

// Route to load the payments page

app.get("/listings/:id/book/pay", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    res.render("payments", {
        styles: ["/css/paymentsStyle.css"],
        hideOverlay: true,
        title: "Pay securely with RazorPay",
        listing,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        user: {
            username: "Test User",
            email: "test@example.com"
        }
    });
}));


// Route for payment verification

app.post("/verify-payment", (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body;

    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        //  Payment is verified
        console.log("Payment verified successfully");
        res.json({ status: "success" });
    } else {
        //  Payment verification failed
        console.log("Payment verification failed");
        res.status(400).json({ status: "failure" });
    }
});



// Route to render the form to create a new listing

app.get("/listings/new", (req, res)=>{
    res.render("addListing", {title: "List your property", styles: [
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css",
        "/css/addListingStyle.css"        
    ]})
})

// Route to actually parse the entered data and then add it to the database

app.post("/listings", wrapAsync(async (req, res, next) => {
    let { title, description, location, country, price, image } = req.body;

    let imageURL = (image && image.url && image.url.trim() !== "")
        ? image.url
        : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267";

    const listingData = {
        title,
        description,
        location,
        country,
        price,
        image: { url: imageURL }        
    };

    const validationResult = listingSchema.validate({ listing: listingData });
    if (validationResult.error) {
        throw new expressError(400, validationResult.error);
    }

    const newListing = new Listing(listingData);
    await newListing.save();  
    req.flash("success", "Your proprty was added succesfully to Wanderly !!!");
    res.redirect(`/listings`)
}));


// Route to display the details about a specific stay

app.get("/listings/:id", wrapAsync(async (req, res, next)=>{
    let id = req.params['id']
    let listing = await Listing.findById(id)
    if(!listing){
        req.flash("error", "The property you are trying to access was either deleted or there was some error in fetching it")
        res.redirect(`/listings`)
    }       
    else{
        res.render("showStay", {listing, title: `Explore : ${listing.title}` ,styles: ["/css/showStayStyle.css"], hideOverlay: false})
    }
}))


// Route to edit a listing

app.get("/listings/:id/edit", wrapAsync(async (req, res, next)=>{
    let id = req.params['id']
    let listing = await Listing.findById(id)   
    if(!listing){
        req.flash("error", "Listing not found !!!")
        res.redirect(`/listings`)
    }
    else{
        res.render("editStay", {
        listing,
        title: "Edit property details",
        styles: [
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css",
            "/css/editStayStyle.css"        
        ]
    })
    }
}))


// PATCH request for changing the details

app.patch("/listings/:id", wrapAsync(async (req, res, next)=>{
    let id = req.params['id'];
    let {title, description, location, country, price, image} = req.body // get the new details from the submitted form
    let post =  await Listing.findByIdAndUpdate(id, {title: title, description:description, location:location, country:country, price: price, 'image.url': image})    
    req.flash("success", "Property details edited successfully !!");   
    res.redirect(`/listings/${id}`)
}))

// route to delete a listing

app.delete("/listings/:id", wrapAsync(async (req, res, next)=>{
    let id = req.params['id'];
    await Listing.findByIdAndDelete(id)    
    req.flash("success", "Property deleted successfully !!!");    
    res.redirect(`/listings`)    
}))


// Route to see all reviews

app.get("/listings/:id/reviews", async(req, res)=>{
    let id = req.params['id']
    let listing = await Listing.findById(id).populate("reviews") // this population here gives us access to the full review object and not just the ObjectId() format
    if(!listing){
        req.flash("error", "There was some error in finding the listing you are looking for")
        res.redirect(`/listings/${id}`)
    }
    else{
        let reviews = listing.reviews //get the reviews array
        res.render("viewReviews", {reviews, listing, title: "See reivews", 
        styles: [
            "/css/viewReviewsStyle.css",
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"
        ],
        hideOverlay: true
    })
    }
})


// Route to render the review form

app.get("/listings/:id/reviews/new", wrapAsync(async(req, res)=>{
    let id = req.params['id']
    let listing = await Listing.findById(id)
    if(!listing){
        req.flash("error", "There was some error in finding the listing you are looking for")
        res.redirect(`/listings/${id}/reviews`)
    }
    else{
        res.render("addReviewForm", {listing, 
        title: "Add a review",
        styles: [
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css",
            "/css/addReviewFormStyle.css",            
        ],
        hideOverlay: true
    })
    }
}))


// route to handle post request to add the review

app.post("/listings/:id/reviews", wrapAsync(async (req, res)=>{
    let id = req.params['id']
    let {message, rating} = req.body
    let review = new Review({
        content: message,
        rating: rating,
        createdAt: Date.now()
    })
    let listing = await Listing.findById(id)
    if(!listing){
        req.flash("error", "There was some error in fetching the listing you are looking for....")
        res.redirect(`/listings/${id}/reviews`)
    }
    else{
        await review.save()    
        listing.reviews.push(review._id)
        await listing.save() // this is important because every time we make a change to a document, we need to save it again for the changes to be visible 
        
        console.log(await Listing.findById(id).populate("reviews"))
        req.flash("success", "Your review was added successfully !!!");
        res.redirect(`/listings/${id}/reviews`)
    }
    
}))


// Route to view a review

app.get("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res)=>{
    let {id, reviewId} = req.params
    let listing = await Listing.findById(id)
    if(!listing){
        req.flash("error", "There was some error in fetching the listing you are looking for.....")
        res.redirect(`/listings/${id}/reviews`)
    }
    else{
        let review = await Review.findById(reviewId)
        if(!review){
            req.flash("error", "Either this review was deleted or there was some error fetching it...")
        }
        else{
            res.render("showReview", {listing, review, 
            title: `${listing.title} - Reivew`, 
            styles: [
            "/css/showReviewStyle.css", 
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"
        ],
        hideOverlay: true})
        }
        
    }
}))


// Route to render the form to edit a review

app.get("/listings/:id/reviews/:reviewId/edit", wrapAsync(async (req, res)=>{
    let {id, reviewId} = req.params
    let listing = await Listing.findById(id)
    if(!listing){
        req.flash("error", "There was error in fetching the listing you are looking for at the moment !!!")
        res.redirect(`/listings/${id}/reviews/${reviewId}`)
    }
    else{
        let review = await Review.findById(reviewId)
        res.render("editReviewForm", {listing, review, 
        title: "Edit review", 
        styles: [
            "/css/edtiReviewFormStyle.css",
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"
        ],
        hideOverlay: true
    })
    }
    
}))

// Route to actually parse the data sent through the form

app.patch("/listings/:id/reviews/:reviewId", wrapAsync(async(req, res)=>{
    let {id, reviewId} = req.params
    let {message, rating} = req.body
    await Review.findByIdAndUpdate(reviewId, {
        content: message,
        rating: rating
    })
    req.flash("success", "Changes saved successfully !!");
    res.redirect(`/listings/${id}/reviews/${reviewId}`)
}))

// Route to delete a review

app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res)=>{
    let {id, reviewId} = req.params
    let listing = await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}}) // this pull operator removes all instances of a value from an array that matches a specific condition. Here in this case, we are removing that review from the reviews array of the listing whose Id matches with the given ID
    await Review.findByIdAndDelete(reviewId)
    req.flash("success", "Review deleted successfully !!!");
    res.redirect(`/listings/${id}/reviews`)
}))


// Error handling middleware

app.use((err, req, res, next)=>{
    let {status = 500, message = "Internal Server Error"} = err;
    res.status(status).send(`<h3>Something went wrong !!!</h3><br><p>Error ${status}: ${message}</p>`)
})