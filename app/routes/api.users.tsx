import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUsers } from "~/utils/db.server";

// Get users
export async function loader({ request }: LoaderFunctionArgs) {
  const users = getUsers();
  return json({ users });
}
