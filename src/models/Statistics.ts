import mongoose, { Schema, Document } from "mongoose";

export interface IStatistics extends Document {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalBoys: number;
  totalGirls: number;
}

const statisticsSchema = new Schema<IStatistics>(
  {
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalTeachers: {
      type: Number,
      default: 0,
    },
    totalParents: {
      type: Number,
      default: 0,
    },
    totalBoys: {
      type: Number,
      default: 0,
    },
    totalGirls: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IStatistics>(
  "Statistics",
  statisticsSchema
);
