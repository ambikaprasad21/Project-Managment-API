const express = require("express");
const authController = require("../controller/authController");
const userController = require("../controller/userController");
const isOTPTokenPresent = require("../middleware/isOTPTokenPresent");
const isLoginTokenPresent = require("../middleware/isLoginTokenPresent");
const router = express.Router();

const upload = userController.upload;
//register
// router.route("/signup").post(authController.signup);
router.post("/register/sendotp", authController.sendOtpToUser); //same route will be used for resend token and register

router.post(
  "/verify/otp/register",
  isOTPTokenPresent,
  authController.verifyOTPAndRegister,
  authController.login
);

//login
router.post("/login", authController.login);
router.get(
  "/getloggedInUser",
  isLoginTokenPresent,
  authController.getLoggedInUser
);
router.get("/logout", authController.logout);

//forget password & reset password
router.post("/forgetpassword", authController.forgotPassword);
router.post("/resetpassword/:token", authController.resetPassword);

router.use(authController.protect);

//upload user image
router.post(
  "/upload/profile-picture",
  upload.single("profile-pic"),
  userController.resizeUserPic,
  userController.uploadPic
);

// change password
router.patch("/updatePassword", authController.changePassword);

module.exports = router;