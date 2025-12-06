// Path: src/controllers/student.controller.ts
import { Request, Response } from "express";
import Attendance from "../models/attendance.model";
import Holiday from "../models/holiday.model";
import User from "../models/user.model";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    roles?: string[];
  };
}

// --- Get Student's Own Attendance Controller ---
export const getMyAttendanceController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id; // This ID comes securely from the validated JWT
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user context missing." });
    }

    // 1. Fetch the user's course dates to establish a default range
    const user = await User.findById(userId).select(
      "courseStartDate courseEndDate"
    );
    if (!user || !user.courseStartDate) {
      return res.status(400).json({
        message: "Course start date is not set. Please contact an admin.",
      });
    }

    // 2. Determine the precise date range for the database query
    const queryStartDate = startDate
      ? new Date(startDate)
      : user.courseStartDate;
    const queryEndDate = endDate
      ? new Date(endDate)
      : user.courseEndDate || new Date(); // Default to today if no end date

    // 3. Fetch attendance and holidays in parallel for maximum efficiency
    const [attendanceRecords, holidays] = await Promise.all([
      Attendance.find({
        userId,
        date: { $gte: queryStartDate, $lte: queryEndDate },
      }).sort({ date: "asc" }),
      Holiday.find({
        date: { $gte: queryStartDate, $lte: queryEndDate },
      }),
    ]);

    // 4. Calculate attendance statistics for the frontend
    const totalMs = queryEndDate.getTime() - queryStartDate.getTime();
    const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24)) + 1;

    const presentDays = attendanceRecords.length;
    // Sundays ka exact calculation front-end pe bhi ho sakta hai
    const workingDays = totalDays - holidays.length;
    const attendancePercentage =
      workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

    return res.status(200).json({
      message: "Attendance data fetched successfully.",
      success: true,
      data: {
        attendanceRecords,
        holidays,
        stats: {
          presentDays,
          totalWorkingDays: workingDays,
          percentage: parseFloat(attendancePercentage.toFixed(2)),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "An error occurred while fetching attendance data.",
      error: error.message,
    });
  }
};
