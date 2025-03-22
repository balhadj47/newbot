import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUsers, getLogs } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const users = getUsers();
  const logs = getLogs(5);
  
  return json({
    totalUsers: users.length,
    recentUsers: users.slice(0, 5),
    recentLogs: logs
  });
}

export default function Dashboard() {
  const { totalUsers, recentUsers, recentLogs } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bot Statistics</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
              <span className="text-gray-600 dark:text-gray-400">Total Users</span>
              <span className="text-gray-900 dark:text-white font-medium">{totalUsers}</span>
            </div>
          </div>
        </div>
        
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Users
          </h2>
          {recentUsers.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentUsers.map((user) => (
                <li key={user.id} className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.first_name} {user.last_name} {user.username ? `(@${user.username})` : ""}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {user.telegram_id}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No users yet</p>
          )}
        </div>
      </div>
      
      {/* Recent Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity Logs
        </h2>
        {recentLogs.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentLogs.map((log) => (
              <li key={log.id} className="py-3">
                <div className="flex items-start">
                  <span 
                    className={`inline-block w-16 text-xs font-medium px-2 py-1 rounded-full mr-3 ${
                      log.type === 'ERROR' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
                        : log.type === 'WARNING'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    }`}
                  >
                    {log.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{log.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No logs yet</p>
        )}
      </div>
    </div>
  );
}
