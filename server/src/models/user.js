const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
	email: {
	  type: String,
	  required: true,
	  unique: true,
	  trim: true,
	  lowercase: true,
	  validate(value) {
		if (!validator.isEmail(value)) {
		  throw new Error("Email is invalid");
		}
	  },
	},
	password: {
	  type: String,
	  required: true,
	  trim: true,
	  minlength: 7,
	  validate(value) {
		if (value.toLowerCase().includes("password")) {
		  throw new Error('Must not declare password as "password"');
		}
	  },
	},
	tokens: [
	  {
		token: {
		  type: String,
		  required: true,
		},
	  },
	],
  },
  {
	timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "mysecretkey");

  user.tokens = await user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({
	email: email,
  });

  if (!user) {
	throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
	throw new Error("Unable to login");
  }

  return user;
};

// Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
	user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
