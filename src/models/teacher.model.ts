import mongoose, { Document, Schema } from "mongoose";

export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  bloodType: string;
  birthday: Date;
  gender: "male" | "female";
  file?: string;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ one teacher per user
    },
    username: {
      type: String,
      required: true,
      trim: true,
      // unique: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    bloodType: { type: String, required: true, trim: true },
    birthday: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    file: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<ITeacher>("Teacher", TeacherSchema);
