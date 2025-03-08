module.exports = (req,res,next)=>{
    if (!req.isAuthenticated()) {
        req.flash("error","please login first");
        return res.redirect("/showlist")
    }
    next();
}