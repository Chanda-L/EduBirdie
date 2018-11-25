//Imports into firebase project
var alert = require('alert-node');
var express = require('express');
var expressHbs = require('express-handlebars');
var bodyParser = require('body-parser');
var firebase = require('firebase');
var flash = require('express-flash-messages');
var admin = require('firebase-admin');
var path = require('path');
var gcloud = require('@google-cloud/storage');
var nodemailer = require('nodemailer');
var url = require('url');
var functions = require('firebase-functions');


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


console.log("hi")
app.use(flash())


// Since this is the last non-error-handling
// middleware use()d, we assume 404, as nothing else
// responded.

// $ curl http://localhost:3000/notfound
// $ curl http://localhost:3000/notfound -H "Accept: application/json"
// $ curl http://localhost:3000/notfound -H "Accept: text/plain"

app.use(express.static("public"))
app.engine('hbs', expressHbs({extname:'hbs', layoutsDir: __dirname + '/views/layouts/', partialsDir: __dirname + '/views/partials/'}));
app.set('view engine', 'hbs')
app.use(bodyParser.urlencoded({extended: false}))

app._router.stack.forEach((r) => {
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


    transporter.sendMail(mailOptions, (err, info) => {
        if(err)
          console.log(err)
        else
          console.log(info);
     });
}


function checkIfUserIsSignedIn(filename) {
    firebase.auth().onAuthStateChanged((user) => {
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

app.get("/", (req, res) => {
    return res.redirect("/home");
});

app.get("/authenticate/sign_up", (req, res) => 
{
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // User is signed in.
          console.log("you are already logged in :)")
          
        } else {
          // No user is signed in.
          console.log(firebase.auth().currentUser);
          console.log("User is null")
          res.render('./AuthFolders/signUp')

        }
      });
   
    })

app.get("/home", (req, res) => {
  
    let lessons = [];
    
                
                    db.collection("lessons")
                    .get()
                    .then((querySnapshot) => {
                        querySnapshot.forEach((doc) => {
                             lessons.push(doc.data()); 
                        });
                        
                        return res.render('home', {'lessons': lessons, 'user': firebase.auth().currentUser});

                    }).catch((error) =>{
                        console.log(error.message);
                       
                    });
         
                //Perform actions if user not authenticated
                console.log("User not authorized to see videos!");
                
               
                
            
    });
    


app.get("/authenticate/sign_in", (req, res) => {

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // User is signed in.
          console.log("you are already logged in :)")
    
        } else {
          // No user is signed in.
          console.log("User is null")
          return res.render('./AuthFolders/signIn')
          
        }
      });

})

app.post("/authenticate/sign_in", (req, res) => {

    
    firebase.auth().signInWithEmailAndPassword(req.body.email_log_in, req.body.password)
        .then((firebaseUser) => {

            console.log("Successfully Signed In!")
            console.log(firebaseUser.email)

            //Send sign in confirmation
            sendMailThroughApp(
                req.body.email_log_in, req.body.password, 
                '<h1>Welcome To EduBirdie!</h1><br><h3>You can earn your income by creating lessons teaching various topics or create a school to have your own learning community or integreate an existing school into edubirdie. Possibilities are <strong>EndLess</strong></h3>'
                );
           

            //Send a success email to user!
         
            return res.redirect("/home")
 
        })
        .catch((error) => {
        console.log(error.message)
            
        //Send the error message to the client side
        res.send('<h1 style="text-align: center; font-family: sans-serif; font-weight: bold; color: green;">' 
        + error.message + 
        '</h1><a href="/authenticate/sign_up" style="text-decoration: none;  color: green; text-align: center; font-family: sans-serif;" class="btn">Go Back</a> ')
        });
})


app.post("/authenticate/sign_up", (req, res) => 
{
    let username, email, password;

    username = req.body.username;
    email = req.body.email;
    password = req.body.password;

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((firebaseUser) => {


         //Add User data into database after authentication:
         var docref =db
         .collection('users')
         .doc(firebase.auth().currentUser.uid);

        docref.set({
            name: username,
            email: email,
            password: password
        })
        // eslint-disable-next-line promise/always-return
        .then(() => {
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

            // eslint-disable-next-line consistent-return
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error)
                } else {
                    console.log("Email Sent: " + info.response)
             
                }
            })
            res.redirect("/home")
        })
        .catch((error) => {
            //Handle the authentication error
            console.log("There seems to be an error with the user authentication!")
            console.log(error.message);
            throw new Error(error.message)
        });


       
    }).catch((error) => {
        //all error codes
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("error" + errorMessage)
        console.log("code" + errorCode)

        //Send the error message to the client side
        res.send('<h1 style="text-align: center; font-family: sans-serif; font-weight: bold; color: green;">' 
        + errorMessage + 
        '</h1><a href="/authenticate/sign_up" style="text-decoration: none;  color: green; text-align: center; font-family: sans-serif;" class="btn">Go Back</a> ')
    });
   
});

app.get("/authenticate/log_out", (req, res) => {
    
    firebase
        .auth()
        .signOut()
        .then(() => {
            //render log out page
            return res.render('./AuthFolders/logOut');
        })
        .catch((error) => {
            //log out the error message
            console.log(error.message)

            //Send error message to user that log in was unsuccessful 
            res.send("<h1>There was an error logging you out</h1>" + "<h4>" + error.message + "</h4>")
        })
}); 





app.get("/school/main/info/:school_id", (req, res) => {
    let SchoolData;
    let messages = [];
    let classes = [];
    let members = [];
    let admin;
  
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            

            console.log(req.params.school_id)

           
                db.collection("schools").doc(req.params.school_id)
                .get().then((doc) => {
                    if (doc.data().admin === user.uid) {
                        console.log("This user is the admin");
                        admin = true;
                        return admin;
                    } else {
                        console.log("This user is not an admin");
                        admin =  false;
                        return admin;
                    }
                })
                .catch((error) => {
                    console.log("There was a database error")
                    console.log(error.message)
                });
                
            

            db.collection("classes")
            .where('belongs_to', '==', req.params.school_id)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    classes.push(doc.data())
                   
                })
                return classes;
            }).catch((error) => {
                console.log(error.message)
                return error.message;
            })
            db.collection("schools")
            .doc(req.params.school_id)
            .collection("members")
            .get()
            .then((querySnapshot) =>{
                querySnapshot.forEach((doc) => {
                    //Add members into members array
                    members.push(doc.data());
                })  
            }).catch((error) => {
                console.log(error.message);
            })
            db.collection("users").doc(user.uid).collection("school").doc(req.params.school_id).collection("messages").get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    messages.push(doc.data());
                    console.log("message added")
                })
                return messages
            }).catch((error) => {
                throw new Error("class does not exist")
            });
            db.collection("schools")
            .doc(req.params.school_id)
            .get().then((doc) => {

                if (doc.exists) {
                    console.log("Document data: ", doc.data())
                    SchoolData = doc.data();
                    console.log(SchoolData)
                    console.log(messages)
                    let schoolCode = req.params.school_id


                    return res.render('./AuthFolders/yourSchool', {'is_admin': admin, 'SchoolData':SchoolData, 'messages': messages, 'classes': classes, 'members': members, 'SchoolCode': schoolCode});
            
                } else {

                    console.log("No document exists!")
                    return 'no document exists'
                }
            }).catch((error) => {
                    console.log(error.message);
            });
             
        } else {
            console.log("Not logged in!")
        }

      
    });
});

app.post("/school/main/info/:school_id/add_class", (req, res) => {
    //Firebase database functions for add class

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            let text = "";
            let possible = 
           "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

           for (var i = 0; i < 20; i++) {
               text += possible.charAt(Math.floor(Math.random() * possible.length))
           }

            let classRef = db.collection("classes").doc(text);
           

            classRef.set({
                name: req.body.ClassName,
                code: text,
                belongs_to: req.params.school_id
            // eslint-disable-next-line promise/always-return
            }).then(() => {
                console.log("WOOOOO")
                res.redirect("/school/main/info/" + req.params.school_id)
            }).catch((error) => {
                console.log(error.message)
            })
        } else {
            res.redirect("/authenticate/sign_up")
        }
    })
})
app.post("/school/main/info/:school_id/message_sent", (req,res) => {
    //Do the firebase database functions:

    firebase.auth().onAuthStateChanged((user) => {
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
            }).then(() => {
                console.log("add has been a success")

                res.redirect("/school/main/info/" + req.params.school_id)
            }).catch((error) => {
                console.log(error.message)
            })


        } 
    })
    
})
app.get("/profile", (req, res) => {
    let databaseData = [];

    let databaseCode;
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
             
            db.collection("schools").where('admin', '==', user.uid).get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    databaseData.push(doc.data());
                    databaseCode = doc.data().secretSchoolCode
                    
                    console.log(databaseData)
                    
                   
                });
                res.render('./AuthFolders/profile', {'databaseCode': databaseCode, 'databaseData': databaseData, 'user': firebase.auth().currentUser});
                 
            }).catch((error) => {
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

    //add school document in collection of schools to firebase database
    var documentRef = db.collection('schools').doc(text)


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
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            db.collection("classes").doc(req.params.class_id).get()
            .then((doc) => {
                if (doc.exists) {
                    console.log("document exists")
                    databaseData = doc.data();
                
                    res.render("./AuthFolders/Class", {'id': user.uid, 'data': databaseData})
                } else {
                    console.log("The Document Does Not Exist")
                }
            }).catch((error) => {
                console.log(error.message);
                res.redirect("/EduBirdie/error");
            })
            
        } else {
            res.redirect("/authenticate/sign_up")
        }
    })
})

app.get("/:school_id/:class_id/:lesson_id/view_lesson", (req, res) => {
    firebase.auth().onAuthStateChanged((user) => {
        
        if (user) {
          
            
            
            let comments = [];
            db.collection("lessons").doc(req.params.lesson_id)
            .get().then((doc) => {
         
                
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
            
             
                
            }).catch((error) => {
                console.log(error.message)
            })
           
            
        }
    });
})

app.get("/class/main/info/:school_id/:class_id/ClassInfo", (req, res) => {
    let lessons = []
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {

            db.collection("lessons")
            .get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    if(doc.exists) {
                        if (doc.data().InClass === req.params.class_id) {
                            lessons.push(doc.data());
                            console.log(lessons)
                        }
                    }
                })
            }).catch((error) => {
                console.log(path.join("There was an error: ", error.message))
                throw new Error(error.message);
          
            });
        
                db.collection("classes")
                .doc(req.params.class_id)
                .get().then((doc) => {
                    if (doc.exists) {
                        res.render("./AuthFolders/ClassInfo", {'lessons': lessons, 'classData': doc.data()})
                    } else {
                        console.log("Can't get data")
                    }
                })
              


            .catch((error) => {
                console.log("Error getting documents: ", error)
            })
        } else {
            res.redirect("/authenticate/sign_up")
        }
    })
});



app.post("/submit/search/:search", (req,res) => {
    let id = req.params.search;
    res.redirect("/home?" + id)
})

app.get("/school/main/info/:school_id/invite/members/", (req,res) => {

    let code;

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            db.collection("schools")
            .doc(req.params.school_id)
              .get().then((doc) => {
                  if (doc.exists) {
                      code = doc.data().secretSchoolCode;
                      res.render("./AuthFolders/InviteMembers", {'code': code})
                  }
              }).catch((error) => {

              })
        } else { 
            res.redirect("/authenticate/sign_up")
        }
    })
})

app.post("/Invite/Members", (req,res) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: req.body.email_field,
            pass: 'Bangweulu3'
        }
    });

    const mailOptions = {
        from: req.body.email_field,
        to: req.body.send_to,
        subject: 'Welcome Back!',
        html: '<h1>Inviting you</h1>',
    };


    transporter.sendMail(mailOptions, (err, info) => {
        if(err) {
          console.log(err)
          alert("An error has occured")
         } else {
          console.log(info);
          alert("Successfully invited members!")
          res.redirect('/')
         }
     });
})

app.get('/documentDoesntExist', (req, res) => {
    res.render('./AuthFolders/DocumentHasNoExistence')
})


exports.app = functions.https.onRequest(app);

app.get("/authenticate/google_sign_up", (req, res) => {
    //TODO: add google authentication into edubirdy
    //google auth methods
    //google auth log in and out
    //sync authentication with database

})

app.get("/edubirdy/contact", (req,res) => {
    res.render("./AuthFolders/contact");
})

//Settings page for profile
app.get("/profile/:user_id/settings", (req,res) => {
    let data;
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            //Perform functions if user is authenticated
            console.log("User entered settings page")
            
            db.collection("users")
              .doc(req.params.user_id)
              .get()
              .then((doc) => {
                if (doc.exists) {
                    //Get documents data
                    data = doc.data();
                }
                return res.render("./AuthFolders/settings",{'data': data});
              }).catch((error) =>{
                  //Error message as error occured
                    console.log(
                        error.message
                        );
              });
        } else {
            //perform functions if user is not authenticated
            console.log("user not authenticated")
            res.redirect("/authenticate/sign_up")
        }
    })
  
})

app.get("/:school_id/join/school", (req, res) => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            return res.render("./AuthFolders/join_school",{'school_id': req.params.school_id})  
        } else {
            return res.redirect("/authenticate/sign_up")
        }
    });
  
})


//Join School post method 

//...
app.post("/join/school/:school_id", (req,res) => {

    const school_directory =  db.collection("schools").doc(req.params.school_id);
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
           school_directory.get().then((doc) => {
                if (doc.exists) {
                    console.log("code: " + req.body.school_code)
                    console.log("code: " + req.params.school_id)
                    if (req.body.school_code.toString() === req.params.school_id.toString()) {
                        membersCollection = school_directory.collection("members").doc(user.uid);

                        //Add user to the members collection
                        membersCollection.set({
                            'email': user.email,
                            'uid': user.uid,
                            'user_status': 'member',
                        });

                        console.log("Success joining school!")
                        return res.redirect("/home")

                    } else {
                        console.log("That code seems to be invalid")
                        res.send("<h1>The code: " + req.body.school_code + ", seems to be invalid");
                    }
                } else {
                    console.log("School Doesn't Exist")
                }
            }).catch((error) => {
                console.log(error.message);
                alert("It Seems an error had occured")
            });
            
        } else {
            return res.redirect("/authenticate/sign_up");
        }
    })
});

app.get("/edubird/error/", (req,res) => {
    return res.render(//Add in error code and template
    
    );
})

app.get("/edubird/search", (req,res) => {
    //Render search.hbs file 
    const lessonsArray = [];
    const schoolsArray = [];
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            //Get query string parameter
            let user_search = req.query.s;
            console.log(req.query.s)
            // add database functions
            // Search and limit the amount of data returned
            // Return schools and lessons relating to search

            if (user_search !== 'undefined') {
                //Get database lessons from cloud firestore
                let lessons = db.collection("lessons");
                //Get database of schools from cloud firestore
                let schools = db.collection("schools")
                //Get database data for schools
                schools.get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        let nameString = doc.data().name;
                        if (nameString.includes(user_search)) {
                            //Search relation Sucess!!
                            if (doc.data().admin === user.uid) {
                                
                                //Do nothing as user is already admin and therefor cant join.
                            } else {
                                schoolsArray.push(doc.data())
                            }
                        } else {
                            console.log("A school with that name has not been found!")
                        }
                    })
                }).catch((err) => {
                    console.log(err.message)
                })
                //Get database data for lessons
                lessons.get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        let nameString = doc.data().name;
                        if (nameString.includes(user_search)) {
                            //Search relation success!
                            console.log("added user search ")
                            lessonsArray.push(doc.data());
                        } else {
                            console.log("search doesn't relate")
                        }
                    });
                    return res.render("./AuthFolders/search", {'lessons': lessonsArray, 'schools': schoolsArray})
                }).catch((err) => {  
                    console.log(err.message)
                });
                
            } else {
                console.log("User hasn't entered any text")
            }
            
    } else {
        console.log("User not authenticated");
        return res.redirect("/authenticate/sign_up");
    }
    
    })
   
    
})

app.post('/edubird/search', (req, res) => {
    //redirect back to get route to add query string parameter
    res.redirect("/edubird/search?s=" + req.body.SearchBar)
})

//Remove users from school route
app.get("/edubird/school/remove/user", (req,res) => {
    firebase.auth().onAuthStateChanged((user) => {
        //user is signed in 
        if (user) {
            
        } else {

        }
    })
})