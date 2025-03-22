import { Outlet, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import MainLayout from "~/components/layout/MainLayout";
import BotControls from "~/components/ui/BotControls";
import { isBotRunning } from "~/utils/bot.server";
import { getBotSettings } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const settings = getBotSettings();
  
  return json({
    isRunning: isBotRunning(),
    hasToken: !!settings.token
  });
}

export default function DashboardLayout() {
  const { isRunning, hasToken } = useLoaderData<typeof loader>();
  
  return (
    <MainLayout>
      <BotControls isRunning={isRunning} hasToken={hasToken} />
      <Outlet />
    </MainLayout>
  );
}
