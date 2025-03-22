import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getCommands, addCommand, updateCommand, deleteCommand } from "~/utils/db.server";

// Get all commands
export async function loader({ request }: LoaderFunctionArgs) {
  const commands = getCommands();
  return json({ commands });
}

// Create, update, or delete commands
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action")?.toString();

  if (action === "create") {
    const command = formData.get("command")?.toString();
    const description = formData.get("description")?.toString();
    const response = formData.get("response")?.toString();

    if (!command || !description || !response) {
      return json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    try {
      addCommand(command, description, response);
      return json({ success: true, message: "Command created successfully" });
    } catch (error: any) {
      return json(
        { success: false, message: error.message || "Failed to create command" },
        { status: 500 }
      );
    }
  } else if (action === "update") {
    const id = parseInt(formData.get("id")?.toString() || "0", 10);
    const command = formData.get("command")?.toString();
    const description = formData.get("description")?.toString();
    const response = formData.get("response")?.toString();
    const isActive = formData.get("isActive") === "true";

    if (!id || !command || !description || !response) {
      return json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    try {
      updateCommand(id, command, description, response, isActive);
      return json({ success: true, message: "Command updated successfully" });
    } catch (error: any) {
      return json(
        { success: false, message: error.message || "Failed to update command" },
        { status: 500 }
      );
    }
  } else if (action === "delete") {
    const id = parseInt(formData.get("id")?.toString() || "0", 10);

    if (!id) {
      return json({ success: false, message: "Command ID is required" }, { status: 400 });
    }

    try {
      deleteCommand(id);
      return json({ success: true, message: "Command deleted successfully" });
    } catch (error: any) {
      return json(
        { success: false, message: error.message || "Failed to delete command" },
        { status: 500 }
      );
    }
  }

  return json({ success: false, message: "Invalid action" }, { status: 400 });
}
