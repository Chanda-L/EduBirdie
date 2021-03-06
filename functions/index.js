//Imports into firebase project
var alert = require("alert-node");
var express = require("express");
var expressHbs = require("express-handlebars");
var bodyParser = require("body-parser");
var firebase = require("firebase");
var flash = require("express-flash-messages");
var admin = require("firebase-admin");
var path = require("path");
var gcloud = require("@google-cloud/storage");
var nodemailer = require("nodemailer");
var url = require("url");
var functions = require("firebase-functions");

/* eslint-disable consistent-return */
/* eslint-disable no-path-concat */
/* eslint-disable no-irregular-whitespace */
/* eslint-disable promise/always-return */
/* eslint-disable promise/no-nesting */

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const app = express();

//----- Keep Database Queries shallow
//----- Avoid increase in payment from nested data
//----- Sync authentication wit h database data
//----- Keep Storage low to not use to much and overload storage


var config = {
  apiKey: "AIzaSyAJ4JH6ULCvmsxtaPRbNaUBeoAGIag7oMg",
  authDomain: "edueezi.firebaseapp.com",
  databaseURL: "https://edueezi.firebaseio.com",
  projectId: "edueezi",
  storageBucket: "edueezi.appspot.com",
  messagingSenderId: "450061088039"
};
firebase.initializeApp(config);

var firebaseApp = admin.initializeApp(functions.config().firebase);

let db = firebaseApp.firestore();
const settings = { /* your settings... */ timestampsInSnapshots: true };
db.settings(settings);
console.log("hi");
app.use(flash());

// Since this is the last non-error-handling
// middleware use()d, we assume 404, as nothing else
// responded.

// $ curl http://localhost:3000/notfound
// $ curl http://localhost:3000/notfound -H "Accept: application/json"
// $ curl http://localhost:3000/notfound -H "Accept: text/plain"
// app.set("views", './views')

app.use(express.static(__dirname + "public"));
app.engine(
  "hbs",
  expressHbs({
    extname: "hbs",
    layoutsDir: __dirname + "/views/layouts/",
    partialsDir: __dirname + "/views/partials/"
  })
);
app.set("view engine", "hbs");
app.use(bodyParser.urlencoded({ extended: false }));

//Return all routes for application
app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

//Configure and connect to firebase backend

function sendMailThroughApp(email, password, html) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: "Bangweulu3"
    }
  });

  const mailOptions = {
    from: "chanda.lupambo@gmail.com",
    to: email,
    subject: "Welcome Back!",
    html: html
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log(err);
    else console.log(info);
  });
}

// function checkIfUserIsSignedIn(filename) {
//   firebase.auth().onAuthStateChanged(user => {
//     if (user) {
//       // User is signed in.
//       console.log("you are already logged in :)");
//       res.redirect("/home");
//     } else {
//       // No user is signed in.
//       console.log(firebase.auth().currentUser);
//       console.log("User is null");
//       res.render(filename);
//     }
//   });
// }

//DefaultFirebaseApp Initialization for WebApp:
//Listen for port on application localhost server
app.listen(3000, () => {
  console.log("Running on: localhost:3000");
  console.log("port = 3000, server = localhost;");
});


app.get("/school.edu-eezi/introduction", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./MainFolders/introduction_schools", {authed: true});
    } else {
      return res.render("./MainFolders/introduction_schools" ,{authed: false});
    } 
    
  });
 
});

app.get("/Introduction/", (req, res) => {
  res.render("./MainFolders/introduction");
});

app.get("/", (req, res) => {
  let lessons = [];
  let users = [];
  let educator;
  let search = req.query.search;

  // firebase.auth().onAuthStateChanged(user => {
  console.log("something");
  if (firebase.auth().currentUser !== null) {
    db.collection("users")
      .doc(firebase.auth().currentUser.uid)
      .get()
      .then(doc => {
        if (doc.exists) {
          if (doc.data().educator === true) {
            console.log("educator is true");
            educator = true;
          } else {
            console.log("educator is false");
          }
        } else {
          //The document does not exist
        }
      })
      .catch(err => {
        //An error has occured in the application
        console.log(err);
      });

    //Get all the lessons that'll be represented on the home screen
    db.collection("lessons")
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          lessons.push(doc.data());
        });
        console.log("User educator variable: " + educator);
        return res.render("./MainFolders/home", {
          lessons: lessons,
          user: firebase.auth().currentUser,
          user_id: firebase.auth().currentUser.uid,
          searchedUsers: users,
          educator: educator
        });
      })
      .catch(error => {
        console.log(error.message);
      });
  } else {
    //User isn't authenticated
    return res.redirect("/Introduction/");
  }
});
//New authentication file to authenticate users
//Main application authentication folder
//Power authentcation in app with: SignUp, SignIn, and email verification

app.post("/Authenticate/signIn", (req, res) => {
  firebase
    .auth()
    .signInWithEmailAndPassword(req.body.email_in, req.body.password_in)
    .then(firebaseUser => {
      console.log("Successfully Signed In!");
      console.log(firebaseUser.email);

      //Send a success email to user!
      // if (firebase.auth().currentUser.emailVerified === true) {
      //   //User is verified and can proceed to home page
      //   console.log("Verified")

      // } else {
      //   //User is not verified
      //   //Send verification email
      //   console.log("Not verified")
      //   return res.redirect("/authenticate/email_verify");
      // }
      return res.redirect("/");
    })
    .catch(error => {
      console.log(error.message);
    });
});

app.post("/Authenticate/signUp", (req, res) => {
  let username, email, password, birthdate;

  username = req.body.First_name + " " + req.body.Last_name;
  FirstName = req.body.First_name;
  LastName = req.body.Last_name;
  email = req.body.email;
  password = req.body.password;
  birthdate = req.body.birthdate;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(firebaseUser => {
      //Add User data into database after authentication:
      var docref = db.collection("users").doc(firebase.auth().currentUser.uid);

      docref
        .set({
          name: username,
          first_name: FirstName,
          last_name: LastName,
          email: email,
          password: password,
          birthdate: birthdate,
          user_id: firebase.auth().currentUser.uid
        })
        // eslint-disable-next-line promise/always-return
        .then(() => {
          //Add An Alert notifying user they have been authenticated
          //redirect if user is verified
          return res.redirect("/");
        })
        .catch(error => {
          //Handle the authentication error
          console.log(
            "There seems to be an error with the user authentication!"
          );
          console.log(error.message);
          throw new Error(error.message);
        });
    })
    .catch(error => {
      //all error codes
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log("error" + errorMessage);
      console.log("code" + errorCode);

      //Send the error message to the client side
      // return res.send(
      //   '<h1 style="text-align: center; font-family: sans-serif; font-weight: bold; color: green;">' +
      //     errorMessage +
      //     '</h1><a href="/authenticate/sign_up" style="text-decoration: none;  color: green; text-align: center; font-family: sans-serif;" class="btn">Go Back</a> '
      // );
    });
});

app.get("/authenticate/log_out", (req, res) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      //render log out page
      return res.render("./AuthFolders/logOut");
    })
    .catch(error => {
      //log out the error message
      console.log(error.message);

      //Send error message to user that log in was unsuccessful
      return res.send(
        "<h1>There was an error logging you out</h1>" +
          "<h4>" +
          error.message +
          "</h4>"
      );
    });
});
//School Info Get Route:
//School Info school_id params
app.get("/school_intro/getting_start", (req, res) => {
  let userAuth;
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      userAuth = true;
      return res.render("./AuthFolders/SchoolIntro", { user_auth: userAuth });
    } else {
      userAuth = false;
      return res.render("./AuthFolders/SchoolIntro", { user_auth: userAuth });
    }
  });
});

app.get("/school/main/info/:school_id", (req, res) => {
  let SchoolData;
  let messages = [];
  let classes = [];
  let members = [];
  let lessons = [];
  let admin;

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      console.log(req.params.school_id);

      db.collection("schools")
        .doc(req.params.school_id)
        .get()
        .then(doc => {
          if (doc.data().admin === user.uid) {
            console.log("This user is the admin");
            admin = true;
            return admin;
          } else {
            console.log("This user is not an admin");
            admin = false;
            return admin;
          }
        })
        .catch(error => {
          console.log("There was a database error");
          console.log(error.message);
        });

      //Get classses for school
      db.collection("classes")
        .where("belongs_to", "==", req.params.school_id)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            classes.push(doc.data());
          });
          return classes;
        })
        .catch(error => {
          console.log(error.message);
          return error.message;
        });
      //Get the specific school to view.
      db.collection("schools")
        .doc(req.params.school_id)
        .collection("members")
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            //Add members into members array
            members.push(doc.data());
          });
        })
        .catch(error => {
          console.log(error.message);
        });
      db.collection("users")
        .doc(user.uid)
        .collection("school")
        .doc(req.params.school_id)
        .collection("messages")
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            messages.push(doc.data());
            console.log("message added");
          });
          return messages;
        })
        .catch(error => {
          throw new Error("class does not exist");
        });
      db.collection("schools")
        .doc(req.params.school_id)
        .get()
        .then(doc => {
          if (doc.exists) {
            console.table("Document data: ", doc.data());
            SchoolData = doc.data();
            console.table(SchoolData);
            console.table(messages);
            let schoolCode = req.params.school_id;

            //Res.render the context and yourSchool.hbs
            return res.render("./AuthFolders/yourSchool", {
              is_admin: admin,
              SchoolData: SchoolData,
              messages: messages,
              classes: classes,
              members: members,
              SchoolCode: schoolCode,
              user_id: user.uid
            });
          } else {
            console.log("No document exists!");
            return "no document exists";
          }
        })
        .catch(error => {
          console.log(error.message);
        });
    } else {
      console.log("Not logged in!");
      //Redirect to authentication page if user isn't authenticated
      return res.redirect("/authenticate/sign_in");
    }
  });
});

app.post("/school/main/info/:school_id/add_class", (req, res) => {
  //Firebase database functions for add class

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      let text = "";
      let possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < 20; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      let classRef = db.collection("classes").doc(text);

      classRef
        .set({
          name: req.body.ClassName,
          code: text,
          belongs_to: req.params.school_id
          // eslint-disable-next-line promise/always-return
        })
        .then(() => {
          res.redirect("/school/main/info/" + req.params.school_id);
        })
        .catch(error => {
          console.log(error.message);
        });
    } else {
      res.redirect("/authenticate/sign_up");
    }
  });
});
app.post("/school/main/info/:school_id/message_sent", (req, res) => {
  //Do the firebase database functions:

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      let messageRef = db
        .collection("users")
        .doc(user.uid)
        .collection("school")
        .doc(req.params.school_id)
        .collection("messages")
        .doc(req.body.message);

      messageRef
        .set({
          message: req.body.message,
          by: user.email
        })
        .then(() => {
          console.log("add has been a success");

          res.redirect("/school/main/info/" + req.params.school_id);
        })
        .catch(error => {
          console.log(error.message);
        });
    }
  });
});
app.get("/profile/:user_id", (req, res) => {
  let databaseData = [];

  let databaseCode;
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      db.collection("schools")
        .where("admin", "==", user.uid)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            // doc.data() is never undefined for query doc snapshots
            databaseData.push(doc.data());
            databaseCode = doc.data().secretSchoolCode;

            console.table(databaseData);
          });
          res.render("./AuthFolders/profile", {
            databaseCode: databaseCode,
            databaseData: databaseData,
            user: firebase.auth().currentUser
          });
        })
        .catch(error => {
          console.log(error.message);
        });
    } else {
      return res.redirect("/authenticate/sign_up");
    }
  });
  console.log("hello");
});

app.get("/authenticated/create/create_school", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      res.render("./MainFolders/create_school");
    } else {
      console.log("Not ALLLLOOOOWWWWEEEED");
    }
  });
});

app.post("/authenticated/create/create_school/", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      let schoolName, schoolDesc;
      let text = "";
      let possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      schoolName = req.body.schoolName;
      schoolDesc = req.body.schoolDescription;

      //add school document in collection of schools to firebase database
      var documentRef = db.collection("schools").doc(text);

      documentRef.set({
        name: schoolName,
        description: schoolDesc,
        secretSchoolCode: text,
        admin: user.uid
      });

      res.redirect("/profile");
    } else {
      res.redirect("/authenticate/sign_up");
    }
  });
});

app.get("/class/main/info/:school_id/:class_id/add_lesson", (req, res) => {
  let databaseData;
  let schoolOptions = [];
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      db.collection("schools")
        .where("admin", "==", user.uid)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            if (doc.exists) {
              schoolOptions.push(doc.data());
            }
          });
        })
        .catch(error => {
          console.log(error.message);
        });

      db.collection("classes")
        .doc(req.params.class_id)
        .get()
        .then(doc => {
          if (doc.exists) {
            console.log("document exists");
            databaseData = doc.data();

            //Render with context
            res.render("./MainFolders/Class", {
              id: user.uid,
              data: databaseData,
              user_id: user.uid,
              schoolOptions: schoolOptions
            });
          } else {
            console.log("The Document Does Not Exist");
          }
        })
        .catch(error => {
          console.log(error.message);
          res.redirect("/EduBirdie/error");
        });
    } else {
      res.redirect("/authenticate/sign_up");
    }
  });
});

app.get("/:lesson_id/view_lesson", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      let comments = [];
      let recommended_lessons = [];

      db.collection("lessons")
        .orderBy("name")
        .limit(10)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            recommended_lessons.push(doc.data());
          });
        })
        .catch(err => {
          console.log(err.message);
        });
      db.collection("lessons")
        .doc(req.params.lesson_id)
        .get()
        .then(doc => {
          let data = doc.data();
          db.collection("lesson_comments")
            .where("on_lesson", "==", req.params.lesson_id)
            .get()
            .then(snapshot => {
              snapshot.forEach(doc => {
                console.log(doc.id, "=>", doc.data());
                comments.push(doc.data());
              });

              console.table(comments);
              res.render("./MainFolders/Lesson", {
                data: data,
                user_email: user.email,
                user_code: user.uid,
                comments: comments,
                recommended_lessons: recommended_lessons
              });
            })
            .catch(err => {
              console.log(err);
            });
        })
        .catch(error => {
          console.log(error.message);
        });
    }
  });
});

app.get("/class/main/info/:school_id/:class_id/ClassInfo", (req, res) => {
  let lessons = [];
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      db.collection("lessons")
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            if (doc.exists) {
              if (doc.data().InClass === req.params.class_id) {
                lessons.push(doc.data());
                console.table(lessons);
              }
            }
          });
        })
        .catch(error => {
          console.log(path.join("There was an error: ", error.message));
          throw new Error(error.message);
        });

      db.collection("classes")
        .doc(req.params.class_id)
        .get()
        .then(doc => {
          if (doc.exists) {
            res.render("./MainFolders/ClassInfo", {
              lessons: lessons,
              classData: doc.data()
            });
          } else {
            console.log("Can't get data");
          }
        })

        .catch(error => {
          console.log("Error getting documents: ", error);
        });
    } else {
      res.redirect("/authenticate/sign_up");
    }
  });
});

app.post("/submit/search/:search", (req, res) => {
  let id = req.params.search;
  res.redirect("/home?" + id);
});

app.get("/school/main/info/:school_id/invite/members/", (req, res) => {
  let code;

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      db.collection("schools")
        .doc(req.params.school_id)
        .get()
        .then(doc => {
          if (doc.exists) {
            code = doc.data().secretSchoolCode;
            res.render("./AuthFolders/InviteMembers", { code: code });
          }
        })
        .catch(error => {});
    } else {
      res.redirect("/authenticate/sign_up");
    }
  });
});

app.post("/Invite/Members", (req, res) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: req.body.email_field,
      pass: "Bangweulu3"
    }
  });

  const mailOptions = {
    from: req.body.email_field,
    to: req.body.send_to,
    subject: "Welcome Back!",
    html: "<h1>Inviting you</h1>"
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
      alert("An error has occured");
    } else {
      console.log(info);
      alert("Successfully invited members!");
      res.redirect("/");
    }
  });
});

app.get("/documentDoesntExist", (req, res) => {
  res.render("./AuthFolders/DocumentHasNoExistence");
});

exports.app = functions.https.onRequest(app);

app.get("/authenticate/google_sign_up", (req, res) => {
  //TODO: add google authentication into edubirdy
  //google auth methods
  //google auth log in and out
  //sync authentication with database
});

app.get("/edubirdy/contact", (req, res) => {
  res.render("./AuthFolders/contact");
});

//Settings page for profile
app.get("/profile/:user_id/settings", (req, res) => {
  let data;
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      //Perform functions if user is authenticated
      console.log("User entered settings page");

      db.collection("users")
        .doc(req.params.user_id)
        .get()
        .then(doc => {
          if (doc.exists) {
            //Get documents data
            data = doc.data();
          }
          return res.render("./AuthFolders/settings", { data: data });
        })
        .catch(error => {
          //Error message as error occured
          console.log(error.message);
        });
    } else {
      //perform functions if user is not authenticated
      console.log("user not authenticated");
      res.redirect("/authenticate/sign_up");
    }
  });
});

app.get("/:school_id/join/school", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./AuthFolders/join_school", {
        school_id: req.params.school_id
      });
    } else {
      return res.redirect("/authenticate/sign_up");
    }
  });
});

//Join School post method

//...
app.post("/join/school/:school_id", (req, res) => {
  const school_directory = db.collection("schools").doc(req.params.school_id);
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      school_directory
        .get()
        .then(doc => {
          if (doc.exists) {
            console.log("code: " + req.body.school_code);
            console.log("code: " + req.params.school_id);
            if (
              req.body.school_code.toString() ===
              req.params.school_id.toString()
            ) {
              membersCollection = school_directory
                .collection("members")
                .doc(user.uid);

              //Add user to the members collection
              membersCollection.set({
                email: user.email,
                uid: user.uid,
                user_status: "member"
              });

              console.log("Success joining school!");
              return res.redirect("/home");
            } else {
              console.log("That code seems to be invalid");
              res.send(
                "<h1>The code: " +
                  req.body.school_code +
                  ", seems to be invalid"
              );
            }
          } else {
            console.log("School Doesn't Exist");
          }
        })
        .catch(error => {
          console.log(error.message);
          alert("It Seems an error had occured");
        });
    } else {
      return res.redirect("/authenticate/sign_up");
    }
  });
});

app.get("/edubird/error/", (req, res) => {
  return res
    .render //Add in error code and template
    ();
});

app.get("/edubird/search", (req, res) => {
  //Render search.hbs file
  const lessonsArray = [];
  const schoolsArray = [];
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      //Get query string parameter
      let user_search = req.query.s;
      console.log(req.query.s);
      // add database functions
      // Search and limit the amount of data returned
      // Return schools and lessons relating to search

      if (user_search !== "undefined") {
        //Get database lessons from cloud firestore
        let lessons = db.collection("lessons");
        //Get database of schools from cloud firestore
        let schools = db.collection("schools");
        //Get database data for schools
        schools
          .get()
          .then(querySnapshot => {
            querySnapshot.forEach(doc => {
              let nameString = doc.data().name;
              if (nameString.includes(user_search)) {
                //Search relation Sucess!!
                if (doc.data().admin === user.uid) {
                  //Do nothing as user is already admin and therefor cant join.
                } else {
                  schoolsArray.push(doc.data());
                }
              } else {
                console.log("A school with that name has not been found!");
              }
            });
          })
          .catch(err => {
            console.log(err.message);
          });
        //Get database data for lessons
        lessons
          .get()
          .then(querySnapshot => {
            querySnapshot.forEach(doc => {
              let nameString = doc.data().name;
              if (nameString.includes(user_search)) {
                //Search relation success!
                console.log("added user search ");
                lessonsArray.push(doc.data());
              } else {
                console.log("search doesn't relate");
              }
            });
            return res.render("./AuthFolders/search", {
              lessons: lessonsArray,
              schools: schoolsArray
            });
          })
          .catch(err => {
            console.log(err.message);
          });
      } else {
        console.log("User hasn't entered any text");
      }
    } else {
      console.log("User not authenticated");
      return res.redirect("/authenticate/sign_up");
    }
  });
});

app.post("/edubird/search", (req, res) => {
  //redirect back to get route to add query string parameter
  res.redirect("/edubird/search?s=" + req.body.SearchBar);
});

//Remove users from school route
app.get("/edubird/school/remove/user", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    //user is signed in
    if (user) {
      //let SchoolDataRef = db.collection("schools").doc().
      //TODO: ADD REMOVE FUNCTIONALITY
    } else {
      //user isn't the proper user to remove.
    }
  });
});

//Post search query to homescreen
app.post("/", (req, res) => {
  res.redirect("/?search=" + req.body.SearchBarParam);
});

app.get("/educator/hub/start", (req, res) => {
  //Check if user is aleady an educator
  //Perform actions and redirect if user is already an educator
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      db.collection("users")
        .doc(user.uid)
        .get()
        .then(doc => {
          if (doc.exists) {
            if (doc.data().educator !== true) {
              res.render("./MainFolders/EducatorsPage", {
                user_id: firebase.auth().currentUser.uid,
                first_name: user.first_name,
                last_name: user.last_name
              });
            } else {
              console.log("redirecting");
              res.redirect("/edu-eezi/educator/dashboard/home");
            }
          }
        })
        .catch(error => {
          console.log(error.message);
        });
    } else {
      res.redirect("/introduction");
    }
  });
});

//Dashboard Files for dashboard
//Educator Dashboard files
//////
//////
//////
//////
//////

app.get("/edu-eezi/educator/dashboard/home", (req, res) => {
  return res.render("./DashboardFolder/home");
});

app.get("/edu-eezi/educator/dashboard/Lessons", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const lessons = [];
      const schools = [];

      db.collection("lessons")
        .where("uploader", "==", user.uid)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            if (doc.exists) {
              lessons.push(doc.data());
            }
          });
          return res.render("./DashboardFolder/Lessons", { lessons: lessons });
        })
        .catch(err => {
          console.log(err.message);
        });
    } else {
      //User cant access
      return res.redirect("/Introduction/");
    }
  });
});

app.get("/edu-eezi/educator/dashboard/Revenue", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/Revenue");
    } else {
      return res.redirect("/Introduction");
    }
  });
});
app.get("/edu-eezi/educator/dashboard/Settings", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/Settings");
    } else {
      return res.redirect("/Introduction");
    }
  });
});
app.get("/edu-eezi/educator/dashboard/UploadLesson", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/UploadLesson");
    } else {
      return res.redirect("/Introduction");
    }
  });
});

app.get("/edu-eezi/educator/dashboard/LessonBundles", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/LessonBundles");
    } else {
      return res.redirect("/Introduction");
    }
  });
});

app.get("/edu-eezi/educator/dashboard/messages", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/messages");
    } else {
      return res.redirect("/Introduction");
    }
  });
});

app.get("/edu-eezi/educator/dashboard/profile", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/profile");
    } else {
      return res.redirect("/Introduction");
    }
  });
});

app.get("/edu-eezi/educator/dashboard/search", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/search");
    } else {
      return res.redirect("/Introduction");
    }
  });
});

app.get("/edu-eezi/educator/dashboard/monetization", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/monetization");
    } else {
      return res.redirect("/Introduction");
    }
  });
});

app.get("/edu-eezi/educator/dashboard/help", (req, res) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return res.render("./DashboardFolder/help");
    } else {
      return res.redirect("/Introduction");
    }
  });
});

app.get(
  "/edu-eezi/educator/dashboard/analytics/video/:lesson_id",
  (req, res) => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        let lessonRef = db.collection("lessons").doc(req.params.lesson_id);
        let name, descrip, date, url;

        lessonRef
          .get()
          .then(doc => {
            if (doc.exists) {
              name = doc.data().name;
              descrip = doc.data().description;
              date = doc.data().uploaded_at;
              url = doc.data().url;
            } else {
              //document doesn't exist
              //Send client error message
            }
            return res.render("./DashboardFolder/VideoAnalytics", {
              name: name,
              descrip: descrip,
              date: date,
              url: url
            });
          })
          .catch(err => {
            //Error getting data
            //TODO: send client error message
            console.log(err.message);
          });
      } else {
        //Redirect to intro page
        return res.redirect("/introduction");
      }
    });
  }
);

//Google Cloud Function
//App to power web server and hosting:
// ---- //
exports.app = functions.https.onRequest(app);
