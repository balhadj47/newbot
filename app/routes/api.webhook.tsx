import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getBotSettings, addLog } from "~/utils/db.server";
import { processUpdate, isBotRunning, startBotFromSettings } from "~/utils/bot.server";

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get update data from request
    const update = await request.json();
    
    // Check if bot is running, if not - attempt to start it
    if (!isBotRunning()) {
      const started = await startBotFromSettings();
      if (!started) {
        addLog("ERROR", "Received webhook but bot is not running and could not be started");
        return json({ error: "Bot is not running" }, { status: 503 });
      }
    }
    
    // Process the update
    await processUpdate(update);
    
    // Return success
    return json({ success: true });
  } catch (error) {
    addLog("ERROR", "Error processing webhook", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
