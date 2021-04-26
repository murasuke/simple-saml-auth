var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
import session from 'express-session';

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// 追加ルート
import samlAuth, {samlPassport} from './routes/auth';
import page1 from './routes/page1';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// samlによる認証処理
app.use(session({secret: 'paosiduf'}));
app.use(samlPassport.initialize());
app.use(samlPassport.session());
app.use(samlAuth);

// 認証モジュールの後にルートを追加する(先に認証チェックを行うため)
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/page1', page1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
