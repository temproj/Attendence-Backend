// Path: src/controllers/admin.controller.ts
import { Request, Response } from "express";
import Holiday from "../models/holiday.model";
import Changelog from "../models/changelog.model";
import Attendance from "../models/attendance.model";
import User from "../models/user.model";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    roles?: string[];
  };
}

// --- Add Holiday Controller ---
export const addHolidayController = async (req: Request, res: Response) => {
  try {
    const { date, description } = req.body as {
      date?: string;
      description?: string;
    };
    if (!date || !description) {
      return res
        .status(400)
        .json({ message: "Date and description are required." });
    }

    const newHoliday = new Holiday({ date, description });
    await newHoliday.save();

    return res.status(201).json({
      message: "Holiday added successfully.",
      success: true,
      data: newHoliday,
    });
  } catch (error: any) {
    // Handle potential duplicate date error
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "A holiday for this date already exists." });
    }
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// --- Revert Last 5 Uploads Controller ---
export const revertLastUploadsController = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    // Find the 5 most recent changelog entries, sorted by creation date
    const recentUploads = await Changelog.find()
      .sort({ createdAt: -1 })
      .limit(5);

    if (recentUploads.length === 0) {
      return res
        .status(404)
        .json({ message: "No recent uploads found to revert." });
    }

    // Collect all attendance record IDs from these logs
    const recordIdsToDelete = recentUploads.flatMap(
      (upload) => upload.associatedRecords
    );

    if (recordIdsToDelete.length === 0) {
      return res.status(200).json({
        message: "Recent uploads contained no new records to revert.",
      });
    }

    // Delete all associated attendance records and the changelog entries themselves
    await Attendance.deleteMany({ _id: { $in: recordIdsToDelete } });
    await Changelog.deleteMany({
      _id: { $in: recentUploads.map((u) => u._id) },
    });

    return res.status(200).json({
      message: `Successfully reverted the last ${recentUploads.length} uploads, deleting ${recordIdsToDelete.length} records.`,
      success: true,
    });
  } catch (error: any) {
    console.error("Revert Error:", error);
    return res.status(500).json({
      message: "An error occurred while reverting uploads.",
      error: error.message,
    });
  }
};

// --- Delete Semester Data Controller ---
export const deleteSemesterDataController = async (
  req: Request,
  res: Response
) => {
  try {
    const { semester } = req.body as { semester?: number };
    if (!semester) {
      return res.status(400).json({ message: "Semester is required." });
    }

    const result = await Attendance.deleteMany({ semester });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: `No attendance data found for semester ${semester}.`,
      });
    }

    return res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} attendance records for semester ${semester}.`,
      success: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "An error occurred while deleting semester data.",
      error: error.message,
    });
  }
};

// --- Filter and Find Students Controller ---
export const filterStudentsController = async (req: Request, res: Response) => {
  try {
    const { semester, regNoPartial } = req.query as {
      semester?: string;
      regNoPartial?: string;
    };

    if (!semester && !regNoPartial) {
      return res.status(400).json({
        message:
          "Please provide a semester or a partial registration number to filter.",
      });
    }

    const query: any = { role: "STUDENT" };

    if (semester) {
      query.semester = Number(semester);
    }

    if (regNoPartial) {
      // Use a regular expression to find registration numbers that start with the partial string
      query.registrationNumber = {
        $regex: `^${regNoPartial}`,
        $options: "i",
      };
    }

    const students = await User.find(query).select("-password -email");

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found matching the criteria." });
    }

    return res.status(200).json({
      message: `Found ${students.length} students.`,
      success: true,
      data: students,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "An error occurred while filtering students.",
      error: error.message,
    });
  }
};

// --- Update User Details by Admin Controller ---
export const updateUserDetailsByAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params; // Get user ID from the URL parameter
    const { semester, courseStartDate, courseEndDate } = req.body as {
      semester?: number;
      courseStartDate?: string;
      courseEndDate?: string;
    };

    const updateData: any = {};
    if (semester) updateData.semester = semester;

    if (courseStartDate) {
      const user = await User.findById(userId);
      if (user && user.courseStartDate) {
        // requirement: don't override existing courseStartDate
      } else {
        updateData.courseStartDate = courseStartDate;
      }
    }

    if (courseEndDate) updateData.courseEndDate = courseEndDate;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password -email");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User details updated successfully by admin.",
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "An error occurred while updating user details.",
      error: error.message,
    });
  }
};

// --- Promote and Clear Semester Controller (NEW) ---
export const promoteAndClearSemesterController = async (
  req: Request,
  res: Response
) => {
  try {
    const { semester } = req.body as { semester?: number | string };
    const currentSemester = parseInt(String(semester), 10);

    if (!currentSemester || currentSemester < 1 || currentSemester > 8) {
      return res
        .status(400)
        .json({ message: "A valid semester (1-8) is required." });
    }

    // Find all students in the specified semester
    const studentsToProcess = await User.find({
      role: "STUDENT",
      semester: currentSemester,
    }).select("_id");

    if (studentsToProcess.length === 0) {
      return res.status(404).json({
        message: `No students found in semester ${currentSemester}.`,
      });
    }

    const studentIds = studentsToProcess.map((s) => s._id);

    // --- Logic for final (8th) semester ---
    if (currentSemester === 8) {
      // This is a destructive action: delete attendance AND user records.
      const attendanceDeletion = await Attendance.deleteMany({
        userId: { $in: studentIds },
      });
      const userDeletion = await User.deleteMany({ _id: { $in: studentIds } });

      return res.status(200).json({
        message: `Successfully graduated ${userDeletion.deletedCount} students from semester 8. All associated attendance and user data has been deleted. Deleted attendance: ${attendanceDeletion.deletedCount}.`,
        success: true,
      });
    }

    // --- Logic for all other semesters (1-7) ---
    // 1. Delete all attendance records for the current semester
    const attendanceDeletionResult = await Attendance.deleteMany({
      userId: { $in: studentIds },
      semester: currentSemester,
    });

    // 2. Promote students to the next semester
    const userPromotionResult = await User.updateMany(
      { _id: { $in: studentIds } },
      { $inc: { semester: 1 } }
    );

    return res.status(200).json({
      message: `Successfully promoted ${userPromotionResult.modifiedCount} students from semester ${currentSemester} to ${currentSemester + 1}. Deleted ${attendanceDeletionResult.deletedCount} old attendance records.`,
      success: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "An error occurred during the promotion process.",
      error: error.message,
    });
  }
};
