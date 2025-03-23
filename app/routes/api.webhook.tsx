import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getBotSettings, addLog } from "~/utils/db.server";
import { processUpdate, isBotRunning, startBotFromSettings } from "~/utils/bot.server";

// This loader handles Telegram's validation requests
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  
  addLog("INFO", "Received GET request to webhook endpoint - Telegram validation", {
    url: url.toString(),
    method: request.method,
    headers: headers
  });
  
  // Return a 200 OK response to confirm the endpoint exists
  return json({ status: "Webhook endpoint operational" });
}

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== "POST") {
    const headers = Object.fromEntries(request.headers.entries());
    
    addLog("ERROR", "Received non-POST request to webhook endpoint", {
      method: request.method,
      url: request.url,
      headers: headers
    });
    
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get request details for logging
    const headers = Object.fromEntries(request.headers.entries());
    const url = new URL(request.url);
    
    // Get update data from request
    const updateData = await request.text();
    addLog("INFO", "Received webhook update from Telegram", { 
      url: url.toString(),
      headers: headers,
      bodyPreview: updateData.length > 1000 ? 
        updateData.substring(0, 1000) + "..." : 
        updateData,
      fullBody: updateData // Store the full body for debugging
    });
    
    let update;
    try {
      update = JSON.parse(updateData);
    } catch (parseError) {
      addLog("ERROR", "Failed to parse webhook JSON data", {
        error: parseError instanceof Error ? 
          { message: parseError.message, stack: parseError.stack } : 
          parseError,
        rawData: updateData
      });
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    
    // Check if bot is running, if not - attempt to start it
    if (!isBotRunning()) {
      addLog("INFO", "Bot not running, attempting to start", {
        updateType: update.message ? "message" : 
                    update.callback_query ? "callback_query" : 
                    "other"
      });
      
      const started = await startBotFromSettings();
      if (!started) {
        addLog("ERROR", "Received webhook but bot is not running and could not be started", {
          update: update
        });
        return json({ error: "Bot is not running" }, { status: 503 });
      }
    }
    
    // Process the update
    await processUpdate(update);
    
    // Return success - this is important for Telegram to know we processed the update
    return json({ success: true });
  } catch (error) {
    addLog("ERROR", "Error processing webhook", {
      error: error instanceof Error ? 
        { message: error.message, stack: error.stack } : 
        error,
      requestUrl: request.url
    });
    
    return json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
