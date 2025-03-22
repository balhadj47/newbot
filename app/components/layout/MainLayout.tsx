import React from "react";
import { Link, NavLink, useLocation } from "@remix-run/react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  
  const navLinks = [
    { title: "Dashboard", path: "/dashboard" },
    { title: "Users", path: "/dashboard/users" },
    { title: "Commands", path: "/dashboard/commands" },
    { title: "Logs", path: "/dashboard/logs" },
    { title: "Settings", path: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                  Telegram Bot Manager
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => 
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    {link.title}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
