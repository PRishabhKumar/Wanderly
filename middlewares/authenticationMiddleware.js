let isAuthenticated = (req, res, next)=>{
    if(!req.isAuthenticated()){
        req.flash("error", "You should be logged in to perform this operation")
        res.redirect("/login")
    }
    else{
        next()
    }
}

module.exports = {isAuthenticated}