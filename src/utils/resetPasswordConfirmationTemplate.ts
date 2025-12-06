// Path: src/utils/resetPasswordConfirmationTemplate.ts

export const resetPasswordConfirmationTemplate = ({ name }: { name: string }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #28a745;">Password Reset Successful</h2>
      <p>Dear ${name},</p>
      <p>Your password has been successfully updated. If you did not make this change, please contact our support team immediately.</p>
    </div>
  `;
};
