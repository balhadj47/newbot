import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import MainLayout from "~/components/layout/MainLayout";
import WebhookHelper from "~/components/ui/WebhookHelper";
import { getBotSettings } from "~/utils/db.server";

export default function BotSettings() {
  const { token, webhook_url } = useLoaderData<typeof loader>();
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState(token || "");
  const [webhookInput, setWebhookInput] = useState(webhook_url || "");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const fetcher = useFetcher();

  const maskToken = (token: string) => {
    // If token starts with "••••••••", it's already masked
    if (token.startsWith("••••••••")) return token;
    return "••••••••" + token.slice(-4);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(
      { 
        token: tokenInput,
        webhookUrl: webhookInput
      },
      { method: "post", action: "/api/settings" }
    );
  };

  const testWebhook = () => {
    if (!webhookInput) {
      return;
    }
    
    setIsTestingWebhook(true);
    fetcher.submit(
      {
        token: tokenInput,
        webhookUrl: webhookInput,
        testOnly: "true"
      },
      { method: "post", action: "/api/settings" }
    );
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsTestingWebhook(false);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Bot Settings</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Configuration</h2>
          
          <fetcher.Form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bot Token <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  id="token"
                  name="token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your Telegram bot token"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 dark:text-gray-400"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get your token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@BotFather</a> on Telegram
              </p>
            </div>
            
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="webhookUrl"
                  name="webhookUrl"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://yourdomain.com/api/webhook"
                />
                <button
                  type="button"
                  onClick={testWebhook}
                  disabled={!webhookInput || isTestingWebhook}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  {isTestingWebhook ? "Testing..." : "Test Webhook"}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                URL where Telegram will send updates. Leave empty to use polling method instead.
              </p>
            </div>
            
            <WebhookHelper currentWebhookUrl={webhook_url} />
            
            <div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                disabled={fetcher.state === "submitting" && !isTestingWebhook}
              >
                {fetcher.state === "submitting" && !isTestingWebhook ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </fetcher.Form>
          
          {fetcher.data?.message && (
            <div className={`mt-4 p-3 rounded ${
              fetcher.data.success 
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100" 
                : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100"
            }`}>
              {fetcher.data.message}
              
              {fetcher.data.webhookInfo && (
                <div className="mt-2 text-sm">
                  <p><strong>Webhook URL:</strong> {fetcher.data.webhookInfo.url || "None"}</p>
                  {fetcher.data.webhookInfo.last_error_date && (
                    <p><strong>Last Error:</strong> {fetcher.data.webhookInfo.last_error_message}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export const loader = async () => {
  // Get actual settings from the database
  const settings = getBotSettings();
  
  // Mask the token for security
  const safeSettings = {
    ...settings,
    token: settings.token ? "••••••••" + settings.token.slice(-4) : "YOUR_TOKEN_HERE"
  };
  
  return json(safeSettings);
};
