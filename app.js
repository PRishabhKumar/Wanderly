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
const {isAuthenticated, storeDesiredURL} = require('./middlewares/authenticationMiddleware')
const multer = require('multer')
if(process.env.NODE_ENV != "production"){
    require('dotenv').config()
}
app.set("view engine", "ejs")
app.engine("ejs", ejsMate) // using ejs mate 
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(methodOverride("_method"))

const {storage} = require('./cloudConfiguration.js')

// Initializing multer

const upload = multer({storage})

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
    res.locals.currentUser = req.user
    next()
})

// connecting to the database
// let mongooseUrl = "mongodb://127.0.0.1:27017/wanderly" 
let mongoDBCloudURL = process.env.CLOUD_MONGODB_DATABASE_LINK


createConnection()
.then((res)=>{
    console.log("Connected successfully with the database !!!")
})
.catch((err)=>{
    console.log(`This error occured in connecting with the database : ${err}`)
})

async function createConnection(){
    await mongoose.connect(mongoDBCloudURL)
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

app.post("/signup", async (req,res,next)=>{
    try{
        let {email, username, password} = req.body
        let newUser= new User({ email, username })
        const registeredUser = await User.register(newUser, password)
        console.log(registeredUser)        

        req.login(registeredUser, (err)=>{
            if(err) return next(err)
            
            req.flash("success", "User registered successfully. Welcome to Wanderly !!!")
            return res.redirect("/listings")
        })
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

app.post("/login", storeDesiredURL, passport.authenticate("local", {failureRedirect: "/login", failureFlash: true}), async (req, res)=>{
    req.flash("success", "Login Successfull !! Welcome back to Wanderly !!!")
    res.redirect(res.locals.desiredURL || "/listings")
})

// Route to logout user

app.get("/logout", isAuthenticated, (req, res)=>{
    req.logout((err)=>{
        if(err){
            return next(err)
        }
        else{
            req.flash("success", "You have been successfully logged off !!!")
            res.redirect("/")
        }
    })
})

// Route to display all listings

app.get("/listings", wrapAsync(async (req, res, next)=>{
    let listings = await Listing.find()      
    res.render("allListings", {listings, title: "Wanderly-All Stays", styles: ["/css/allListingsStyle.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"]}) // here we are passing the page specific title and stylesheet so that it can be applied to that page only while the common styles will apply to all the pages
}))

// Route to add GST to the listings
app.patch("/listings/updatePrice", wrapAsync(async (req, res) => {
    await Listing.updateMany({}, [
        { $set: { price: { $multiply: ["$price", 1.18] } } }
    ]); 
    alert("Prices updated to include taxes")    
}));

// Route to reset the prices
app.patch("/listings/revertPrice", wrapAsync(async (req, res) => {
    await Listing.updateMany({}, [
        { $set: { price: { $divide: ["$price", 1.18] } } }
    ]);
    alert("Prices reverted to taxless prices")
}));

// Route to book a stay

app.get("/listings/:id/book", isAuthenticated, wrapAsync(async (req, res)=>{
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

app.post("/listings/:id/book", isAuthenticated, wrapAsync(async (req, res)=>{
    let id = req.params['id'];
    let listing = await Listing.findById(id);
    let {passengers} = req.body // get all the parents details in the form of an array
    console.log(passengers)
    res.render("showPassengerDetails", {title: "Verify passenger details", listing, passengers, styles: ["/css/showPassengerDetailsStyle.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"], hideOverlay: true});


}))

// Route to create an order

app.post("/listings/:id/book/create-order", isAuthenticated, async (req, res) => {
    try {
        let id = req.params['id'];
        let listing = await Listing.findById(id);
        if (!listing) throw new Error("Listing not found");

        const price = listing.price * 100;
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
        res.json(order);
    } catch (err) {
        console.error("🔥 Razorpay Order Error:", err);
        res.status(500).json({ error: "Failed to create order", details: err.message });
        // ❌ avoid next(err) here unless you want to render error page
    }
});


// Route to load the payments page

app.get("/listings/:id/book/pay", isAuthenticated, wrapAsync(async (req, res) => {
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

app.post("/verify-payment", isAuthenticated, (req, res) => {
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

app.get("/listings/new", isAuthenticated, (req, res)=>{
    res.render("addListing", {title: "List your property", styles: [
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css",
        "/css/addListingStyle.css"        
    ]})
})

// Route to actually parse the entered data and then add it to the database

app.post("/listings", upload.single('image'), isAuthenticated, wrapAsync(async (req, res, next) => {
    const { title, description, location, country, price } = req.body;

    const imageURL = req.file?.path || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267";
    const imageFilename = req.file?.filename || "default";

    const listingData = {
        title,
        description,
        location,
        country,
        price,
        image: {
            url: imageURL,
            filename: imageFilename
        },
        owner: req.user._id
    };

    const newListing = new Listing(listingData);
    await newListing.save();
    req.flash("success", "Your property was added successfully to Wanderly!");
    res.redirect(`/listings`);
}));



// Route to display the details about a specific stay

app.get("/listings/:id", isAuthenticated, wrapAsync(async (req, res, next)=>{
    let id = req.params['id']
    let listing = await Listing.findById(id).populate("reviews").populate("owner")
    console.log(listing)
    if(!listing){
        req.flash("error", "The property you are trying to access was either deleted or there was some error in fetching it")
        res.redirect(`/listings`)
    }       
    else{
        res.render("showStay", {listing, title: `Explore : ${listing.title}` ,styles: ["/css/showStayStyle.css"], hideOverlay: false})
    }
}))


// Route to edit a listing

app.get("/listings/:id/edit", isAuthenticated, wrapAsync(async (req, res, next)=>{
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

app.patch("/listings/:id", upload.single('image'), isAuthenticated, wrapAsync(async (req, res, next)=>{
    let id = req.params['id'];
    let {title, description, location, country, price} = req.body // get the new details from the submitted form
    let listing = await Listing.findById(id);
    const imageURL = req.file?.path || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267";
    const imageFilename = req.file?.filename || "default";
    if(listing.owner._id.toString() === req.user._id.toString()){
        const updatedListing = {
            title, 
            description,
            location,
            country,
            price
        }
        if(req.file){
            updatedListing.image = {
                url: req.file.path,
                filename : req.file.filename
            };
        }
        await Listing.findByIdAndUpdate(id, updatedListing)
        req.flash("success", "Property details edited successfully !!");   
        res.redirect(`/listings/${id}`)
    }
    else{
        req.flash("error", "You are not authorized to perform this operation...")
        res.redirect(`/listings/${id}`)
    }
    
}))

// route to delete a listing

app.delete("/listings/:id", isAuthenticated, wrapAsync(async (req, res, next)=>{
    let id = req.params['id'];
    await Listing.findByIdAndDelete(id)    
    req.flash("success", "Property deleted successfully !!!");    
    res.redirect(`/listings`)    
}))


// Route to see all reviews

app.get("/listings/:id/reviews", async (req, res) => {
    let id = req.params['id'];
    let listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "owner" } // populate owner inside each review
        })
        .populate("owner"); // populate the listing owner

    if (!listing) {
        req.flash("error", "There was some error in finding the listing you are looking for");
        return res.redirect(`/listings/${id}`);
    }

    let reviews = listing.reviews;
    res.render("viewReviews", {
        reviews,
        listing,
        title: "See reviews",
        styles: [
            "/css/viewReviewsStyle.css",
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"
        ],
        hideOverlay: true
    });
});



// Route to render the review form

app.get("/listings/:id/reviews/new", isAuthenticated, wrapAsync(async(req, res)=>{
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

app.post("/listings/:id/reviews", isAuthenticated, wrapAsync(async (req, res)=>{
    let id = req.params['id']
    let {message, rating} = req.body
    let review = new Review({
        content: message,
        rating: rating,
        createdAt: Date.now(),
        owner: req.user._id
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
        console.log(review)
        console.log(await Listing.findById(id).populate("reviews").populate("owner"))
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
        let review = await Review.findById(reviewId).populate("owner")
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

app.get("/listings/:id/reviews/:reviewId/edit", isAuthenticated, wrapAsync(async (req, res)=>{
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

app.patch("/listings/:id/reviews/:reviewId", isAuthenticated, wrapAsync(async(req, res)=>{
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

app.delete("/listings/:id/reviews/:reviewId", isAuthenticated, wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    const review = await Review.findById(reviewId); 
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}/reviews`);
    }

    if (review.owner._id.toString() === req.user._id.toString()) {
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        req.flash("success", "Review deleted successfully !!!");
        res.redirect(`/listings/${id}/reviews`);
    } else {
        req.flash("error", "Unauthorized action not allowed");
        res.redirect(`/listings/${id}/reviews`);
    }
}));



// Error handling middleware

app.use((err, req, res, next)=>{
    let {status = 500, message = "Internal Server Error"} = err;
    res.status(status).send(`<h3>Something went wrong !!!</h3><br><p>Error ${status}: ${message}</p>`)
})