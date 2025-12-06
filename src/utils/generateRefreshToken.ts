// Path: src/utils/generateRefreshToken.ts
import jwt from "jsonwebtoken";

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.SECRET_KEY_REFRESH_TOKEN as string,
    { expiresIn: "7d" }
  );
};

export default generateRefreshToken;
