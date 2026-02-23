import mongoose, { Document, Schema } from "mongoose";

export interface IRole {
  _id: string;
  role: string;
}

export interface IStudent extends Document {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  bloodType: string;
  birthday: Date;
  gender: "male" | "female"; 
  file?: string;
  classId:mongoose.Types.ObjectId,
  userId:mongoose.Types.ObjectId
  
  // email: string;
  // password: string;
  // Student-specific fields
  // rollNumber: string;
  // admissionNumber: string;
  // grade: string;          // e.g. "10"
  // section: string;        // e.g. "A"
  // admissionDate: Date;

  // guardianName: string;
  // guardianPhone: string;

  // isActive: boolean;

  // roleId: mongoose.Types.ObjectId | IRole;
}

const StudentSchema = new Schema<IStudent>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
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

    // email: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   lowercase: true,
    //   trim: true,
    // },

    // password: {
    //   type: String,
    //   required: true,
    //   minlength: 6,
    // },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    bloodType: {
      type: String,
      required: true,
    },

    birthday: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },

    file: {
      type: String,
      default: null,
    },
     classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },

    // // 🎓 Student fields
    // rollNumber: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   trim: true,
    // },

    // admissionNumber: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   trim: true,
    // },

    // grade: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    // section: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    // admissionDate: {
    //   type: Date,
    //   required: true,
    // },

    // guardianName: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    // guardianPhone: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    // isActive: {
    //   type: Boolean,
    //   default: true,
    // },

    // roleId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Role",
    //   required: true,
    // },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>("Student", StudentSchema);
