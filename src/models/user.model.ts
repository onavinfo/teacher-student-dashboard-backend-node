import mongoose, { Document, Schema } from "mongoose";

export interface IRole {
  _id: string;
  role: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  roleId: mongoose.Types.ObjectId | IRole;

  profileId?: mongoose.Types.ObjectId;
  profileModel?: "Teacher" | "Student" | "Parent" | "Admin";
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    // ✅ NEW
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "profileModel", // 🔥 dynamic reference
    },

    profileModel: {
      type: String,
      enum: ["Teacher", "Student", "Parent", "Admin"],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
