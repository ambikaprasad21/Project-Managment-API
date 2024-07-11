/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prettier/prettier */
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const authController = require('./controller/authController');
const userRouter = require('./routes/userRoute');
const projectRouter = require('./routes/projectRoute');
const memberRouter = require('./routes/memberRoute');
const taskRouter = require('./routes/taskRoute');
const commentRouter = require('./routes/commentRoute');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  console.log('👋 Hello this is new Project managemnt server');
  next();
});

app.use('/pm/api/v1/user', userRouter);
app.use(authController.protect);
app.use('/pm/api/v1/project', projectRouter);
app.use('/pm/api/v1/member', memberRouter);
app.use('/pm/api/v1/task/', taskRouter);
app.use('/pm/api/v1/comment/', commentRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
