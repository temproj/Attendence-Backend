// Path: src/utils/generateAccessToken.ts
import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.SECRET_KEY_ACCESS_TOKEN as string,
    { expiresIn: "5h" }
  );
};

export default generateAccessToken;
