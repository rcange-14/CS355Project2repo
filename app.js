var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
require("dotenv").config();
const { connectToDB } = require('./models/db');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var tutorRouter = require('./routes/tutor');
var profileRouter = require('./routes/profile');

var app = express();
(async () => {
  try {
    await connectToDB();
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to start database:', error);
  }
})();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'cs355-tutor-app-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 hour session
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tutor', tutorRouter);
app.use('/profile', profileRouter);


app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {
 
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
