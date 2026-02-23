import jwt from "jsonwebtoken";

export type Payload = {
  userId: string;
  userRole: string;
};
// generate token
export function generateToken(payload: Payload): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
//verify token
export function verifyToken(token: string): Payload {
  if (!token) {
    throw new Error("Token is required");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // ✅ Runtime type guard
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  return decoded as Payload;
}
