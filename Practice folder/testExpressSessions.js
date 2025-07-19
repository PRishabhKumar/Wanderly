const express = require('express')
const expressSession = require('express-session')
const flash = require('connect-flash')
const path = require('path')

const app = express()
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use(expressSession({
    secret: "ThisIsMySecretKey",
    resave: false,
    saveUninitialized: true
}))
app.use(flash())

// ✅ Move this middleware BEFORE all routes
app.use((req, res, next) => {
    res.locals.successMessage = req.flash("success");
    res.locals.errorMessage = req.flash("error");
    next();
});

app.listen(5000, () => {
    console.log("Server is listening on port number 5000");
});

app.get("/getRequestCount", (req, res) => {
    if (req.session.count) {
        req.session.count++;
    } else {
        req.session.count = 1;
    }
    res.send(`You have sent a request to this page ${req.session.count} times`);
});

app.get("/register", (req, res) => {
    let { name = "Unknown Person" } = req.query;
    req.session.name = name;
    res.redirect("/hello");
});

app.get("/hello", (req, res) => {
    let name = req.session.name;
    if (name === "Unknown Person") {
        req.flash("error", "User was not registered due to anonymous name");
    } else {
        req.flash("success", "User registered successfully !!!");
    }
    res.render("page", { name });  // successMessage & errorMessage are now available
});

app.get("/", (req, res) => {
    res.send("This is the home page !!");
});
