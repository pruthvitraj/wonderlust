const { log } = require("console");
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const path = require("path");
const showlist = require("./route/showlist");
const app = express();
const port = 1000;

const session = require("express-session");
const flash = require("connect-flash");
const accesslogin = require("./middelware");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const list = require("./new_data/schema");
const Review = require("./new_data/review");
const login = require("./new_data/login");
const reviews = require("./route/reviews");
const { name } = require("ejs");
const { fail } = require("assert");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session({
    secret: "somethingsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Change to `true` if using HTTPS
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(login.createStrategy());
passport.serializeUser(login.serializeUser());
passport.deserializeUser(login.deserializeUser());

app.use(flash());
app.use((req, res, next) => {
    res.locals.message = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.notlogin = req.flash("fail")
    if (req.isAuthenticated()) {
        console.log("Authenticated User:", req.user);
        res.locals.username = req.user.username;
    } else {
        res.locals.username = null;
    }
    next();
});
app.use("/showlist/:id", showlist);
app.use("/showlist/:id", reviews);

// connection of monogodb;
main().then(() => { console.log("connected successful to DB") }).catch(err => { console.log(err); })
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/showlist')
}

// creating function for error handling
function asyncwrap(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(err => {
            console.log(err);
        })
    }
}

// creating the requst 
app.post("/showlist", accesslogin, asyncwrap(async (req, res) => {
    const newlist = new list(req.body)
    await newlist.save();
    req.flash("success", "list created successfully")
    res.redirect("/showlist");

}))

// finding and showing the post
app.get("/showlist", asyncwrap(async (req, res) => {
    let alllist = await list.find({});
    console.log(res.locals.username);
    res.render("show.ejs", { alllist })
}))

// creating post
app.get("/createlist", (req, res) => {
    res.render("create.ejs")
})

// app.get("/setcookies", (req, res) => {
//     let {name ="patil"} = req.query;
//     console.log(name);
//     res.cookie("name", name,{signed:true});
//     // req.session.count=name;
//     // req.session.count= 0;
//     if(req.session.count){
//         req.session.count++;
//     }
//     else{
//         req.session.count=1;
//     }
//     // let a= req.session.count
//     res.send(req.session.count);
//     res.send(`Session count: ${req.session.count}`);
// })
// app.get("/getcookies",(req,res)=>{
//     let {name = "ananymous"} = req.cookies;
//     // console.dir(req.Cookies);

//     // res.send(req.Cookies);
//     req.flash("name","this the name is pruthviraj");
//     console.log(req.locals.message);
//     res.send("done");

// })

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
    res.render("register.ejs")
})
app.post("/register", asyncwrap(async (req, res, next) => {
    try {
        const { email, username, password } = req.body; // ✅ "username" must exist
        if (!username || !password) {
            return res.status(400).send("Username and password are required.");
        }
        var user = new login({ username, email });
        let newuser = await login.register(user, password);
        req.login(newuser, (err) => {
            if (err) {
                next(err);
            }
            else {
                req.flash("success", "You dairect logined");
                res.redirect("/showlist");
            }
        })
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
}))
app.get("/logout", (req, res, err) => {
    req.logOut((err) => {
        if (err) {
            return next(err)
        }
        else {
            req.flash("success", "The successfully logout from account");
            res.redirect("/showlist");
        }
    }
    )
})

app.post("/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: "Please enter the correct username and password!",
        failureFlash: true,
    }),
    async (req, res) => {
        res.redirect("/showlist")
    }
)


app.listen(port, () => {
    console.log(`file run in this ${port}`);
}) 