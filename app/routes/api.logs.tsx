import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getLogs, clearLogs, getLogStats } from "~/utils/db.server";

// Get logs with filtering
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const type = url.searchParams.get("type") || null;
  const search = url.searchParams.get("search") || null;
  const timeRange = url.searchParams.get("timeRange") || null;
  
  // Create a timestamp for filtering by time
  let timeFilter = null;
  if (timeRange) {
    const now = new Date();
    switch(timeRange) {
      case "1h":
        timeFilter = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case "24h":
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case "7d":
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        timeFilter = null;
    }
  }
  
  const logs = getLogs(limit, type, search, timeFilter);
  const stats = getLogStats();
  
  return json({ logs, stats });
}

// Clear logs
export async function action({ request }: ActionFunctionArgs) {
  const method = request.method.toLowerCase();
  
  if (method === "delete") {
    const result = clearLogs();
    return json({ 
      success: result.changes > 0, 
      message: result.changes > 0 ? "Logs cleared successfully" : "No logs to clear" 
    });
  }
  
  return json({ success: false, message: "Method not allowed" }, { status: 405 });
}
