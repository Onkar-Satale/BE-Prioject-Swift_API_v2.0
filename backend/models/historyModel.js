import mongoose from 'mongoose';

/**
 * Subdocument schema representing an executed API request entry in user history.
 */
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
