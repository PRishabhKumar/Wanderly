const cookieParser = require("cookie-parser")

const express = require('express')

const app = express()

app.use(cookieParser("secretCode"))

app.listen(5000, ()=>{
    console.log("Server is listening on port number 5000")
})

app.get("/",(req, res)=>{
    res.send("This is the home route !!!");
})

app.get("/getCookies", (req, res)=>{
    res.cookie("color", "blue");
    res.send("Cookies were sent successfully !!")
})

app.get("/verifyCookies", (req, res)=>{
    res.send(`These are the cookies : ${req.cookies}`)
    console.log(req.cookies);
})

app.get("/getSignedCookies", (req, res)=>{
    res.cookie("newColor", "yellow", {signed: true})
    res.send("Signed cookies were sent !!!")
})

app.get("/verifySignedCookies", (req, res)=>{
    console.log("These are the signed cookies : ", req.signedCookies);
    res.send("Signed cookies were also verified..")
})