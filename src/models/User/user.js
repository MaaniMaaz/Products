const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: ".././src/config/config.env" });
const validator = require("validator");
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email");
      }
    },
  },
  password: {
    type: String,
    // required: true,
    //validation will be before saving to db
  },
  phone: {
    type: String,
    // required: true,
    // unique: true,
    // validate(value) {
    //   if (!validator.isMobilePhone(value)) {
    //     throw new Error("Invalid Phone Number");
    //   }
    // }
    default: null
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  passwordResetToken: {
    type: Number,
  },
  passwordResetTokenExpires: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  provider: {
    type:String,
    default: "app"
  },
  athleticDetails: {
    type: {
      age: {
        type: Number,
      },
      height: {
        type: Number,
      },
      foot: {
        type: String,
        enum: ["left", "right", "Left", "Right"],
      },
      preferredPosition: {
        type: String,
      },
      skillsAndAttributes: {
        type: String,
      },
      country: {
        type: String,
      },
      state: {
        type: String,
      },
      bio: {
        type: String,
      },
      profileImage: {
        type: String,
        default: null,
      },
      fullImage: {
        type: String,
      },
      city: {
        type: String,
      },
      availability: {
        type: String,
      },
      experience: {
        type: String,
      },
    },
    default: null,
  },

  country: {
    type: String,
    // required: true,
  },
  zip: {
    type: String,
    // required: true,
  },

  performance: {
    goals: {
      type: Number,
      default: 0,
    },
    assist: {
      type: Number,
      default: 0,
    },
    cleansheets: {
      type: Number,
      default: 0,
    },
  },
  deviceToken: {
    type: String,
    default: null,
  },
  isNotificationEnabled: {
    type: Boolean,
    default: true,
  },
});

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

const user = mongoose.model("User", userSchema);

module.exports = user;
