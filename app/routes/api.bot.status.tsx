import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getBotSettings, addLog, setBotRunningStatus } from "~/utils/db.server";
import { startBotFromSettings, stopBot, isBotRunning } from "~/utils/bot.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const settings = getBotSettings();
  return json({
    isRunning: isBotRunning(),
    hasToken: !!settings.token
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action")?.toString();

  if (action === "start") {
    try {
      const success = await startBotFromSettings();
      if (success) {
        return json({ success: true, message: "Bot started successfully" });
      } else {
        return json({ success: false, message: "Failed to start bot" }, { status: 400 });
      }
    } catch (error: any) {
      addLog("ERROR", "Failed to start bot", error);
      return json({ success: false, message: error.message || "Unknown error" }, { status: 500 });
    }
  } else if (action === "stop") {
    try {
      await stopBot();
      return json({ success: true, message: "Bot stopped successfully" });
    } catch (error: any) {
      addLog("ERROR", "Failed to stop bot", error);
      return json({ success: false, message: error.message || "Unknown error" }, { status: 500 });
    }
  }

  return json({ success: false, message: "Invalid action" }, { status: 400 });
}
