let express = require('express')
var expressHbs = require('express-handlebars')
var bodyParser = require('body-parser')
var firebase = require('firebase');
var flash = require('express-flash-messages')
const admin = require('firebase-admin');
const path = require('path');
const gcloud = require('@google-cloud/storage')
let nodemailer = require('nodemailer')
let url = require('url')

var config = {
    apiKey: "AIzaSyBNo2Ht5eM9m4AqXIEBJwEPFU8yiQL81Uc",
    authDomain: "edubirdie-1534842942940.firebaseapp.com",
    databaseURL: "https://edubirdie-1534842942940.firebaseio.com",
    projectId: "edubirdie-1534842942940",
    storageBucket: "edubirdie-1534842942940.appspot.com",
    messagingSenderId: "1077918538165"
};

let serviceAccount = require('./service-accounts.json');
firebase.initializeApp(config);
let database = firebase.database();




admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let db = admin.firestore();

const app = express();


console.log("hi")
app.use(flash())

app.use(express.static("public"))
app.engine('hbs', expressHbs({extname:'hbs', layoutsDir: __dirname + '/views/layouts/', partialsDir: __dirname + '/views/partials/'}));
app.set('view engine', 'hbs')
app.use(bodyParser.urlencoded({extended: false}))

app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(r.route.path)
    }
  })
 

//Configure and connect to firebase backend


function sendMailThroughApp(email, password, html) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass: 'Bangweulu3'
        }
    });

    const mailOptions = {
        from: 'chanda.lupambo@gmail.com',
        to: email,
        subject: 'Welcome Back!',
        html: html,
    };


    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
     });
}
function checkIfUserIsSignedIn(filename) {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          // User is signed in.
          console.log("you are already logged in :)")
          res.redirect('/home');

        } else {
          // No user is signed in.
          console.log(firebase.auth().currentUser);
          console.log("User is null")
          res.render(filename)

        }
      });
}

//DefaultFirebaseApp Initialization for WebApp:


app.listen(3000, () => {
    console.log("Running on: localhost:3000")
    console.log("port = 3000, server = localhost;")
});

app.get("/authenticate/sign_up", (req, res) => 
{
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          // User is signed in.
          console.log("you are already logged in :)")
          res.redirect('/home');

        } else {
          // No user is signed in.
          console.log(firebase.auth().currentUser);
          console.log("User is null")
          res.render('./AuthFolders/signUp')

        }
      });
   
    })

app.get("/home", (req, res) => {
  
    const lessons = [];
    console.log(firebase.auth().currentUser);

            db.collection("lessons")
            .get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    lessons.push(doc.data());
                    
                });
                console.log(lessons)
             res.render('home', {'lessons': lessons, 'user': firebase.auth().currentUser})
                
            })
     
    });
    


app.get("/authenticate/sign_in", (req, res) => {

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          // User is signed in.
          console.log("you are already logged in :)")

          res.redirect('/home');
          
        } else {
          // No user is signed in.
          console.log("User is null")
          return res.render('./AuthFolders/signIn')
          
        }
      });

})

app.post("/authenticate/sign_in", (req, res) => {

    
    firebase.auth().signInWithEmailAndPassword(req.body.email_log_in, req.body.password)
        .then(function(firebaseUser) {

            console.log("Successfully Signed In!")
            console.log(firebaseUser.email)

            //Send sign in confirmation
            sendMailThroughApp(req.body.email_log_in, req.body.password, '<h1>Welcome To EduBirdie!</h1><br><h3>You can earn your income by creating lessons teaching various topics or create a school to have your own learning community or integreate an existing school into edubirdie. Possibilities are <strong>EndLess</strong></h3>')
           

            //Send a success email to user!
         
            return res.redirect("/home")
 
        })
        .catch(function(error) {
            console.log(error.message)
        });
})


app.post("/authenticate/sign_up", (req, res) => 
{
    let username, email, password;

    username = req.body.username;
    email = req.body.email;
    password = req.body.password;

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function(firebaseUser) {


         //Add User data into database after authentication:
         var docref =db
         .collection('users')
         .doc(firebase.auth().currentUser.uid);

        docref.set({
            name: username,
            email: email,
            password: password
        })
        .then(function() {
            //Add An Alert notifying user they have been authenticated
            console.log("User has successfully been added!");
            console.log("Success Creatings user!!")
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'chanda.lupambo@gmail.com',
                    pass: 'Bangweulu3'
                }
            });

            let mailOptions = {
                from: 'chanda.lupambo@gmail.com',
                to: req.body.email_log_in,
                subject: "Welcome To Edubirdie!",
                text: "Get Started Learn Something New!"
            }

            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error)
                } else {
                    console.log("Email Sent: " + info.response)
                    res.redirect('/authenticate/sign_in')
                }
            })
            
        })
        .catch(function(error) {
            console.log("There seems to be an error with the user authentication!")
            console.log(error.message);
        });


       
    }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("error" + errorMessage)
        console.log("code" + errorCode)
    });
});

app.get("/authenticate/log_out", (req, res) => {
    
    firebase
        .auth()
        .signOut()
        .then(function() {
            console.log("We're very sorry you left");
            res.render('./AuthFolders/logOut');
        })
        .catch(function() {
            console.log("error signing out!")
        });
    
    
}); 

let code;



app.get("/school/main/info/:school_id", (req, res) => {
    let SchoolData;
    let messages = [];
    let classes = [];
    let admin;
  
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            

            console.log(req.params.school_id)

           
                db.collection("users")
                .doc(user.uid)
                .collection("school")
                .doc(req.params.school_id)
                .get().then(function(doc) {
                    if (doc.data().admin == user.uid) {
                        console.log("This user is the admin");
                        admin = true;
                    } else {
                        console.log("This user is not an admin");
                        admin =  false;
                    }
                })
                .catch(function(error) {
                    console.log("There was a database error")
                    console.log(error.message)
                });
                
            

            db.collection("users")
            .doc(user.uid)
            .collection("school")
            .doc(req.params.school_id)
            .collection("classes")
            .get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    classes.push(doc.data())
                })
            }).catch(function(error) {
                console.log(error.message)
            })

            db.collection("users").doc(user.uid).collection("school").doc(req.params.school_id).collection("messages").get().then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    messages.push(doc.data());
                    console.log("message added")
                })
            }).catch(function(error) {

            });
            db.collection("users").doc(user.uid)
            .collection("school")
            .doc(req.params.school_id)
            .get().then(function(doc) {

                if (doc.exists) {
                    console.log("Document data: ", doc.data())
                    SchoolData = doc.data();
                    console.log(SchoolData)
                    console.log(messages)
                    let schoolCode = req.params.school_id


                    res.render('./AuthFolders/yourSchool', {'is_admin': admin, 'SchoolData':SchoolData, 'messages': messages, 'classes': classes, 'SchoolCode': schoolCode});
            
                } else {

                    console.log("No document exists!")
                }
            }).catch(function(error) {
                    console.log(error.message);
            });
             
        } else {
            console.log("Not logged in!")
        }

      
    });
});

app.post("/school/main/info/:school_id/add_class", (req, res) => {
    //Firebase database functions for add class

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            let text = "";
            let possible = 
           "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

           for (var i = 0; i < 5; i++) {
               text += possible.charAt(Math.floor(Math.random() * possible.length))
           }

            let classRef = db.
            collection("users").
            doc(user.uid).
            collection("school").
            doc(req.params.school_id).
            collection("classes").
            doc(text);

           

              classRef.set({
                name: req.body.ClassName,
                code: text,
                belongs_to: req.params.school_id
            }).then(function() {
                console.log("WOOOOO")
                res.redirect("/school/main/info/" + req.params.school_id)
            }).catch(function(error) {
                console.log(error.message)
            })
        } else {
            res.redirect("/authenticate/sign_up")
        }
    })
})
app.post("/school/main/info/:school_id/message_sent", (req,res) => {
    //Do the firebase database functions:

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            let messageRef = db.collection("users")
            .doc(user.uid)
            .collection("school")
            .doc(req.params.school_id)
            .collection("messages")
            .doc(req.body.message);

            messageRef.set({
                message: req.body.message,
                by: user.email
            }).then(function() {
                console.log("add has been a success")

                res.redirect("/school/main/info/" + req.params.school_id)
            }).catch(function(error) {
                console.log(error.message)
            })


        } else {

        }
    })
    
})
app.get("/profile", (req, res) => {
    let databaseData = [];

    let databaseCode;
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
         
            db.collection("users").doc(user.uid).collection("school").get().then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    // doc.data() is never undefined for query doc snapshots
                    databaseData.push(doc.data());
                    databaseCode = doc.data().secretSchoolCode
                    
                    console.log(databaseData)
                    
                   
                });
                res.render('./AuthFolders/profile', {'databaseCode': databaseCode, 'databaseData': databaseData, 'user': firebase.auth().currentUser});
                 
            }).catch(function(error) {
                console.log(error.message)
            });
            
        } else {

          return res.redirect('/authenticate/sign_up');
        }
       
    })
    console.log("hello")
    
});

app.get("/authenticated/create/create_school", (req, res) => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            res.render('create_school')
        } else {
            console.log("Not ALLLLOOOOWWWWEEEED")
        }
    })
});

app.post("/authenticated/create/create_school/", (req, res) => {
    let schoolName, schoolDesc;
    let text = "";
    let possible = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    schoolName = req.body.schoolName
    schoolDesc = req.body.schoolDescription
    var documentRef = db.collection('users')
        .doc(firebase.auth()
        .currentUser.uid)
        .collection("school")
        .doc(text);

    documentRef.set({
        name:  schoolName,
        description: schoolDesc,
        secretSchoolCode: text, 
        admin: firebase.auth().currentUser.uid,
    });

    res.redirect('/profile')
});

app.get("/class/main/info/:school_id/:class_id/add_lesson", (req, res) => {
    let databaseData;
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            db.collection("users")
            .doc(user.uid)
            .collection("school")
            .doc(req.params.school_id)
            .collection("classes")
            .doc(req.params.class_id)
            .get()
            .then(function(doc) {
                if (doc.exists) {
                    console.log("document exists")
                    databaseData = doc.data();
                    db.collection("users")
                    res.render("./AuthFolders/Class", {'id': user.uid, 'data': databaseData})
                } else {
                    console.log("The Document Does Not Exist")
                }
            }).catch(function(error) {
                console.log(error.message);
                res.redirect("/EduBirdie/error");
            })
            
        } else {
            res.redirect("/authenticate/sign_up")
        }
    })
})

app.get("/:school_id/:class_id/:lesson_id/view_lesson", (req, res) => {
    firebase.auth().onAuthStateChanged(function(user) {
        
        if (user) {
          
            
            
            let comments = [];
            db.collection("lessons").doc(req.params.lesson_id)
            .get().then(function(doc) {
         
                
                let data = doc.data()
                db.collection("lesson_comments")
                    .where("on_lesson", "==", req.params.lesson_id)
                    .get().then(snapshot => {
                        snapshot.forEach(doc => {
                            console.log(doc.id, '=>', doc.data());
                            comments.push(doc.data())
                        })
                        
                        console.log(comments);
                        res.render('./AuthFolders/Lesson', 
                        {'data': data, 
                         'user_email': user.email,
                         'user_code': user.uid,
                        'comments': comments}
                        );
                    })
                    .catch(err => {
                        console.log(err);
                    })
            
             
                
            }).catch(function(error) {
                console.log(error.message)
            })
           
            
        } else {

        }
    });
})

app.get("/class/main/info/:school_id/:class_id/ClassInfo", (req, res) => {
    let lessons = []
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {

            db.collection("lessons")
            .get().then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    if(doc.exists) {
                        if (doc.data().InClass == req.params.class_id) {
                            lessons.push(doc.data());
                            console.log(lessons)
                        }
                    }
                })
            });
        
                db.collection("users")
                .doc(user.uid)
                .collection("school")
                .doc(req.params.school_id)
                .collection("classes")
                .doc(req.params.class_id)
                .get().then(function(doc) {
                    if (doc.exists) {
                        res.render("./AuthFolders/ClassInfo", {'lessons': lessons, 'classData': doc.data()})
                    } else {
                        console.log("Can't get data")
                    }
                })
              


            .catch(function(error) {
                console.log("Error getting documents: ", error)
            })
        } else {
            res.redirect("/authenticate/sign_up")
        }
    })
});

app.get("/home/search", (req, res) => {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            //Perform actions if the user has been logged in
            

            res.render("./AuthFolders/search");
        } else {
            //Perform actions if the user has not yet been authenticated
            res.redirect("/authenticated/sign_up");
        }
    });
})

app.post("/submit/search/:search", (req,res) => {
    let id = req.params.search;
    res.redirect("/home?" + id)
})

app.get("/school/main/info/:school_id/invite/members/", (req,res) => {

    let code;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            db.collection("users")
              .doc(user.uid)
              .collection("school")
              .doc(req.params.school_id)
              .get().then(function(doc) {
                  if (doc.exists) {
                      code = doc.data().secretSchoolCode;
                      res.render("./AuthFolders/InviteMembers", {'code': code})
                  }
              })
        } else { 
            res.redirect("/authenticate/sign_up")
        }
    })
})

app.post("/Invite/Members", (req,res) => {
    sendMailThroughApp(res.body.email_field, null, '<h1>From EduBirdy</h1> <p>Join My School by entering the code<p>');
    res.redirect('/home')
})