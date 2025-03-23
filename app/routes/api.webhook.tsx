import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getBotSettings, addLog } from "~/utils/db.server";
import { processUpdate, isBotRunning, startBotFromSettings } from "~/utils/bot.server";

// This loader handles Telegram's validation requests
export async function loader({ request }: LoaderFunctionArgs) {
  addLog("INFO", "Received GET request to webhook endpoint - Telegram validation");
  // Return a 200 OK response to confirm the endpoint exists
  return json({ status: "Webhook endpoint operational" });
}

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== "POST") {
    addLog("ERROR", "Received non-POST request to webhook endpoint");
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get update data from request
    const updateData = await request.text();
    addLog("INFO", "Received webhook update from Telegram", { body: updateData.slice(0, 200) + "..." });
    
    const update = JSON.parse(updateData);
    
    // Check if bot is running, if not - attempt to start it
    if (!isBotRunning()) {
      addLog("INFO", "Bot not running, attempting to start");
      const started = await startBotFromSettings();
      if (!started) {
        addLog("ERROR", "Received webhook but bot is not running and could not be started");
        return json({ error: "Bot is not running" }, { status: 503 });
      }
    }
    
    // Process the update
    await processUpdate(update);
    
    // Return success - this is important for Telegram to know we processed the update
    return json({ success: true });
  } catch (error) {
    addLog("ERROR", "Error processing webhook", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
