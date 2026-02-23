import mongoose, { Document, Schema } from "mongoose";

export interface IParent extends Document {
  userId: mongoose.Types.ObjectId; // ref User

  name: string;
  parentId: string;
  address: string;
  childrenNames: string[];

  file?: string | null; // optional profile image
}

const ParentSchema = new Schema<IParent>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ one parent profile per user
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    parentId: {
      type: String,
      required: true,
      trim: true,
      unique: true, // ✅ parent id should be unique
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    childrenNames: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr: string[]) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "At least one child name is required",
      },
    },

    file: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IParent>("Parent", ParentSchema);
