import { Outlet } from "@remix-run/react";
import BotControls from "~/components/ui/BotControls";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md">
        <div className="py-6 px-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">TeleBot Dashboard</h1>
        </div>
        
        {/* Navigation */}
        <nav className="mt-2">
          <a 
            href="/dashboard" 
            className="flex items-center py-3 px-6 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="mr-3">📊</span>
            Overview
          </a>
          <a 
            href="/dashboard/users" 
            className="flex items-center py-3 px-6 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="mr-3">👥</span>
            Users
          </a>
          <a 
            href="/dashboard/commands" 
            className="flex items-center py-3 px-6 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="mr-3">📝</span>
            Commands
          </a>
          <a 
            href="/dashboard/products" 
            className="flex items-center py-3 px-6 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="mr-3">🛒</span>
            Products
          </a>
          <a 
            href="/dashboard/logs" 
            className="flex items-center py-3 px-6 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="mr-3">📃</span>
            Logs
          </a>
          <a 
            href="/dashboard/settings" 
            className="flex items-center py-3 px-6 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="mr-3">⚙️</span>
            Settings
          </a>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with bot controls */}
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
          <BotControls />
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
