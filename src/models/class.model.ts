import mongoose, { Schema, Document } from "mongoose";

export interface IClass extends Document {
  className: string;                 // e.g. "1", "10", "Nursery"
  sectionNames: string[];            // ["A","B","C"]
  classTeacher: mongoose.Types.ObjectId; // Teacher ref
  totalStudents: number;             // cached count
  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },

    // sectionNames: {
    //   type: [String],
    //   default: [],
    //   validate: {
    //     validator: (arr: string[]) =>
    //       arr.every((s) => s.trim().length > 0),
    //     message: "Section names cannot be empty",
    //   },
    // },

    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    totalStudents: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);


// ✅ prevent duplicate same class name (optional)
ClassSchema.index({ className: 1 }, { unique: true });

export default mongoose.model<IClass>("Class", ClassSchema);
