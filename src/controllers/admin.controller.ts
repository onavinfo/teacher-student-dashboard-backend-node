
import  type{ Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Role from"../models/role.model.js"
import mongoose, { Types } from "mongoose";
import Student from"../models/student.model.js"
import Teacher from"../models/teacher.model.js"
import Parent from "../models/parent.model.js";
import Subject from "../models/subjects.model.js";
import Admin from "../models/admin.model.js";
import Class from "../models/class.model.js";
import Statistics from "../models/Statistics.js";
import conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js"

type Params = { id: string };
type ConversationParams = { conversationId: string };
type Body = {otherUserId: string;};

//get stats
export const getStatistics = async (req: Request, res: Response) => {
  try {
    // ✅ keep only ONE stats document
    let stats = await Statistics.findOne();

    // if not exists, create it once
    if (!stats) {
      stats = await Statistics.create({});
    }

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};



//create admin
export const createAdmin = async (req:Request, res:Response) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    // 1️⃣ find admin role
    const role = await Role.findOne({ role: "admin" });
    if (!role) {
      return res.status(400).json({ message: "Admin role not found" });
    }

    // 2️⃣ hash password
    const hashed = await bcrypt.hash(password, 10);

    // 3️⃣ create user
    const user = await User.create({
      email,
      password: hashed,
      roleId: role._id,
    });

    // 4️⃣ create admin profile
    const adminProfile = await Admin.create({
      userId: user._id,
      firstName,
      lastName,
      username,
    });

    // 5️⃣ link profile back to user 🔥
    user.profileId = adminProfile._id;
    user.profileModel = "Admin";
    await user.save();

    res.json({
      success: true,
      message: "Admin created",
      data: adminProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


//teachers
export const addteacher = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      username,
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      bloodType,
      birthday,
      gender,
    } = req.body;

    const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ clean username (prevents null)
    const cleanUsername = String(username || "").trim();
    if (!cleanUsername) {
      return res.status(400).json({ message: "Username is required", success: false, error: true });
    }

    if (
      !firstName || !lastName || !email || !password || !phone || !address || !bloodType || !birthday || !gender
    ) {
      return res.status(400).json({ message: "All fields are required", success: false, error: true });
    }

    if (!profilePicUrl) {
      return res.status(400).json({ message: "Profile image is required", success: false, error: true });
    }

    // ✅ check auth user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists", success: false, error: true });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ create auth user
    const user = await User.create({
      email,
      password: hashedPassword,
      roleId: new mongoose.Types.ObjectId("6979be347fa81780a1b8b05c"),
    });


    // ✅ create teacher profile
    const teacher = await Teacher.create({
      userId: user._id,
      username: cleanUsername,
      firstName,
      lastName,
      phone,
      address,
      bloodType,
      birthday: new Date(birthday),
      gender,
      file: profilePicUrl,
    });


   
await User.findByIdAndUpdate(user._id, {
  profileId: teacher._id,
  profileModel: "Teacher",
});

 await Statistics.updateOne( {}, {  $inc: { totalTeachers: 1},});

    return res.status(201).json({
      message: "Teacher created successfully",
      success: true,
      error: false,
      data: { user, teacher },
    });
  } catch (error: any) {
    console.error("ADD TEACHER ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: `Duplicate value for: ${Object.keys(error.keyValue).join(", ")}`,
        success: false,
        error: true,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      message: error?.message || "Server error",
      success: false,
      error: true,
    });
  }
};

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) query params
    const page = Math.max(parseInt(String(req.query.page || "1")), 1);
    const limit = Math.max(parseInt(String(req.query.limit || "10")), 1);

    // 2) skip formula
    const skip = (page - 1) * limit;

    // 3) fetch data + total
    const [teachers, total] = await Promise.all([
      Teacher.find()
        .populate({
          path: "userId",
          select: "email roleId", // never send password
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Teacher.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: teachers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
    });
  }
};

export const getTeacherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id).populate({
      path: "userId",
      select: "email roleId", // never send password
    });

    if (!teacher) {
      res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("GET TEACHER BY ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher",
    });
  }
};
export const updateTeacher = async (req: Request<Params>, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // ✅ teacherId (profile _id)

    const {
      username,
      firstName,
      lastName,
      email,
      password, // optional on update
      phone,
      address,
      bloodType,
      birthday,
      gender,
    } = req.body;

    // ✅ find teacher profile
  const teacher = await Teacher.findOne({ userId: id }); // ✅ id is userId

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
        success: false,
        error: true,
      });
    }

    // ✅ if a new image uploaded
    const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ clean username only if provided
    const cleanUsername = username ? String(username).trim() : undefined;

    // ✅ username unique check (only if changed)
    if (cleanUsername && cleanUsername !== teacher.username) {
      const existingUsername = await Teacher.findOne({
        username: cleanUsername,
        _id: { $ne: teacher._id },
      });

      if (existingUsername) {
        return res.status(409).json({
          message: "Username already exists",
          success: false,
          error: true,
        });
      }
    }

    // ✅ update teacher profile fields (only if provided)
    if (cleanUsername) teacher.username = cleanUsername;
    if (firstName) teacher.firstName = firstName;
    if (lastName) teacher.lastName = lastName;
    if (phone) teacher.phone = phone;
    if (address) teacher.address = address;
    if (bloodType) teacher.bloodType = bloodType;
    if (birthday) teacher.birthday = new Date(birthday);
    if (gender) teacher.gender = gender;
    if (profilePicUrl) teacher.file = profilePicUrl;

    await teacher.save();

    // ✅ update auth user (email/password) via userId ref
    if (email || password) {
      const user = await User.findById(teacher.userId);
      if (!user) {
        return res.status(404).json({
          message: "Auth user not found",
          success: false,
          error: true,
        });
      }

      // ✅ email unique check (only if changed)
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({
          email: String(email).trim().toLowerCase(),
          _id: { $ne: user._id },
        });

        if (existingEmail) {
          return res.status(409).json({
            message: "Email already exists",
            success: false,
            error: true,
          });
        }

        user.email = String(email).trim().toLowerCase();
      }

      // ✅ update password only if provided
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save();
    }

    // ✅ return updated teacher with populated user (email/role only)
    const updated = await Teacher.findById(teacher._id).populate({
      path: "userId",
      select: "email roleId",
    });

    return res.status(200).json({
      message: "Teacher updated successfully",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error: any) {
    console.error("UPDATE TEACHER ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: `Duplicate value for: ${Object.keys(error.keyValue).join(", ")}`,
        success: false,
        error: true,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      message: error?.message || "Server error",
      success: false,
      error: true,
    });
  }
};



//students

export const addstudent = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      username,
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      bloodType,
      birthday,
      gender,
      classId,
    } = req.body;

    const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ basic validation
    if (
      !username ||
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phone ||
      !address ||
      !bloodType ||
      !birthday ||
      !gender ||
      !classId
    ) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!profilePicUrl) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Profile image is required" });
    }

    // ✅ check class exists
    const classDoc = await Class.findById(classId).session(session);
    if (!classDoc) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // ✅ check email duplicate
    const exists = await User.findOne({ email }).session(session);
    if (exists) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ create user
    const user = await new User({
      email,
      password: hashedPassword,
      roleId: new mongoose.Types.ObjectId("6979be257fa81780a1b8b05a"), // student role
    }).save({ session });

    // ✅ create student
    const student = await new Student({
      userId: user._id,
      username: String(username).trim(),
      firstName,
      lastName,
      phone,
      address,
      bloodType,
      birthday: new Date(birthday),
      gender,
      file: profilePicUrl,
      classId: classId,
    }).save({ session });

    // ✅ link profile to user
    user.profileId = student._id;
    user.profileModel = "Student";
    await user.save({ session });

    // ✅ ATOMIC increment (best practice)
    // Important: ensure schema field is EXACTLY "totalStudents"
    await Class.updateOne(
      { _id: classId },
      { $inc: { totalStudents: 1 } },
      { session }
    );
// after Student.create(...) succeeds

 await Statistics.updateOne(
  {},
  {
    $inc: {
      totalStudents: 1,
      totalBoys: gender === "male" ? 1 : 0,
      totalGirls: gender === "female" ? 1 : 0,
    },
  }
);

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: { user, student },
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  } finally {
    session.endSession();
  }
};


export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ read query params
    const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
    const limit = Math.max(parseInt(String(req.query.limit || "10"), 10), 1);
    const skip = (page - 1) * limit;

    // ✅ total count
    const total = await Student.countDocuments();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    // ✅ paginated query
    const students = await Student.find()
      .populate({
        path: "userId",
        select: "email roleId", // never include password
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate({
      path: "userId",
      select: "email roleId", // never include password
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("GET STUDENT BY ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student",
    });
  }
};
export const updateStudent = async (
  req: Request<Params>,
  res: Response
): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // userId

    const {
      username,
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      bloodType,
      birthday,
      gender,
      classId,
      removeImage,
    } = req.body;

    // ✅ find student by userId
    const student = await Student.findOne({ userId: id }).session(session);
    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({
        message: "Student not found",
        success: false,
        error: true,
      });
    }

    // ✅ keep old classId for comparison
    const oldClassId = student.classId ? String(student.classId) : null;
    const newClassId = classId ? String(classId) : null;

    // ✅ CLASS CHANGE + UPDATE COUNTS
    if (newClassId && newClassId !== oldClassId) {
      const classExists = await Class.findById(newClassId).session(session);
      if (!classExists) {
        await session.abortTransaction();
        return res.status(404).json({
          message: "Class not found",
          success: false,
          error: true,
        });
      }

      // ✅ decrement old class count (if exists)
      if (oldClassId) {
        await Class.updateOne(
          { _id: oldClassId },
          { $inc: { totalStudents: -1 } },
          { session }
        );
      }

      // ✅ increment new class count
      await Class.updateOne(
        { _id: newClassId },
        { $inc: { totalStudents: 1 } },
        { session }
      );

      // ✅ update student's classId
      student.classId = new mongoose.Types.ObjectId(newClassId);
    }

    // ✅ image update
    if (req.file) {
      student.file = `/uploads/${req.file.filename}`;
    }

    // ✅ remove image if requested
    // if (removeImage === "true" || removeImage === true) {
    //   student.file = null;
    // }

    // ✅ username unique check only if changed
    if (username && username.trim() !== student.username) {
      const existingUsername = await Student.findOne({
        username: username.trim(),
        _id: { $ne: student._id },
      }).session(session);

      if (existingUsername) {
        await session.abortTransaction();
        return res.status(409).json({
          message: "Username already exists",
          success: false,
          error: true,
        });
      }

      student.username = username.trim();
    }

    // ✅ update student fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (phone) student.phone = phone;
    if (address) student.address = address;
    if (bloodType) student.bloodType = bloodType;
    if (birthday) student.birthday = new Date(birthday);
    if (gender) student.gender = gender;

    await student.save({ session });

    // ✅ update auth user (email/password)
    if (email || password) {
      const user = await User.findById(student.userId).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({
          message: "Auth user not found",
          success: false,
          error: true,
        });
      }

      // ✅ email unique check only if changed
      if (email && email.trim().toLowerCase() !== user.email) {
        const newEmail = email.trim().toLowerCase();

        const existingEmail = await User.findOne({
          email: newEmail,
          _id: { $ne: user._id },
        }).session(session);

        if (existingEmail) {
          await session.abortTransaction();
          return res.status(409).json({
            message: "Email already exists",
            success: false,
            error: true,
          });
        }

        user.email = newEmail;
      }

      // ✅ update password only if provided
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // ✅ return updated student with populated user
    const updated = await Student.findById(student._id).populate({
      path: "userId",
      select: "email roleId",
    });

    return res.status(200).json({
      message: "Student updated successfully",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error("UPDATE STUDENT ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: `Duplicate value for: ${Object.keys(error.keyValue).join(", ")}`,
        success: false,
        error: true,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      message: error?.message || "Server error",
      success: false,
      error: true,
    });
  }
};



//Parent

export const addparent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, parentId, address, childrenNames } = req.body;

    // const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ clean + validate
   // basic required check
if (!name || !email || !password || !parentId || !address) {
  return res.status(400).json({
    message: "All fields are required",
    success: false,
    error: true,
  });
}

// light normalize only where useful
const cleanName = name.trim();
const cleanEmail = email.trim().toLowerCase();

// image required (same as teacher)
// if (!profilePicUrl) {
//   return res.status(400).json({
//     message: "Profile image is required",
//     success: false,
//     error: true,
//   });
// }


    // ✅ normalize childrenNames
    // accepts: ["Rahul","Priya"] OR "Rahul, Priya"
    let childrenArray: string[] = [];
    if (Array.isArray(childrenNames)) {
      childrenArray = childrenNames.map((c) => String(c).trim()).filter(Boolean);
    } else if (typeof childrenNames === "string") {
      childrenArray = childrenNames.split(",").map((c) => c.trim()).filter(Boolean);
    }

    if (childrenArray.length === 0) {
      return res.status(400).json({
        message: "Children names are required",
        success: false,
        error: true,
      });
    }

    // ✅ check auth user
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists",
        success: false,
        error: true,
      });
    }

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ create auth user
    const user = await User.create({
      email: cleanEmail,
      password: hashedPassword,
      roleId: new mongoose.Types.ObjectId("6979be477fa81780a1b8b05e"),
    });

    // ✅ create parent profile
    const parent = await Parent.create({
      userId: user._id,
      name: cleanName,
      parentId,
      address,
      childrenNames: childrenArray,
      // file: profilePicUrl,
    });

          user.profileId = parent._id;
       user.profileModel = "Parent";
      await user.save()
         await Statistics.updateOne({},{  $inc: { totalParents: 1},});

    return res.status(201).json({
      message: "Parent created successfully",
      success: true,
      error: false,
      data: { user, parent },
    });
  } catch (error: any) {
    console.error("ADD PARENT ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: `Duplicate value for: ${Object.keys(error.keyValue).join(", ")}`,
        success: false,
        error: true,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      message: error?.message || "Server error",
      success: false,
      error: true,
    });
  }
};

export const getParents = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ read query params
    const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
    const limit = Math.max(parseInt(String(req.query.limit || "10"), 10), 1);
    const skip = (page - 1) * limit;

    // ✅ total count
    const total = await Parent.countDocuments();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    // ✅ paginated query
    const parents = await Parent.find()
      .populate({
        path: "userId",
        select: "email roleId", // never send password
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: parents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET PARENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch parents",
    });
  }
};

export const updateParent = async (req: Request<Params>, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // ✅ userId

    const { name, email, password, parentId, address, childrenNames } = req.body;

    // ✅ find parent profile by userId
    const parent = await Parent.findOne({ userId: id });
    if (!parent) {
      return res.status(404).json({
        message: "Parent not found",
        success: false,
        error: true,
      });
    }

    // ✅ optional image update (if you later enable file upload)
    const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ normalize childrenNames (optional)
    let childrenArray: string[] | undefined = undefined;
    if (childrenNames !== undefined) {
      if (Array.isArray(childrenNames)) {
        childrenArray = childrenNames.map((c) => String(c).trim()).filter(Boolean);
      } else if (typeof childrenNames === "string") {
        childrenArray = childrenNames.split(",").map((c) => c.trim()).filter(Boolean);
      } else {
        childrenArray = [];
      }

      if (childrenArray.length === 0) {
        return res.status(400).json({
          message: "Children names are required",
          success: false,
          error: true,
        });
      }
    }

    // ✅ update parent profile fields (only if provided)
    if (name) parent.name = String(name).trim();
    if (parentId) parent.parentId = String(parentId).trim();
    if (address) parent.address = String(address).trim();
    if (childrenArray) parent.childrenNames = childrenArray;
    if (profilePicUrl) parent.file = profilePicUrl;

    await parent.save();

    // ✅ update auth user (email/password)
    if (email || password) {
      const user = await User.findById(parent.userId);
      if (!user) {
        return res.status(404).json({
          message: "Auth user not found",
          success: false,
          error: true,
        });
      }

      // ✅ email unique check (only if changed)
      if (email) {
        const cleanEmail = String(email).trim().toLowerCase();

        if (cleanEmail !== user.email) {
          const existingEmail = await User.findOne({
            email: cleanEmail,
            _id: { $ne: user._id },
          });

          if (existingEmail) {
            return res.status(409).json({
              message: "Email already exists",
              success: false,
              error: true,
            });
          }

          user.email = cleanEmail;
        }
      }

      // ✅ update password only if provided
      if (password) {
        user.password = await bcrypt.hash(String(password), 10);
      }

      await user.save();
    }

    // ✅ return updated parent with populated user (email/role only)
    const updated = await Parent.findById(parent._id).populate({
      path: "userId",
      select: "email roleId",
    });

    return res.status(200).json({
      message: "Parent updated successfully",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error: any) {
    console.error("UPDATE PARENT ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: `Duplicate value for: ${Object.keys(error.keyValue).join(", ")}`,
        success: false,
        error: true,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      message: error?.message || "Server error",
      success: false,
      error: true,
    });
  }
};


//subjects
export const createSubject = async (req: Request, res: Response): Promise<any> => {
  try {
    const { subject, teachers } = req.body;

    // ✅ basic validation
    if (!subject) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Subject is required",
      });
    }

    // ✅ normalize subject
    const cleanSubject = String(subject).trim();
    if (!cleanSubject) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Subject is required",
      });
    }

    // ✅ normalize teachers input
    // accepts: ["id1","id2"] OR "id1,id2"
    let teacherIds: string[] = [];

    if (Array.isArray(teachers)) {
      teacherIds = teachers.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof teachers === "string") {
      teacherIds = teachers.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // (optional) allow empty teachers list, or enforce at least 1:
    if (teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "At least one teacher is required",
      });
    }

    // ✅ validate ObjectIds
    const invalidIds = teacherIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Invalid teacher id(s): ${invalidIds.join(", ")}`,
      });
    }

    // ✅ check subject already exists
    const existingSubject = await Subject.findOne({ subject: cleanSubject });
    if (existingSubject) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "Subject already exists",
      });
    }

    // ✅ check teachers exist
    const foundTeachers = await Teacher.countDocuments({ _id: { $in: teacherIds } });
    if (foundTeachers !== teacherIds.length) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "One or more teachers not found",
      });
    }

    // ✅ create subject
    const newSubject = await Subject.create({
      subject: cleanSubject,
      teachers: teacherIds,
    });

    // ✅ return populated response
    const created = await Subject.findById(newSubject._id).populate({
      path: "teachers",
      select: "firstName lastName username file userId",
      populate: { path: "userId", select: "email" },
    });

    return res.status(201).json({
      success: true,
      error: false,
      message: "Subject created successfully",
      data: created,
    });
  } catch (error: any) {
    console.error("CREATE SUBJECT ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: true,
        message: `Duplicate value for: ${Object.keys(error.keyValue).join(", ")}`,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Server error",
    });
  }
};

export const getTeacherIdsWithRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const teachers = await Teacher.find()
      .select("_id userId firstName lastName username") // teacher fields you want
      .populate({
        path: "userId",
        select: "_id email roleId", // ✅ roleId is in User
      })
      .sort({ createdAt: -1 });

    // Optional: return only what you need
    const data = teachers.map((t: any) => ({
      teacherId: t._id,
      userId: t.userId?._id,
      email: t.userId?.email,
      roleId: t.userId?.roleId,
      username: t.username,
      name: `${t.firstName} ${t.lastName}`,
    }));

    return res.status(200).json({
      success: true,
      error: false,
      data,
    });
  } catch (error) {
    console.error("GET TEACHER IDS+ROLE ERROR:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Failed to fetch teacher ids and role",
    });
  }
};


export const getSubjects = async (req: Request, res: Response): Promise<any> => {
  try {
    // ✅ pagination params
    const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
    const limit = Math.max(parseInt(String(req.query.limit || "10"), 10), 1);
    const skip = (page - 1) * limit;

    // ✅ total count (for totalPages)
    const total = await Subject.countDocuments();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    // ✅ paginated query
    const subjects = await Subject.find()
      .select("_id subject teachers") // ✅ subject id + subject name
      .populate({
        path: "teachers",
        select: "firstName lastName username",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // ✅ same response mapping as before
    const data = subjects.map((s: any) => ({
      _id: s._id, // ✅ keep _id too (useful for update/delete)
      subId: s._id,
      subjectName: s.subject,
      teachers: (s.teachers || []).map((t: any) =>
        `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || t.username || "Teacher"
      ),
    }));

    return res.status(200).json({
      success: true,
      error: false,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET SUBJECTS ERROR:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Failed to fetch subjects",
    });
  }
};

export const updateSubject = async (req: Request<Params>, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // ✅ subject id from params
    const { subject, teachers } = req.body;

    // ✅ validate subject id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid subject id",
      });
    }

    // ✅ must send at least one field
    if (subject === undefined && teachers === undefined) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Nothing to update",
      });
    }

    // ✅ find subject first
    const existing = await Subject.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Subject not found",
      });
    }

    // ✅ normalize subject (if provided)
    let cleanSubject: string | undefined = undefined;
    if (subject !== undefined) {
      cleanSubject = String(subject).trim();
      if (!cleanSubject) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Subject is required",
        });
      }

      // ✅ check duplicate subject name (excluding current)
      const duplicate = await Subject.findOne({
        subject: cleanSubject,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: true,
          message: "Subject already exists",
        });
      }
    }

    // ✅ normalize teachers (if provided)
    let teacherIds: string[] | undefined = undefined;

    if (teachers !== undefined) {
      if (Array.isArray(teachers)) {
        teacherIds = teachers.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof teachers === "string") {
        teacherIds = teachers.split(",").map((t) => t.trim()).filter(Boolean);
      } else {
        teacherIds = [];
      }

      if (teacherIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "At least one teacher is required",
        });
      }

      // ✅ validate ObjectIds
      const invalidIds = teacherIds.filter((tid) => !mongoose.Types.ObjectId.isValid(tid));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `Invalid teacher id(s): ${invalidIds.join(", ")}`,
        });
      }

      // ✅ check teachers exist
      const foundTeachers = await Teacher.countDocuments({ _id: { $in: teacherIds } });
      if (foundTeachers !== teacherIds.length) {
        return res.status(404).json({
          success: false,
          error: true,
          message: "One or more teachers not found",
        });
      }
    }

    // ✅ build update object only with provided fields
    const updateData: Record<string, any> = {};
    if (cleanSubject !== undefined) updateData.subject = cleanSubject;
    if (teacherIds !== undefined) updateData.teachers = teacherIds;

    // ✅ update
    await Subject.findByIdAndUpdate(id, updateData, { new: false });

    // ✅ return populated updated doc
    const updated = await Subject.findById(id).populate({
      path: "teachers",
      select: "firstName lastName username file userId",
      populate: { path: "userId", select: "email" },
    });

    return res.status(200).json({
      success: true,
      error: false,
      message: "Subject updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("UPDATE SUBJECT ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: true,
        message: `Duplicate value for: ${Object.keys(error.keyValue).join(", ")}`,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Server error",
    });
  }
};

//clases
export const createClass = async (req: Request, res: Response): Promise<any> => {
  try {
    const { className, classTeacher, description } = req.body;

    // ✅ validate className
    const cleanClassName = String(className ?? "").trim();
    if (!cleanClassName) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "className is required",
      });
    }

    // ✅ validate teacher id
    if (!classTeacher || !mongoose.Types.ObjectId.isValid(classTeacher)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Valid classTeacher is required",
      });
    }

    // ✅ check duplicate class name
    const existing = await Class.findOne({ className: cleanClassName });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "Class already exists",
      });
    }

    // ✅ ensure teacher exists
    const teacherExists = await Teacher.exists({ _id: classTeacher });
    if (!teacherExists) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Class teacher not found",
      });
    }

    // ✅ create class (NO sections)
    const created = await Class.create({
      className: cleanClassName,
      classTeacher: new mongoose.Types.ObjectId(classTeacher),
      description: description ? String(description).trim() : "",
      totalStudents: 0,
    });

    // ✅ populate teacher
    const data = await Class.findById(created._id).populate({
      path: "classTeacher",
      select: "firstName lastName username file userId",
      populate: { path: "userId", select: "email" },
    });

    return res.status(201).json({
      success: true,
      error: false,
      message: "Class created successfully",
      data,
    });
  } catch (error: any) {
    console.error("CREATE CLASS ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: true,
        message: `Duplicate value for: ${Object.keys(error.keyValue || {}).join(", ")}`,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Server error",
    });
  }
};

export const updateClass = async (req: Request<Params>, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { className, sectionNames, classTeacher, description } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid class id",
      });
    }

    // must send something
    if (
      className === undefined &&
      sectionNames === undefined &&
      classTeacher === undefined &&
      description === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Nothing to update",
      });
    }

    const existing = await Class.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Class not found",
      });
    }

    const updateData: Record<string, any> = {};

    // ✅ update className
    if (className !== undefined) {
      const cleanClassName = String(className).trim();
      if (!cleanClassName) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "className cannot be empty",
        });
      }

      const duplicate = await Class.findOne({
        className: cleanClassName,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: true,
          message: "Class name already exists",
        });
      }

      updateData.className = cleanClassName;
    }

    // ✅ update sections
    if (sectionNames !== undefined) {
      let sections: string[] = [];
      if (Array.isArray(sectionNames)) {
        sections = sectionNames
          .map((s) => String(s).trim())
          .filter(Boolean);
      } else if (typeof sectionNames === "string") {
        sections = sectionNames
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      sections = Array.from(new Set(sections.map((s) => s.toUpperCase())));
      updateData.sectionNames = sections;
    }

    // ✅ update class teacher
    if (classTeacher !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(classTeacher)) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Invalid classTeacher id",
        });
      }

      const teacherExists = await Teacher.exists({ _id: classTeacher });
      if (!teacherExists) {
        return res.status(404).json({
          success: false,
          error: true,
          message: "Class teacher not found",
        });
      }

      updateData.classTeacher = classTeacher;
    }

    // ✅ update description
    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : "";
    }

    await Class.findByIdAndUpdate(id, updateData, { new: false });

    const data = await Class.findById(id).populate({
      path: "classTeacher",
      select: "firstName lastName username file userId",
      populate: { path: "userId", select: "email" },
    });

    return res.status(200).json({
      success: true,
      error: false,
      message: "Class updated successfully",
      data,
    });
  } catch (error: any) {
    console.error("UPDATE CLASS ERROR:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: true,
        message: `Duplicate value for: ${Object.keys(error.keyValue || {}).join(", ")}`,
        keyValue: error.keyValue,
      });
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Server error",
    });
  }
};


export const getAllClasses = async (req: Request, res: Response): Promise<any> => {
  try {
    // ✅ read page/limit from query (with defaults)
    const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
    const limit = Math.max(parseInt(String(req.query.limit || "10"), 10), 1);
    const skip = (page - 1) * limit;

    // ✅ total count (for totalPages)
    const total = await Class.countDocuments();

    // ✅ paginated data
    const data = await Class.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "classTeacher",
        select: "firstName lastName file userId",
        populate: { path: "userId", select: "email" },
      });

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Classes fetched successfully",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET CLASSES ERROR:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Server error",
    });
  }
};
export const getClassById = async (req: Request<Params>, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid class id",
      });
    }

    const data = await Class.findById(id).populate({
      path: "classTeacher",
      select: "firstName lastName username file userId",
      populate: { path: "userId", select: "email" },
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Class not found",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "Class fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error("GET CLASS BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Server error",
    });
  }
};

export const deleteClass = async (req: Request<Params>, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid class id",
      });
    }

    const existing = await Class.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Class not found",
      });
    }

    await Class.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Class deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE CLASS ERROR:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error?.message || "Server error",
    });
  }
};

//delete
export const deleteuser = async (req:Request<Params>,res: Response): Promise<any> => {
  try {
    const { id } = req.params; // ✅ userId

    // 1️⃣ Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const roleId = String(user.roleId);

    // 2️⃣ Delete profile based on role
    if (roleId === "6979be347fa81780a1b8b05c") {
      // ✅ teacher role
      await Teacher.deleteOne({ userId: id });
      const teacher =   await Teacher.findOne({ userId: id });
      if(teacher){
            await Statistics.updateOne({}, { $inc: {totalTeachers: -1}});
          }

    }

    //delete parent
    if (roleId === "6979be477fa81780a1b8b05e") {
      // ✅ Parent role
      await Parent.deleteOne({ userId: id });
      const parent =   await Teacher.findOne({ userId: id });
      if(parent){
            await Statistics.updateOne({}, { $inc: {totalParents: -1}});
          }

    }

    if (roleId === "6979be257fa81780a1b8b05a") {
      // ✅ student role
      await Student.deleteOne({ userId: id });
      const student=   await Student.findOne({ userId: id });

       if(student){
     await Statistics.updateOne({}, {
    $inc: {
    totalStudents: -1,
    totalBoys: student.gender === "male" ? -1 : 0,
    totalGirls: student.gender === "female" ? -1 : 0,
     }
    });

       }


    }

    // 3️⃣ Delete user auth
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User and profile deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ROLE BASED ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedsubject = await Subject.findByIdAndDelete(id);

    if (!deletedsubject) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student deleted successfully",
      data: deletedsubject,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete student",
    });
  }
};

//conversation
export const getOrCreateDM = async (req: Request<{}, {}, Body>, res: Response) => {
  try {
    const teacherUserId = req.user?.userId;

    if (!teacherUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const otherUserId = String(req.body?.otherUserId || "").trim();
    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "otherUserId required",
      });
    }

    // ✅ validate ids
    if (!mongoose.Types.ObjectId.isValid(String(teacherUserId))) {
      return res.status(400).json({ success: false, message: "Invalid teacherUserId" });
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ success: false, message: "Invalid otherUserId" });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(String(teacherUserId));
    const otherObjectId = new mongoose.Types.ObjectId(otherUserId);

    // ✅ find existing DM between exactly these 2 users
    let convo = await conversation.findOne({
      type: "dm",
      participants: { $all: [teacherObjectId, otherObjectId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    });

    // ✅ if not found → create new
    if (!convo) {
      convo = await conversation.create({
        type: "dm",
        participants: [teacherObjectId, otherObjectId],
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: convo._id,
    });
  } catch (error) {
    console.error("GET/CREATE DM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const getMessages = async (req: Request<ConversationParams>,res: Response) => {
  try {
    const { conversationId } = req.params;

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ validate ids
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: "Invalid conversationId" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    const userObjectId = new mongoose.Types.ObjectId(String(userId));

    // ✅ pagination (sanitize)
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // ✅ fetch convo (using ObjectId)
    const convo = await conversation
      .findById(conversationObjectId)
      .select("participants type")
      .lean();

    if (!convo) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // ✅ Security: only participants can read
    const isMember = convo.participants.some(
      (p: any) => String(p) === String(userObjectId)
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const [items, total] = await Promise.all([
      Message.find({ conversationId: conversationObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversationId: conversationObjectId }),
    ]);

    // UI friendly: old -> new
    const data = items.reverse();

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const sendMessageREST = async (
  req: Request<ConversationParams>,
  res: Response
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversationId",
      });
    }

    // ✅ Validate userId
    if (!mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    const userObjectId = new mongoose.Types.ObjectId(String(userId));

    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "text required",
      });
    }

    const convo = await conversation
      .findById(conversationObjectId)
      .select("participants")
      .lean();

    if (!convo) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // ✅ Security check
    const isMember = convo.participants.some(
      (p: any) => String(p) === String(userObjectId)
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const msg = await Message.create({
      conversationId: conversationObjectId,
      senderId: userObjectId,
      text,
    });

    await conversation.findByIdAndUpdate(conversationObjectId, {
      lastMessage: text,
      lastMessageAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: msg,
    });
  } catch (error) {
    console.error("SEND MESSAGE REST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};