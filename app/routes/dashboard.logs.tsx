import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";

export default function Logs() {
  const fetcher = useFetcher();
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  // Fetch logs on component mount
  useEffect(() => {
    fetcher.load("/api/logs");
    
    // Set up polling for logs every 5 seconds
    const interval = window.setInterval(() => {
      fetcher.load("/api/logs");
    }, 5000);
    
    setPollingInterval(interval);
    
    // Clear interval on component unmount
    return () => {
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, []);
  
  // Get logs data from fetcher
  const logs = fetcher.data?.logs || [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Activity Logs</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Auto-refreshing every 5 seconds
        </span>
      </div>
      
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Message
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                          log.type === 'ERROR' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
                            : log.type === 'WARNING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.data ? (
                        <details>
                          <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-w-md max-h-32">
                            {JSON.stringify(JSON.parse(log.data), null, 2)}
                          </pre>
                        </details>
                      ) : (
                        "No data"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
