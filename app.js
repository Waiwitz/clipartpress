const express = require('express');
const app = express();
// const passport = require('passport');
require("dotenv").config();
const dbConnection = require("./config/database");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const connectFlash = require('connect-flash');
const session = require('express-session');
const userController = require('./controllers/userController')
const router = require('./routes/routes');
const morgan = require('morgan')
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// session
app.use(morgan('dev'));
app.use(cookieParser('secret'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 86400000 1 day
    }
}));

// flash 
app.use(connectFlash());
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.errors = req.flash('errors');
    res.locals.currentMenu = ''
    res.locals.Title = 'Clipart Press'
    next();
});

app.use((req, res, next) => {
    res.locals.login = req.session.isLoggedIn;
    res.locals.session = req.session;
    next();
});

app.use(function (err, req, res, next) {
    console.log(err);
});



// app.use((req, res, next) => {
//     res.locals.errors = req.flash('errors')
// })



router(app)
// app.use("/", require("./routes"));
const port = 3000
app.listen(port, () => {
    console.log(`App listening at port ${port}`)
}); 