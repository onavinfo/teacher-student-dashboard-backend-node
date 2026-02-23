import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubject extends Document {
  subject: string;
  teachers: Types.ObjectId[]; // refs to Teacher
  createdAt: Date;
  updatedAt: Date;
classId?: Types.ObjectId | string;

}

const subjectSchema = new Schema<ISubject>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      unique: true, // no duplicate subject names
    },




    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISubject>("Subject", subjectSchema);
