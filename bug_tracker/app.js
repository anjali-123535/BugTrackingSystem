require('dotenv').config()
const express = require ('express');
const bodyParser = require ('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

var fs = require('fs');
var path = require('path');
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({ storage: storage });


//middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: "Bugs are bad",
  resave: false,
  saveUninitialized: false
}));

//flash message middleware
app.use((req, res, next)=>{
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

//use passport and initialize interval
app.use(passport.initialize());
// use passport to deal with sessions
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/bugTrackerDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  empName:String,

});

//hash and salt our passwords and store them in DB
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/bug-tracker",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//upload schema
var imageSchema = new mongoose.Schema({

    img:
    {
        data: Buffer,
        contentType: String
    }
});

var Image = mongoose.model("Image", imageSchema);

//employeeSchema
const employeeSchema = new mongoose.Schema({
  email:String,
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  dob: {
    type: String,
    required: true
  },
  gender:{
    type: String,
    required: true
  },
  empId:{
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  contact: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zip: {
    type: Number,
    required: true
  },
});


const Employee = mongoose.model("Employee", employeeSchema);


//projectSchema
const projectSchema = new mongoose.Schema({
  projName: {
    type: String,
    required: true
  },
  projType: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  projManager: {
    type: String,
    required: true
  },
  fTech: {
    type: String,
    required: true
  },
  dbTech: {
    type: String,
    required: true
  },
  projDescription: {
    type: String,
    required: true
  },

});


const Project = mongoose.model("Project", projectSchema);

//bugReportSchema
const bugReportSchema = new mongoose.Schema({
  bugTitle: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  projectName: {
    type: projectSchema,
    required: true
  },
  employees: {
    type: [employeeSchema],
    required: true
  },
  ticketType: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  ticketStatus: {
    type: String,
    required: true
  },
  ticketDescription: {
    type: String,
    required: false
  }


});


const BugReport = mongoose.model("BugReport", bugReportSchema);

//todo list Schema
const itemsSchema = new mongoose.Schema ({
  name: String
});

//new mongoose model
const Item = mongoose.model( "Item", itemsSchema);

const item1 = new Item({
  name: "Add your daily tasks here"
});

const item2 = new Item({
  name: "use + to add new tasks"
});

const item3 = new Item({
  name: "click on checkbox to delete the completed tasks"
});

const defaultItems = [ item1, item2, item3 ];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/bug-tracker',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/dashboard');
    });

app.get("/login", function(req, res){
  res.render("login");
});

// app.post("/login",function(req, res){
//
//   const user = new User({
//     username: req.body.username,
//     password: req.body.password,
//   });
//
//   req.login(user, function(err){
//     if (err) {
//       console.log(err);
//     } else {
//       console.log("ahuh")
//       passport.authenticate("local")(req, res, function(){
//        if(user.username=='vrinda@gmail.com'){
//    BugReport.find({},function(err,bugReport){
//
//
//          designation="admin"
//          res.render("dashboard",{designation:designation,bugReport:bugReport})
//        });
//      }
//        BugReport.findOne({"employees.firstName":req.body.empName},function(err,foundEmp){
//
//        if(err){
//        console.log(err)
//        }else{
//        res.render('user',{foundEmployee:foundEmp})
//        }
//
//
//
//
//      });
//
//
// }
// });
// });
// });
//
//         // res.redirect("/");
app.post("/login", function(req, res){

console.log("im here")
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    empName:req.body.empName
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log("ahuh")
      passport.authenticate("local")(req, res, function(){
       if(user.username=='vrinda@gmail.com'){
         BugReport.find({},function(err,bugReport){

         designation="admin"
         res.render("dashboard",{designation:designation,bugReport:bugReport})
             });
       }
       BugReport.find({"employees.firstName":req.body.empName},function(err,foundEmp){

       if(err){
       console.log(err)
       }else{
        console.log("reports "+foundEmp.length)
       res.render('user',{foundReport:foundEmp})
       }
       })// res.redirect("/");
      });
    }
  });

  });








app.get("/sign-up", function(req,res){
  res.render("sign-up");
})
//db.users.find({}).populate('job');
app.get("/dashboard", function(req, res){
  if(req.isAuthenticated()){

    // User.findOne({id: req.user._id}).populate("employee").populate("project").populate("bugReport").exec(function (err, users) {
    //      if(err){
    //        console.log(err);
    //      }else{
    //        console.log(users);
    //        res.render("dashboard",{user: users})
    //      }
    // });
    BugReport.find({}, function (err, foundBugReports) {
      Project.find({}, function(err, foundProjects){
        res.render("dashboard", {
          bugReport: foundBugReports,
          projects: foundProjects
        })
    })

  })
  }else{
    res.redirect("/login");
  }
})

app.post("/sign-up", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      res.redirect("/sign-up");
    }else{
      passport.authenticate("local")(req, res, function(){
        // User.findOne({_id: req.user._id}).populate("employee").populate("project").populate("bugReport").exec(function (err, users) {
        //      if(err){
        //        console.log(err);
        //      }else{
        //        // res.render("dashboard",{user: users})
        //        console.log(users);
        //      }
        // });
        res.redirect("/dashboard");
      });
    }
  })
})

  app.get("/logout", function(req, res){
    req.logout();
    res.sendFile(__dirname + "/index.html")
  })

// app.get("/", function(req, res) {
//
// })
app.get("/cards", function(req, res) {
  res.render("cards");
})


app.get("/employee-report", function(req, res) {
  Employee.find({}, function(err, foundEmployees) {

      res.render("employee-report", {
        employees: foundEmployees
      })

    }

  )

})



app.get("/employee-form", function(req, res) {
  res.render("employee-form");
})



app.get("/project-form", function(req, res) {
  res.render("project-form");
})



app.get("/project-report", function(req, res) {
  Project.find({}, function(err, foundProjects) {

      res.render("project-report", {
        projects: foundProjects
      });

    }

  )

});



app.get("/ticket", function(req, res) {
  Project.find({}, function(err, foundProjects) {
    Employee.find({}, function(err, foundEmployees) {

      res.render("ticket", {
        employees: foundEmployees,
        projects: foundProjects
      })

    })

  })

})



app.get("/bug-report", function(req, res) {
  BugReport.find({}, function(err, foundBugReports) {

      res.render("bug-report", {
        bugReports: foundBugReports
      })

    }

  )

})




app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html")
})



app.post("/bug-form-edit", function(req, res) {


  const checkedItemId = req.body.update
  console.log(checkedItemId)

  Project.find({}, function(err, foundProjects) {
    Employee.find({}, function(err, foundEmployees) {


      BugReport.findById(checkedItemId, function(err, foundItem)

        {

          if (err) {

            console.log("there was some error");

          }

          res.render('bug-form-edit', {
            bugReport: foundItem,
            employees: foundEmployees,
            projects: foundProjects
          })


        })

    })

  })


});

app.post("/view-details", function(req, res) {


  const checkedItemId = req.body.detailId


  Project.find({}, function(err, foundProjects) {
    Employee.find({}, function(err, foundEmployees) {


      BugReport.findById(checkedItemId, function(err, foundItem)

        {

          if (err) {

            console.log("there was some error");

          }

          res.render('cards', {
            bugReport: foundItem,
            employees: foundEmployees,
            projects: foundProjects
          })


        })

    })

  })


});



app.post("/updateTicket", function(req, res) {

  // console.log(req.body.bugTitle)
  // console.log(req.body.ticketType)


  const emp1 = req.body.emp1
  const emp2 = req.body.emp2
  const emp3 = req.body.emp3
  const proj = req.body.projectName

  Employee.findOne({
    firstName: emp1
  }, function(err, femp1) {
    if (err) {
      console.log("some error is there")
    }
    Employee.findOne({
      firstName: emp2
    }, function(err, femp2) {
      if (err) {
        console.log("some error is there")
      }
      Employee.findOne({
        firstName: emp3
      }, function(err, femp3) {

        if (err) {
          console.log("some error is there")
        }


        Project.findOne({
          projName: proj
        }, function(err, fproj) {
          if (err) {
            console.log("some error is there")
          }
          const projectN = fproj
          const emps = [femp1, femp2, femp3]



          BugReport.findOneAndUpdate({
            bugTitle: req.body.bugTitle
          }, {
            employees: emps,
            bugTitle: req.body.bugTitle,
            projectName: projectN,
            startDate: req.body.startDate,
            ticketType: req.body.ticketType,
            ticketStatus: req.body.ticketStatus,
            deadline: req.body.deadline
          }, function(err, res) {

            if (err) {

              console.log("there was some error");
            }

          })

          res.redirect("/bug-report")
        })
      })
    })

  })


});




app.post("/employee-form", function(req, res) {

  const emp = new Employee({


    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dob: req.body.dob,
    gender: req.body.gender,
    empId:req.body.empId,
    position: req.body.position,
    email: req.body.email,
    contact: req.body.contact,
    city: req.body.city,
    address: req.body.address,
    state: req.body.state,
    zip: req.body.zip

  })
  emp.save();
  if(req.body.firstName == '' ||
    req.body.lastName == '' ||
    req.body.dob == '' ||
    req.body.gender == '' ||
    req.body.empId == '' ||
    req.body.position == '' ||
    req.body.email == '' ||
    req.body.contact == '' ||
    req.body.address == '' ||
    req.body.city == '' ||
    req.body.state == '' ||
    req.body.zip == '' ){
      req.session.message = {
      type: 'danger',
      intro: 'Empty fields! ',
      message: 'Please insert the requested information.'
    }
    res.redirect("/employee-form");
    }else{
      req.session.message = {
      type: 'success',
      intro: 'Details submitted ! ',
      message: 'Employee successfully added'
    }

      res.redirect("/employee-form");

}
});



app.post("/project-form", function(req, res) {
  const project = new Project({
    projName: req.body.projName,
    projType: req.body.projType,
    clientName: req.body.clientName,
    projManager: req.body.projManager,
    fTech: req.body.fTech,
    dbTech: req.body.dbTech,
    projDescription: req.body.projDescription,

  })
  project.save();
  if(req.body.projName == '' ||
    req.body.projType == '' ||
    req.body.clientName == '' ||
    req.body.projManager == '' ||
    req.body.fTech == '' ||
    req.body.dbTech == '' ||
    req.body.projDescription == '' ){
      req.session.message = {
      type: 'danger',
      intro: 'Empty fields! ',
      message: 'Please insert the requested information.'
    }
    res.redirect("/project-form");
  }else{
    req.session.message = {
      type: 'success',
      intro: 'Details submitted ! ',
      message: 'Project successfully added'
    }

    res.redirect("/project-form");
  }

});


app.post("/ticket", function(req, res) {

  const emp1 = req.body.emp1
  const emp2 = req.body.emp2
  const emp3 = req.body.emp3
  const proj = req.body.projectName

  Employee.findOne({
    firstName: emp1
  }, function(err, femp1) {
    if (err) {
      console.log("some error is there")
    }
    Employee.findOne({
      firstName: emp2
    }, function(err, femp2) {
      if (err) {
        console.log("some error is there")
      }
      Employee.findOne({
        firstName: emp3
      }, function(err, femp3) {

        if (err) {
          console.log("some error is there")
        }


        Project.findOne({
          projName: proj
        }, function(err, fproj) {
          if (err) {
            console.log("some error is there")
          }
          const projectN = fproj
          const emps = [femp1, femp2, femp3]

          const bugReport = new BugReport({
            employees: emps,
            bugTitle: req.body.bugTitle,
            projectName: projectN,
            startDate: req.body.startDate,
            ticketType: req.body.ticketType,
            ticketStatus: req.body.ticketStatus,
            ticketDescription: req.body.ticketDescription,
            deadline: req.body.deadline,


          })
          bugReport.save();

          if(emps == '' ||
            req.body.bugTitle == '' ||
            projectN == '' ||
            req.body.startDate == '' ||
            req.body.ticketType == '' ||
            req.body.ticketStatus == '' ||
            req.body.ticketDescription == '' ||
            req.body.deadline == ''){
              req.session.message = {
              type: 'danger',
              intro: 'Empty fields! ',
              message: 'Please insert the requested information.'
            }
            res.redirect("/ticket");
          }else{
            req.session.message = {
              type: 'success',
              intro: 'Details submitted ! ',
              message: 'Ticket successfully added'
            }

            res.redirect("/ticket");
          }


        });
      })
    })

  })

  // Project.findOne({ projName: 'proj' }, function (err, fproj) {
  //
  //   const projectN=fproj
  // });



});

app.post("/delete", function(req, res) {

  const checkedBugId = req.body.ticketId;

  BugReport.findByIdAndRemove(checkedBugId, function(err) {
    if (err) {
      console.log("error in deleting");
    }

  })
  res.redirect("/bug-report");
})


//calender
app.get("/calender", function(req, res){
  res.render("calender")
})


//todo list

app.get("/todo-list", function(req, res) {

  //to render the items from db, {} used it because we want everything
  Item.find( {}, function(err,foundItems){
    if(foundItems.length === 0){
      Item.insertMany( defaultItems, function (err) {
          if(err){
            console.log(err);
          }else{
            console.log("successfully added default items to database");
          }

      });
        res.redirect("/todo-list");
    }else{
      res.render('list', {
        listName: "Today",
        newListItems: foundItems
      });
    }

  });

});

app.post("/todo-list", function(req, res){
  let itemName = req.body.newItem;
  let listName = req.body.list;

  const item = new Item({
    name: itemName
  });

    item.save();
    res.redirect("/todo-list");

})

//deleting item from list
app.post("/todo-delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.listTitle;


    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("item removed");
        res.redirect("/todo-list");
      }
    });


});


app.post("/upload",upload.single('image'), function (req, res, next) {
  // var imageFile= req.file;
  // var imageDetails=new Upload({
  //
  //   imageName:imageFile,
  // })
  // imageDetails.save(function(err,doc){
  //
  //   if(err){
  //     console.log(err)
  //   }else{
  //     res.render("demo")
  //   }
  // });
  var obj = {

       img: {
           data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
           contentType: 'image/png'
       }
   }
   Image.create(obj, (err, item) => {
       if (err) {
           console.log(err);
       }
       else {
           // item.save();
           res.render('demo');
       }
   });
});




app.get('/attachment-list', (req, res) => {
    Image.find({}, (err, items) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render('attachment-list', { items: items });
        }
    });
});






//server
app.listen(3000, function() {
  console.log("Server started at port 3000...");
})
