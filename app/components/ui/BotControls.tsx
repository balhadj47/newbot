import { useState } from "react";
import { useFetcher } from "@remix-run/react";

interface BotControlsProps {
  isRunning: boolean;
  hasToken: boolean;
}

export default function BotControls({ isRunning, hasToken }: BotControlsProps) {
  const fetcher = useFetcher();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action: string) => {
    setIsProcessing(true);
    fetcher.submit(
      { action },
      { method: "post", action: "/api/bot/status" }
    );
  };

  // Reset processing state when the action completes
  if (isProcessing && fetcher.state === "idle" && fetcher.data) {
    setIsProcessing(false);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4">
            <span className="font-semibold text-gray-900 dark:text-white">Bot Status:</span>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-block h-3 w-3 rounded-full mr-2 ${
                isRunning ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span className="text-gray-700 dark:text-gray-300">
              {isRunning ? "Running" : "Stopped"}
            </span>
          </div>
        </div>
        <div>
          {isRunning ? (
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              onClick={() => handleAction("stop")}
              disabled={isProcessing || !isRunning}
            >
              {isProcessing ? "Stopping..." : "Stop Bot"}
            </button>
          ) : (
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              onClick={() => handleAction("start")}
              disabled={isProcessing || isRunning || !hasToken}
              title={!hasToken ? "Please set a bot token in settings first" : ""}
            >
              {isProcessing ? "Starting..." : "Start Bot"}
            </button>
          )}
        </div>
      </div>

      {fetcher.data?.message && (
        <div className={`mt-4 p-2 rounded ${
          fetcher.data.success 
            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100" 
            : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100"
        }`}>
          {fetcher.data.message}
        </div>
      )}

      {!hasToken && !isRunning && (
        <div className="mt-4 p-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100">
          You need to set a bot token in the settings before starting the bot.
        </div>
      )}
    </div>
  );
}
