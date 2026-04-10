import mongoose from "mongoose";

// ---------------------------
// History Schema
// ---------------------------
const historySchema = new mongoose.Schema(
  {
    method: String,
    url: String,
    status: String,
    duration: Number,
    time: { type: Date, default: Date.now },
    requestBody: { type: Object, default: {} },
    responseBody: { type: Object, default: {} },
  },
  { _id: true }
);

// ---------------------------
// User Schema
// ---------------------------
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional
    reqCount: { type: Number, default: 0 }, // <-- add this
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
