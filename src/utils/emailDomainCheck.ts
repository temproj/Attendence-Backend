// Path: src/utils/emailDomainCheck.ts
import validator from "validator";

// Convert comma-separated env list -> clean array
const getEnvList = (name: string): string[] =>
  process.env[name]
    ?.split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean) || [];

const STUDENT_DOMAIN = (process.env.STUDENT_EMAIL_DOMAIN || "").toLowerCase();
const STAFF_DOMAIN = (process.env.STAFF_EMAIL_DOMAIN || "").toLowerCase();
const ALLOWED_DOMAINS = getEnvList("ALLOWED_EMAIL_DOMAINS");

// General allowed email domain check
export const isAllowedCollegeEmail = (email = ""): boolean => {
  if (!validator.isEmail(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();

  return (
    !!domain &&
    (ALLOWED_DOMAINS.includes(domain) ||
      domain === STUDENT_DOMAIN ||
      domain === STAFF_DOMAIN)
  );
};

// Strict: Student MUST use regNo@domain format
export const isStrictStudentEmail = (email = ""): boolean => {
  if (!validator.isEmail(email)) return false;
  const [local, domain] = email.toLowerCase().split("@");

  if (domain !== STUDENT_DOMAIN) return false;
  return /^[0-9]{11}$/.test(local);
};

// Safely get regNo if valid student email
export const regNoFromEmail = (email = ""): string | null => {
  if (!isStrictStudentEmail(email)) return null;
  return email.split("@")[0];
};

// Staff rule (Admin/HOD/Teachers)
export const isStaffEmail = (email = ""): boolean => {
  if (!validator.isEmail(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && domain === STAFF_DOMAIN;
};

// Role-wise master validator (future safe)
export const validateEmailByRole = (email = "", role = ""): boolean => {
  if (!isAllowedCollegeEmail(email)) return false;
  if (role === "STUDENT") return isStrictStudentEmail(email);
  return isStaffEmail(email);
};
