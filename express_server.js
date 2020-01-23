const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const { generateRandomString, emailHelper, urlsForUser } = require("./helper")
//
app.use(cookieSession({
  name: 'session',
  keys: ["key1"]}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
//
const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"
};
//
const users = {
};
//
app.get("/", (req, res) => {
  res.send("youre in the root!");
});

//RENDERS

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.session.user_id]}
  res.render("urls_login", templateVars)
});

app.get("/register", (req, res)=> {
   let templateVars = {user: users[req.session.user_id]};
   res.render("urls_register", templateVars)
 });

 app.get("/urls/error", (req, res) => {
   res.redirect("/urls/error");
 });

app.get("/urls/new", (req,res) => {
  if(!(users[req.session.user_id])) {
    res.redirect("/login")
  }
  let templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  
  let templateVars = {
    shortURL: req.params.shortURL ,
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars)
});

 app.get("/urls",(req, res) => {

    let templateVars = {
    urls: urlsForUser(urlDatabase, req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render("urls_index",templateVars);
});
//RENDERS END
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});
 // GETS END

 // POSTS START
app.post("/register", (req, res) => {
const id = generateRandomString();
const {email, password } = req.body;
const hashedPassword = bcrypt.hashSync(password, 10)
const user = emailHelper(email, users);

//
if(email.length === 0 || password.length === 0) {
let templateVars = {
  user: emailHelper(email, users),
  error: 403,
  message: "You've left the email or password field empty!"
}
res.status(403);
res.render("urls_error", templateVars)
}
//
users[id] = {id, email, hashedPassword};
//
  if (email === user.email) {
    let templateVars = {
    user: emailHelper(email, users),
    error: 400,
    message: "That email already exists!"
    }
    res.status(400);
    res.render("urls_error", templateVars);
    }
//
req.session.user_id = id;
//res.cookie("user_id", id);
res.redirect("/urls")
});
//

///////// app.post("/urls/:shortURL/update", (req, res) => {
/////////   urlDatabase[req.params.shortURL] = {longURL : req.body.newURL, userID : req.params.id}
/////////   //urlDatabase[req.params.shortURL] = req.body.newURL;
/////////   res.redirect("/urls",)
///////// });
app.post("/logout" , (req, res) => {
  req.session = null;
  res.redirect("/urls")
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  let user = emailHelper(email, users);
  if(user) {

    if(bcrypt.compareSync(password, user.hashedPassword)) {
      req.session.user_id = user.id;
      return res.redirect("/urls");

    } else {
      let templateVars = {
        user,
        error: 400,
        message: "Your password is incorrect!"
      }
      res.status(400);
      res.render("urls_error", templateVars);
    }
  } else {
    let templateVars = {
      user,
      error: 400,
      message: "That email account doesn't exist!"
    }
     res.status(400);
     res.render("urls_error", templateVars);
  }

});

app.post("/urls/:shortURL/delete", (req, res) => {
  const newObject = urlsForUser(urlDatabase, req.session.user_id)
  if(!(req.params.shortURL in newObject)) {
    res.redirect("/urls");
  }
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls/");
})
app.post("/urls", (req, res ) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL : req.body.longURL,
    userID : req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});
app.post("/urls/:id", (req, res) => { 

  const newObject = urlsForUser(urlDatabase, req.session.user_id)
   if(!(req.params.id in newObject)) {
     let templateVars = {
       message: "You need to be logged in and visiting your own URLS to edit them",
       error: 401,
       user: users[req.session.user_id]
     }
     res.status(401);
     res.render("urls_error", templateVars);
   }

  urlDatabase[req.params.id]["longURL"] = req.body.newURL;
  res.redirect("/urls")
});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

