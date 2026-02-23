import mongoose, { Document, Schema } from "mongoose";
export interface Irole extends Document {
  role: string;
}

const RoleSchema: Schema<Irole> = new Schema(
  {
    role: {
      type: String,
      default: "Student",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model<Irole>("Role", RoleSchema);
