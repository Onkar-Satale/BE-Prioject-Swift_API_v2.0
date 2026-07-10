const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const historySchema = require("./History");

// ---------------------------
// User Schema
// ---------------------------
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Prevent password from being queried by default like PackMate
    reqCount: { type: Number, default: 0 },
    history: { type: [historySchema], default: [] },
    refreshToken: { type: String, select: false }
  },
  { timestamps: true }
);

// Hash password before saving matching PackMate
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password securely matching PackMate
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password completely when returning JSON payload matching PackMate
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
