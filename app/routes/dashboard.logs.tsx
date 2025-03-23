import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";

export default function Logs() {
  const fetcher = useFetcher();
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [filter, setFilter] = useState({
    type: "ALL",
    search: "",
    timeRange: "24h" // "1h", "24h", "7d", "all"
  });
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [expandAllData, setExpandAllData] = useState(false);
  
  // Fetch logs on component mount or filter change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.type !== "ALL") params.append("type", filter.type);
    if (filter.search) params.append("search", filter.search);
    if (filter.timeRange !== "all") params.append("timeRange", filter.timeRange);
    
    fetcher.load(`/api/logs?${params.toString()}`);
    
    // Set up polling for logs every 5 seconds
    const interval = window.setInterval(() => {
      fetcher.load(`/api/logs?${params.toString()}`);
    }, 5000);
    
    setPollingInterval(interval);
    
    // Clear interval on component unmount
    return () => {
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, [filter]);
  
  // Function to clear logs
  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear all logs? This action cannot be undone.")) {
      fetcher.submit({}, { method: "delete", action: "/api/logs" });
    }
  };
  
  // Get logs data from fetcher
  const logs = fetcher.data?.logs || [];
  
  // Function to format and display JSON data
  const formatJsonData = (jsonString: string) => {
    try {
      if (!jsonString) return "No data";
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };
  
  // Function to toggle all data sections
  const toggleAllData = () => {
    setExpandAllData(!expandAllData);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Detailed Activity Logs</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleAllData}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            {expandAllData ? "Collapse All Data" : "Expand All Data"}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Auto-refreshing every 5s
          </span>
          <button 
            onClick={handleClearLogs}
            className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
          >
            Clear Logs
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Log Type
            </label>
            <select
              id="typeFilter"
              value={filter.type}
              onChange={(e) => setFilter({...filter, type: e.target.value})}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="SUCCESS">Success</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="timeRangeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Range
            </label>
            <select
              id="timeRangeFilter"
              value={filter.timeRange}
              onChange={(e) => setFilter({...filter, timeRange: e.target.value})}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focusindigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div className="flex-grow">
            <label htmlFor="searchFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="flex">
              <input
                type="text"
                id="searchFilter"
                placeholder="Search in logs..."
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
                className="flex-grow rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {filter.search && (
                <button
                  onClick={() => setFilter({...filter, search: ""})}
                  className="ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", count: fetcher.data?.stats?.total || 0, color: "blue" },
          { label: "Errors", count: fetcher.data?.stats?.error || 0, color: "red" },
          { label: "Warnings", count: fetcher.data?.stats?.warning || 0, color: "yellow" },
          { label: "Info", count: fetcher.data?.stats?.info || 0, color: "green" }
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border border-${stat.color}-200 dark:border-${stat.color}-800 rounded-lg p-4`}>
            <div className="flex items-center">
              <div className={`rounded-full p-3 bg-${stat.color}-100 dark:bg-${stat.color}-800 mr-4`}>
                <span className={`text-${stat.color}-600 dark:text-${stat.color}-300 text-lg`}>
                  {stat.label === "Errors" ? "⚠️" : 
                   stat.label === "Warnings" ? "⚡" : 
                   stat.label === "Info" ? "ℹ️" : "📊"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced Log Table with Detailed Data */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
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
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id} className={log.type === 'ERROR' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                          log.type === 'ERROR' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
                            : log.type === 'WARNING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : log.type === 'SUCCESS'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
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
                        <details open={expandAllData || expandedLog === log.id}>
                          <summary 
                            className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          >
                            {expandAllData || expandedLog === log.id ? "Hide details" : "View details"}
                          </summary>
                          <div className="mt-2 space-y-2">
                            <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-96 border border-gray-300 dark:border-gray-600">
                              {formatJsonData(log.data)}
                            </pre>
                            
                            {/* Quick action buttons for common operations */}
                            <div className="flex gap-2 mt-1">
                              <button 
                                onClick={() => {
                                  // Copy to clipboard
                                  navigator.clipboard.writeText(formatJsonData(log.data));
                                }}
                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                Copy to clipboard
                              </button>
                            </div>
                          </div>
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
                    No logs found. Check your filters or wait for new logs to appear.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Log Visualization Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Log Timeline</h2>
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-full space-x-1 h-8">
            {logs.slice(0, 50).map((log: any, index: number) => (
              <div 
                key={log.id} 
                className={`h-full rounded-sm cursor-pointer ${
                  log.type === 'ERROR' ? 'bg-red-500' : 
                  log.type === 'WARNING' ? 'bg-yellow-500' : 
                  log.type === 'SUCCESS' ? 'bg-green-500' : 
                  'bg-blue-500'
                }`}
                style={{ width: '8px' }}
                title={`${log.type}: ${log.message} (${new Date(log.timestamp).toLocaleString()})`}
                onClick={() => setExpandedLog(log.id)}
              />
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
          Each bar represents a log entry. Click on a bar to view details. Colors indicate log type.
        </div>
      </div>
      
      {/* Advanced Troubleshooting Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Troubleshooting Guide</h2>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">Common Issues</h3>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
              <li>Webhook URL not accessible (404 errors)</li>
              <li>Invalid Bot Token (401 errors)</li>
              <li>Missing command responses</li>
              <li>Webhook connection problems</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">Webhook Troubleshooting</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              If your webhook isn't working, check:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
              <li>The webhook URL must be publicly accessible (not localhost)</li>
              <li>The URL must use HTTPS with a valid SSL certificate</li>
              <li>Check for any errors in the logs with type "ERROR"</li>
              <li>Verify that your bot token is correct and active</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
