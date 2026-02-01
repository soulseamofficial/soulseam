import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Settings from "@/app/models/Settings";
import { requireAdminAuth } from "@/app/lib/adminAuth";

// GET settings (public for frontend, but can be admin-only if needed)
export async function GET(req) {
  try {
    await connectDB();
    const settings = await Settings.getSettings();
    return NextResponse.json({
      success: true,
      settings: {
        codAdvanceEnabled: settings.codAdvanceEnabled,
        codAdvanceAmount: settings.codAdvanceAmount,
      },
    });
  } catch (error) {
    console.error("[Settings GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT settings (admin only)
export async function PUT(req) {
  try {
    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const { codAdvanceEnabled, codAdvanceAmount } = body;

    // Validate input
    if (codAdvanceEnabled !== undefined && typeof codAdvanceEnabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "codAdvanceEnabled must be a boolean" },
        { status: 400 }
      );
    }

    if (codAdvanceAmount !== undefined) {
      const amount = Number(codAdvanceAmount);
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json(
          { success: false, error: "codAdvanceAmount must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // Get or create settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        codAdvanceEnabled: codAdvanceEnabled !== undefined ? codAdvanceEnabled : true,
        codAdvanceAmount: codAdvanceAmount !== undefined ? codAdvanceAmount : 100,
      });
    } else {
      // Update settings
      if (codAdvanceEnabled !== undefined) {
        settings.codAdvanceEnabled = codAdvanceEnabled;
      }
      if (codAdvanceAmount !== undefined) {
        settings.codAdvanceAmount = codAdvanceAmount;
      }
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings: {
        codAdvanceEnabled: settings.codAdvanceEnabled,
        codAdvanceAmount: settings.codAdvanceAmount,
      },
    });
  } catch (error) {
    console.error("[Settings PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
