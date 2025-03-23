// In-memory database since better-sqlite3 doesn't work in WebContainer
// This simulates a database using JavaScript objects

// Database structure
let db = {
  settings: {
    1: {
      id: 1,
      token: null,
      webhook_url: "",
      is_running: false
    }
  },
  users: {},
  commands: {},
  logs: {}
};

// Initialize counters for auto-incrementing IDs
let counters = {
  users: 0,
  commands: 0,
  logs: 0
};

// Helper functions for settings
export function getBotSettings() {
  return db.settings[1];
}

export function updateBotSettings(token: string, webhookUrl: string) {
  db.settings[1].token = token;
  db.settings[1].webhook_url = webhookUrl;
  return { changes: 1 };
}

export function setBotRunningStatus(isRunning: boolean) {
  db.settings[1].is_running = isRunning;
  return { changes: 1 };
}

// Helper functions for users
export function getUsers() {
  return Object.values(db.users).sort((a: any, b: any) => 
    new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
  );
}

export function addUser(telegramId: string, username: string | undefined, firstName: string | undefined, lastName: string | undefined) {
  // Check if user already exists
  const existingUser = Object.values(db.users).find((u: any) => u.telegram_id === telegramId);
  if (existingUser) return { changes: 0 };

  // Add new user
  counters.users++;
  const now = new Date().toISOString();
  db.users[counters.users] = {
    id: counters.users,
    telegram_id: telegramId,
    username: username || null,
    first_name: firstName || null,
    last_name: lastName || null,
    joined_at: now
  };
  
  return { changes: 1, lastInsertRowid: counters.users };
}

// Helper functions for commands
export function getCommands() {
  return Object.values(db.commands);
}

export function getActiveCommands() {
  return Object.values(db.commands).filter((cmd: any) => cmd.is_active);
}

export function addCommand(command: string, description: string, response: string) {
  counters.commands++;
  db.commands[counters.commands] = {
    id: counters.commands,
    command,
    description,
    response,
    is_active: true
  };
  
  return { changes: 1, lastInsertRowid: counters.commands };
}

export function updateCommand(id: number, command: string, description: string, response: string, isActive: boolean) {
  if (!db.commands[id]) return { changes: 0 };
  
  db.commands[id] = {
    ...db.commands[id],
    command,
    description,
    response,
    is_active: isActive
  };
  
  return { changes: 1 };
}

export function deleteCommand(id: number) {
  if (!db.commands[id]) return { changes: 0 };
  
  delete db.commands[id];
  return { changes: 1 };
}

// Helper functions for logs
export function getLogs(limit = 100, type = null, search = null, timeFilter = null) {
  let logs = Object.values(db.logs);
  
  // Filter by type if specified
  if (type && type !== "ALL") {
    logs = logs.filter((log: any) => log.type === type);
  }
  
  // Filter by search term if specified
  if (search) {
    const searchLower = search.toLowerCase();
    logs = logs.filter((log: any) => 
      log.message.toLowerCase().includes(searchLower) || 
      (log.data && log.data.toLowerCase().includes(searchLower))
    );
  }
  
  // Filter by time if specified
  if (timeFilter) {
    logs = logs.filter((log: any) => log.timestamp >= timeFilter);
  }
  
  // Sort by timestamp (newest first)
  logs = logs.sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Limit the number of logs
  return logs.slice(0, limit);
}

export function addLog(type: string, message: string, data?: any) {
  counters.logs++;
  const now = new Date().toISOString();
  
  // Stringify data if it's not already a string
  let dataStr = null;
  if (data !== null && data !== undefined) {
    try {
      dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    } catch (e) {
      dataStr = "[Circular or non-serializable data]";
    }
  }
  
  db.logs[counters.logs] = {
    id: counters.logs,
    type,
    message,
    data: dataStr,
    timestamp: now
  };
  
  return { changes: 1, lastInsertRowid: counters.logs };
}

export function clearLogs() {
  const count = Object.keys(db.logs).length;
  db.logs = {};
  return { changes: count };
}

export function getLogStats() {
  const logs = Object.values(db.logs);
  
  return {
    total: logs.length,
    error: logs.filter((log: any) => log.type === 'ERROR').length,
    warning: logs.filter((log: any) => log.type === 'WARNING').length,
    success: logs.filter((log: any) => log.type === 'SUCCESS').length,
    info: logs.filter((log: any) => 
      log.type === 'INFO' || 
      (log.type !== 'ERROR' && log.type !== 'WARNING' && log.type !== 'SUCCESS')
    ).length
  };
}

// Add some initial data for testing
// Add a sample command
addCommand("help", "Show available commands", "Here are the available commands:\n/help - Show this help message");

// Export the db object for potential direct manipulation (if needed)
export { db };
