// Path: src/utils/passwordHashing.ts
import bcryptjs from "bcryptjs";

// Function to hash a password with bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);
  return hashedPassword;
};

// Function to safely compare a plaintext password with a hashed password
export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  const isMatch = await bcryptjs.compare(plainPassword, hashedPassword);
  return isMatch;
};
