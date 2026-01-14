import mongoose from "mongoose";

const ReelSchema = new mongoose.Schema(
  {
    title: { type: String, unique: true, required: true },
    category: { type: String, required: true },
    duration: { type: String, required: true },
    videoUrl: { type: String, required: true }   // ✅ changed
  },
  { timestamps: true }
);

export default mongoose.models.Reel || mongoose.model("Reel", ReelSchema);
