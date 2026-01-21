import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
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
});

export default mongoose.models.Admin ||
  mongoose.model("Admin", AdminSchema);
