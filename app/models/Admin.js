import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  sessionToken: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.models.Admin ||
  mongoose.model("Admin", AdminSchema);
