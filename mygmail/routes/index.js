var express = require("express");
const passport = require("passport");
const Users = require("./users");
const Mails = require("./mails");
const { populate } = require("./mails");
var router = express.Router();
const localStrategy = require("passport-local").Strategy;
const multer = require("multer");
passport.use(new localStrategy(Users.authenticate()));

function fileFilter (req, file, cb) {
// console.log(req.file)
 
  if(file.mimetype==='image/png' || file.mimetype==='image/jpeg' || file.mimetype==='image/webp '){
    cb(null,true);
  }else
  cb(null,false);
  console.log("other file")
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    const fn =
      Date.now() + Math.floor(Math.random * 100000) + file.originalname;
    cb(null, fn);
  },
});

const upload = multer({ storage: storage ,fileFilter:fileFilter});
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("login");
});

router.post("/postPhoto", isLoggedIn,upload.single('image'), function (req, res, next) {
  Users.findOne({username:req.session.passport.user})
  .then(function(ekuser){
    console.log(ekuser);
    ekuser.Image=`./images/uploads/${req.file.filename}`;
    ekuser.save()
    .then(function(uzer){
    res.redirect(req.headers.referer);
    })
  })
  
});


router.get("/sentmails", isLoggedIn, function (req, res, next) {
  Users.find({ username: req.session.passport.user })
    .populate({
      path: "sentMails", // populate mails
      populate: {
        path: "userid", // populate userid
      },
    })
    .then((data) => {
      // console.log(data.email);
      res.render("allmails", { data: data });
    });
});

router.get("/allusers", isLoggedIn, function (req, res, next) {
  res.render("alluser");
});

router.get("/compose", isLoggedIn, function (req, res, next) {
  res.render("compose");
});

router.post("/compose", isLoggedIn, async function (req, res, next) {
  const loggedInUser = await Users.findOne({
    username: req.session.passport.user,
  });

  // console.log("User Logged IN: " + loggedInUser);
  const createData = await Mails.create({
    userid: loggedInUser._id,
    receiver: req.body.jisko,
    mailtext: req.body.mailtext,
  });
  // console.log(loggedInUser._id)
  loggedInUser.sentMails.push(createData._id);
  await loggedInUser.save();

  const receiverUser = await Users.findOne({ receiver: req.body.jisko });
  // console.log(receiverUser._id);
  // console.log(receiverUser);
  receiverUser.receiveMails.push(createData._id);
  await receiverUser.save();

  res.redirect("/home");
});
//home route

router.get("/home", isLoggedIn, function (req, res, next) {
  res.render("home", { user: req.user });
  // res.send(req.session.passport.user);
});

//register route

router.get("/register", function (req, res, next) {
  res.render("register");
});

//login route

router.get("/login", function (req, res) {
  res.render("login");
});

//post register route

router.post("/register", function (req, res) {
  var newUser = new Users({
    username: req.body.username,
    email: req.body.email,
    Number: req.body.Number,
    gender: req.body.gender,
  });

  Users.register(newUser, req.body.password)
    .then(function (user) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("home");
        // console.log(user.username, user.email);
      });
    })
    .catch(function (err) {
      res.send(err.message);
    });
});

//post login route

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

//login middleware check route
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.send("You are not logged in");
}

//logout route

router.get("/logout", function (req, res) {
  req.logOut(function (err) {
    if (err) throw err;
    res.redirect("/login");
  });
});

module.exports = router;
