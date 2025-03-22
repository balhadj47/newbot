import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getBotSettings, updateBotSettings } from "~/utils/db.server";
import { stopBot } from "~/utils/bot.server";

// Get the current settings
export async function loader({ request }: LoaderFunctionArgs) {
  const settings = getBotSettings();
  // Don't send the full token to the client
  const safeSettings = {
    ...settings,
    token: settings.token ? "••••••••" + settings.token.slice(-4) : null
  };
  return json(safeSettings);
}

// Update settings
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const token = formData.get("token")?.toString();
  const webhookUrl = formData.get("webhookUrl")?.toString() || "";

  if (!token) {
    return json({ success: false, message: "Token is required" }, { status: 400 });
  }

  try {
    // Stop the bot before updating settings
    await stopBot();
    
    // Update settings
    updateBotSettings(token, webhookUrl);
    
    return json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    return json(
      { success: false, message: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
