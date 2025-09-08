const mongoose = require("mongoose");
const { Schema } = mongoose;
const validator = require("validator");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userSchema = new Schema(
  {
    name: {
      type: String,
     required:true
    },
    email: {
      type: String,
      unique:true,
     required:true,
     validate(value) {
           if (!validator.isEmail(value)) {
             throw new Error("Invalid Email");
           }
         },
    },
    password: {
      type: String,
     required:true
    },
    passwordResetToken: {
      type: Number,
    },
    passwordResetTokenExpires: {
      type: Date,
    },
    emailVerificationToken: {
      type: Number,
    },
    emailVerificationTokenExpires: {
      type: Date,
    },
   
    isEmailVerified: {
      type: Boolean,
     default:false
    },
   
    role: {
      type: String,
      enum:["user","admin"],
     default:"user"
    },
   
  },
  { timestamps: true }
);


//hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//jwtToken
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
};

//compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model("User", userSchema);
module.exports = User;
