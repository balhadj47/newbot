import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getLogs } from "~/utils/db.server";

// Get logs
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const logs = getLogs(limit);
  return json({ logs });
}
