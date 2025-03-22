import { useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getBotSettings } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const settings = getBotSettings();
  
  return json({
    settings
  });
}

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  const [newToken, setNewToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(settings.webhook_url || "");
  const [isTokenHidden, setIsTokenHidden] = useState(true);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    fetcher.submit(
      { 
        token: newToken || settings.token,
        webhookUrl
      },
      { method: "post", action: "/api/settings" }
    );
  };
  
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Bot Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <fetcher.Form method="post" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bot Token
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={isTokenHidden ? "password" : "text"}
                  name="token"
                  id="token"
                  className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={settings.token ? "Current token is set" : "Enter your bot token"}
                  onChange={(e) => setNewToken(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
                  onClick={() => setIsTokenHidden(!isTokenHidden)}
                >
                  {isTokenHidden ? "Show" : "Hide"}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You can get this from @BotFather on Telegram.
              </p>
            </div>
            
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Webhook URL (Optional)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="webhookUrl"
                  id="webhookUrl"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://your-domain.com/api/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                If you want to use webhooks instead of polling, enter your public URL here.
                <br />
                Your webhook endpoint is: <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-900">/api/webhook</code>
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {fetcher.state === "submitting" ? "Saving..." : "Save Settings"}
              </button>
            </div>
            
            {fetcher.data?.message && (
              <div className={`p-3 rounded ${
                fetcher.data.success 
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100" 
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
              }`}>
                {fetcher.data.message}
              </div>
            )}
          </div>
        </fetcher.Form>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How to Use This Bot
        </h2>
        <div className="prose dark:prose-invert">
          <ol className="space-y-4 text-gray-700 dark:text-gray-300">
            <li>
              <span className="font-medium">Create a bot with BotFather:</span> Chat with 
              <a 
                href="https://t.me/BotFather" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                @BotFather
              </a> on Telegram and use the /newbot command to create a new bot.
            </li>
            <li>
              <span className="font-medium">Get your bot token:</span> BotFather will provide you with a token. Copy and paste it in the "Bot Token" field above.
            </li>
            <li>
              <span className="font-medium">Configure commands:</span> Use the Commands page to set up the commands your bot will respond to.
            </li>
            <li>
              <span className="font-medium">Start your bot:</span> Go to the Dashboard and click the "Start Bot" button.
            </li>
            <li>
              <span className="font-medium">Interact with your bot:</span> Find your bot on Telegram by its username and start chatting!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
