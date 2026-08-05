import mongoose from 'mongoose';

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

export default historySchema;
