var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

// 加载环境变量配置
const dotenv = require('dotenv');
const envResult = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (envResult.error) {
  console.error('无法加载.env文件:', envResult.error);
} else {
  console.log('.env文件已成功加载');
  console.log('环境变量NODE_ENV =', process.env.NODE_ENV);
}

// 数据库连接
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// 路由
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

// 测试数据库连接
testConnection();

// 同步数据库模型（所有环境）
syncDatabase(false); // false表示不强制重建表，仅创建不存在的表

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// 启用CORS - 开发环境配置
app.use(cors({
  origin: 'http://localhost:3001', // 允许前端地址
  credentials: true, // 允许跨域请求携带cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 路由注册
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

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
