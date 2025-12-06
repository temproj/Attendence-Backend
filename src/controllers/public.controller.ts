// Path: src/controllers/public.controller.ts
import { Request, Response } from "express";
import Changelog from "../models/changelog.model";

export const getLastUpdateController = async (
  _req: Request,
  res: Response
) => {
  try {
    // Find the single most recent changelog entry and only select the 'createdAt' field.
    const lastUpdate = await Changelog.findOne()
      .sort({ createdAt: -1 })
      .select("createdAt");

    if (!lastUpdate) {
      return res.status(404).json({ message: "No updates found yet." });
    }

    return res.status(200).json({
      message: "Last update timestamp fetched successfully.",
      success: true,
      data: {
        lastUpdatedAt: lastUpdate.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};
