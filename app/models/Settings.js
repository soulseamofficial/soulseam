import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    // COD Advance Payment Settings
    codAdvanceEnabled: {
      type: Boolean,
      default: true,
    },
    codAdvanceAmount: {
      type: Number,
      default: 100,
      min: 0,
    },
  },
  { timestamps: true }
);

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      codAdvanceEnabled: true,
      codAdvanceAmount: 100,
    });
  }
  return settings;
};

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema, "settings");
