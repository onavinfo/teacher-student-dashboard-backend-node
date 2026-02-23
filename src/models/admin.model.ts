import mongoose, { Document, Schema } from "mongoose";

export interface IAdmin extends Document {
  userId: mongoose.Types.ObjectId;

  firstName: string;
  lastName: string;
  username?: string;

  phone?: string;
  address?: string;
  file?: string; // profile image path

  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    // 🔗 link to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one admin profile per user
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    file: {
      type: String, // uploaded image path
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAdmin>("Admin", AdminSchema);
