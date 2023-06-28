//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const port = 3000;
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;


// const bcrypt = require('bcryptjs');
// const salt = bcrypt.genSaltSync(10);
 
const app = express();
 
console.log(process.env.API_KEY);

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
 app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser:true});

const userSchema = new mongoose.Schema({
email:String,
password:String,
googleId:String,
secret:String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
 
passport.deserializeUser(function(user, done) {
    done(null, user);
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",

  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({ googleId: profile.id }).then((foundUser) => {
        if (foundUser) {
          return foundUser;
        } else {
          const newUser = new User({
            googleId: profile.id
          });
          return newUser.save();
        }
      }).then((user) => {
        return cb(null, user);
      }).catch((err) => {
        return cb(err);
      });
  }
));


 app.get("/", (req, res) => {
    res.render("home");
 });

 app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

 app.get("/auth/google/secrets", 
 passport.authenticate("google", { failureRedirect: "/login" }),
 function(req, res) {
   res.redirect("/secrets");
 });

 app.get("/login", (req, res) => {
    res.render("login", {errMsg: "", username: "", password: ""});
 });

 app.get("/register", (req, res) => {
    res.render("register");
 });

 app.get("/secrets", function(req, res) {
 
    User.find({"secret": {$ne: null}})
    .then(function(foundUser){
        if(foundUser){

    res.render("secrets", {usersWithSecrets: foundUser});
    

}
})
.catch(function(err){
    console.log(err);
})


    /*
    Course code was allowing the user to go back to the secrets page after loggin out,
    that is because when we access a page, it is cached by the browser, so when the user is accessing a cached page (like the secrets one)
    you can go back by pressing the back button on the browser, the code to fix it is the one below so the page will not be cached
    */
   
   
    // res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal   e=0, post-check=0, pre-check=0');
   
    /*
    Check if the user is authenticated and this is where we are relying on
    passport.js, session, passport-local and passport-local-mongoose to make sure
    that if the user is already logged in then we should simply render the secrets page
    but if the user is not logged in then we are going to redirect the user to the login page
    */
    // if (req.isAuthenticated()) {
    //   res.render("secrets");
    // } else {
    //   res.redirect("/login");
    // }
  });

app.get("/submit", function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit");
      } else {
        res.redirect("/login");
      }
    });

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    User.findById(req.user._id)
        .then(function(foundUser){
            if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save().then (() => {
        res.redirect("/secrets");
        
        })
    }
    })
    .catch(function(err){
        console.log(err);
    })
    });




  app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

// app.post("/register",(req, res) => {

    app.post("/register", function(req, res) {
 
        //  Now we will incorporate hashing and salting and authentication using passport.js and the packages just added (passport passport-local passport-local-mongoose express-session)
       
        /*
        Tap into the User model and call the register method, this method comes from
        passport-local-mongoose package which will act as a middle-man to create and save the new user
        and to interact with mongoose directly
        js object -> {username: req.body.username}
        */
        User.register({
          username: req.body.username
        }, req.body.password, function(err, user) {
          if (err) {
            consolo.log(err);
            //Redirect the user back to the register page if there are any error
            res.redirect("/register");
          } else {
            /*
            Authentica the user using passport if there are no errors
            the callback (function()) below is only triggered if the authentication
            is successfull and we managed to successfully setup a cookie that saved
            their current logged in session
            */
            passport.authenticate("local")(req, res, function() {
              /*
              As we are authenticating the user and setting up a logged in session for him
              then the user can go directly to the secret page, they should automatically
              be able to view it if they are still logged in - so now we need to create a secrets route
              */
              res.redirect("/secrets");
            });
          }
        });
      });
       
      //POST request (login route) to login the user
       
      /*
      passport.authenticate("local")
      Course code was allowing the user to enter the right username (email) and wrong password
      and go to the secrets page by typing in http://localhost:3000/secrets in the browser after getting the Unauthorized page message,
      now the addition of passport.authenticate("local")to the app.post... route fixes this issue
      */
       
    // });
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // bcrypt.hash(req.body.password, salt, function(err, hash) {

    //     const newUser = new User ({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save().then(() => {
    //             res.render("secrets");
    //     }).catch((err) => {
    //             console.log(err);
    //      })
    // });


   


// app.post("/login", (req, res) => {

    app.post("/login", function(req, res) {
 
        //Now we will incorporate hashing and salting and authentication using passport.js and the packages just added (passport passport-local passport-local-mongoose express-session)
       
        //Create a new user from the mongoose model with its two properties (username, password)
        const user = new User({
          username: req.body.username,
          password: req.body.password
        });
       
        //Now use passport to login the user and authenticate him - take the user created from above
        req.login(user, function(err) {
          if (err) {
            console.log(err);
          } else {
            //Authenticate the user if there are no errors
            passport.authenticate("local")(req, res, function() {
              res.redirect("/secrets");
            });
          }
        });
});
       
      //Set up the server to listen to port 3000
      app.listen(3000, function() {
        console.log("Server started on port 3000!!!");
      });




















    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username})
    //     .then((foundUser) => {

    //                 if(bcrypt.compareSync(password, foundUser.password)){
    //                 res.render("secrets");
    //                 console.log("New login (" + username + ")")
    //                 }
    //                 else{
    //                     res.render("login", {errMsg: "Password incorrect", username: username, password: password});
    //                 }
                
             
                
    //     })
    //     .catch((err) => {
    //         res.render("login", {errMsg: "Email doesn't exist", username: username, password: password});
    //     })


