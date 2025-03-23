import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getBotSettings, updateBotSettings, addLog } from "~/utils/db.server";
import { stopBot, testWebhook } from "~/utils/bot.server";

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
  const testOnly = formData.get("testOnly") === "true";

  if (!token) {
    return json({ success: false, message: "Token is required" }, { status: 400 });
  }

  try {
    // If this is just a test, perform webhook test without saving settings
    if (testOnly && webhookUrl) {
      try {
        const result = await testWebhook(webhookUrl);
        return json({ 
          success: result.success, 
          message: result.success 
            ? "Webhook test successful! Telegram can reach your endpoint." 
            : "Webhook test failed. Telegram cannot reach your endpoint.",
          webhookInfo: result.current
        });
      } catch (error: any) {
        return json({
          success: false,
          message: "Webhook test failed: " + (error.message || "Unknown error"),
        }, { status: 500 });
      }
    }

    // Stop the bot before updating settings
    await stopBot();
    
    // Update settings
    updateBotSettings(token, webhookUrl);
    addLog("INFO", "Bot settings updated", { webhook_url: webhookUrl || "none (using polling)" });
    
    return json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    return json(
      { success: false, message: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
