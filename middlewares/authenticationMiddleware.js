let isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.desiredURL = req.originalUrl; // ✅ FIXED TYPO HERE
        req.flash("error", "You should be logged in to perform this operation");
        return res.redirect("/login");
    } else {
        next();
    }
};

let storeDesiredURL = (req, res, next) => {
    if (req.session.desiredURL) {
        res.locals.desiredURL = req.session.desiredURL;
        delete req.session.desiredURL; // optional: clear it after use
    }
    next();
};

module.exports = { isAuthenticated, storeDesiredURL };
