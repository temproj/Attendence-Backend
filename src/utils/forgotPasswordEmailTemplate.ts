// Path: src/utils/forgotPasswordEmailTemplate.ts

export const forgotPasswordEmailTemplate = ({
  name,
  otp,
}: {
  name: string;
  otp: string;
}) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
      <p>Dear ${name},</p>
      <p>We received a request to reset your password. Please use the following verification code to proceed. This code is valid for 10 minutes.</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; padding: 10px 20px; background-color: #f0f0f0; border-radius: 5px; letter-spacing: 5px;">
          ${otp}
        </span>
      </div>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
  `;
};
