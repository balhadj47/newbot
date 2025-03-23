import { useState } from "react";

interface WebhookHelperProps {
  currentWebhookUrl: string | null;
}

export default function WebhookHelper({ currentWebhookUrl }: WebhookHelperProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="mt-6 bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-blue-800 dark:text-blue-100">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Webhook Setup Help</h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 dark:text-blue-300 hover:underline"
        >
          {expanded ? "Hide" : "Show"} details
        </button>
      </div>
      
      {expanded && (
        <div className="mt-3 space-y-3">
          <p>For the webhook to work correctly:</p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>Your webhook URL must be <strong>publicly accessible</strong> from the internet (Telegram servers must be able to reach it)</li>
            <li>The URL must use <strong>HTTPS</strong> protocol (not HTTP)</li>
            <li>The correct path for Remix should be <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/api/webhook</code></li>
          </ol>
          
          <p className="font-medium mt-3">Troubleshooting 404 Not Found errors:</p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>Verify your domain is correctly set up and resolves to your server</li>
            <li>Ensure the port (if any) is open and properly forwarded</li>
            <li>Check that your server/hosting service allows incoming webhook requests</li>
            <li>Try accessing <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{currentWebhookUrl || "your-webhook-url"}</code> in your browser - it should return a response</li>
            <li>Use the "Test Webhook" button to verify Telegram can reach your endpoint</li>
          </ul>
          
          <div className="bg-yellow-100 dark:bg-yellow-800 p-3 rounded mt-3">
            <p className="font-medium text-yellow-800 dark:text-yellow-100">For local development:</p>
            <p className="mt-1 text-yellow-700 dark:text-yellow-200">
              Use a service like <a href="https://ngrok.com" target="_blank" rel="noopener noreferrer" className="underline">ngrok</a> or 
              <a href="https://localtunnel.github.io/www/" target="_blank" rel="noopener noreferrer" className="underline ml-1">localtunnel</a> to 
              expose your local server to the internet with commands like:
            </p>
            <pre className="mt-2 bg-yellow-50 dark:bg-yellow-900 p-2 rounded text-sm overflow-x-auto">
              ngrok http 3000
            </pre>
            <p className="mt-2 text-yellow-700 dark:text-yellow-200">
              Then use the HTTPS URL provided by ngrok as your webhook URL.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
