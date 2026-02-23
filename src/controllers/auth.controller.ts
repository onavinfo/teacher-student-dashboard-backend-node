import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import "../models/role.model.js"
import type { Irole } from "../models/role.model.js";
import Statistics from "../models/Statistics.js";
//check auth
export const checkAuth = (req: Request, res: Response) => {
  const token = req.cookies.accesstoken;

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!);
    res.json({ authenticated: true, user });
  } catch {
    res.status(401).json({ authenticated: false });
  }
};
// login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // ✅ populate role + profile doc (Student/Teacher/Parent/Admin)
    const user = await User.findOne({ email })
      .populate("roleId")
      .populate("profileId");

    //  await Statistics.create({});
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const role = (user.roleId as any)?.role;

    // ✅ profileId is now the Student doc (because profileModel="Student")
    const profile: any = user.profileId;

    const fullName =
      profile
        ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() ||
          profile.username ||
          null
        : null;

    const token = jwt.sign(
      {
        userId: user._id,
        userRole: role,
        profileId: profile?._id ?? null,
        profileModel: user.profileModel ?? null,
        fullName,
        user
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.cookie("accesstoken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      success: true,
      error: false,
      user: {
        userId: user._id,
        email: user.email,
        role,

        // ✅ profile info from Student table
        profileId: profile?._id ?? null,
        profileModel: user.profileModel ?? null,
        fullName,
        username: profile?.username ?? null,
        phone: profile?.phone ?? null,
        address: profile?.address ?? null,
        file: profile?.file ?? null,
      },
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//logout
export const logout = (req: Request, res: Response) => {
  try {
    res.clearCookie("accesstoken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
