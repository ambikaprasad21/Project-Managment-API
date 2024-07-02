const express = require("express");
const authController = require("../controller/authController");
const isOTPTokenPresent = require("../middleware/isOTPTokenPresent");
const isLoginTokenPresent = require("../middleware/isLoginTokenPresent");
const router = express.Router();

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

router.post("/forgetpassword", authController.forgotPassword);
router.post("/resetpassword/:token", authController.resetPassword);

module.exports = router;
