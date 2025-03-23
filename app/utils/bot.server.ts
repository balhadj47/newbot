import { Telegraf } from "telegraf";
import { 
  addLog, 
  addUser, 
  getBotSettings, 
  getActiveCommands, 
  setBotRunningStatus 
} from "./db.server";

let bot: Telegraf | null = null;

// Create a more detailed logger that captures full request/response data
const captureLog = (type: string, message: string, data?: any) => {
  // Add timestamp to data for chronological reference
  const timestamp = new Date().toISOString();
  const enhancedData = {
    timestamp,
    ...(data || {}),
  };
  
  // Log to console for real-time debugging
  console.log(`[${type}][${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  
  // Save to database
  addLog(type, message, enhancedData);
};

// Initialize the bot with the given token
export async function initBot(token: string, webhookUrl?: string): Promise<void> {
  if (bot) {
    await stopBot();
  }

  try {
    bot = new Telegraf(token);
    captureLog("INFO", "Bot instance created with provided token", { tokenFirstChars: token.substring(0, 5) + '...' });
    
    // Add middleware to log all updates
    bot.use((ctx, next) => {
      const update = ctx.update;
      captureLog("INFO", "Received update from Telegram", { 
        updateType: ctx.updateType, 
        updateId: update.update_id,
        fullUpdate: update
      });
      return next();
    });
    
    // Log all API responses
    const originalCallApi = bot.telegram.callApi.bind(bot.telegram);
    bot.telegram.callApi = async (method, payload) => {
      captureLog("INFO", `API Request: ${method}`, { payload });
      try {
        const response = await originalCallApi(method, payload);
        captureLog("SUCCESS", `API Response: ${method}`, { response });
        return response;
      } catch (error) {
        captureLog("ERROR", `API Error: ${method}`, { error, payload });
        throw error;
      }
    };
    
    // Set up webhook if URL is provided
    if (webhookUrl) {
      try {
        // First, check current webhook status
        const webhookInfo = await bot.telegram.getWebhookInfo();
        captureLog("INFO", `Current webhook status`, { webhookInfo });
        
        // Delete any existing webhook first to ensure clean setup
        await bot.telegram.deleteWebhook();
        captureLog("INFO", "Deleted existing webhook configuration");
        
        // Set the webhook - IMPORTANT: this must match exactly what your Remix route expects
        await bot.telegram.setWebhook(webhookUrl, {
          drop_pending_updates: true
        });
        captureLog("INFO", `Webhook set request sent to: ${webhookUrl}`);
        
        // Verify the webhook was set correctly
        const newWebhookInfo = await bot.telegram.getWebhookInfo();
        captureLog("INFO", `New webhook status`, { webhookInfo: newWebhookInfo });
        
        if (newWebhookInfo.url === webhookUrl) {
          captureLog("SUCCESS", `Webhook successfully set to ${webhookUrl}`);
        } else {
          captureLog("ERROR", `Failed to set webhook. Expected ${webhookUrl} but got ${newWebhookInfo.url || 'none'}`, {
            expected: webhookUrl,
            actual: newWebhookInfo.url,
            fullResponse: newWebhookInfo
          });
          if (newWebhookInfo.last_error_message) {
            captureLog("ERROR", `Telegram error: ${newWebhookInfo.last_error_message}`, { fullInfo: newWebhookInfo });
          }
        }
      } catch (error) {
        captureLog("ERROR", `Webhook setup failed`, {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error
        });
        throw error;
      }
    } else {
      // If no webhook, ensure any existing webhook is removed and use polling
      await bot.telegram.deleteWebhook();
      captureLog("INFO", "No webhook URL provided, using long polling mode");
    }

    // Register all command handlers from the database
    const commands = getActiveCommands();
    
    // Register help command
    bot.command("start", async (ctx) => {
      const { id, username, first_name, last_name } = ctx.from;
      
      captureLog("INFO", `Start command received`, { 
        from: { id, username, first_name, last_name },
        chat: ctx.chat,
        fullContext: ctx.update
      });
      
      // Save user to database
      addUser(id.toString(), username, first_name, last_name);
      
      // Log the interaction
      captureLog("INFO", `New user started the bot: ${username || id}`);
      
      try {
        const response = await ctx.reply("Welcome to the bot! Use /help to see available commands.");
        captureLog("SUCCESS", "Start command response sent", { responseMessage: response });
      } catch (error) {
        captureLog("ERROR", "Failed to send start command response", { error });
      }
    });

    // Register help command
    bot.command("help", async (ctx) => {
      const commands = getActiveCommands();
      const commandList = commands.map(cmd => `/${cmd.command} - ${cmd.description}`).join('\n');
      
      captureLog("INFO", "Help command received", {
        from: ctx.from,
        chat: ctx.chat,
        availableCommands: commands
      });
      
      try {
        const response = await ctx.reply(`Available commands:\n${commandList || 'No commands available'}`);
        captureLog("SUCCESS", "Help command response sent", { responseMessage: response });
      } catch (error) {
        captureLog("ERROR", "Failed to send help command response", { error });
      }
    });

    // Register all custom commands
    commands.forEach(cmd => {
      bot.command(cmd.command, async (ctx) => {
        try {
          // Save user to database if they don't exist
          const { id, username, first_name, last_name } = ctx.from;
          addUser(id.toString(), username, first_name, last_name);
          
          // Log the command usage with full context
          captureLog("INFO", `Command /${cmd.command} used`, {
            user: { id, username, first_name, last_name },
            chat: ctx.chat,
            messageId: ctx.message?.message_id,
            commandDetails: cmd,
            fullUpdate: ctx.update
          });
          
          // Reply with the command response
          const response = await ctx.reply(cmd.response);
          captureLog("SUCCESS", `Command /${cmd.command} response sent`, {
            responseMessage: response,
            originalCommand: cmd
          });
        } catch (error) {
          captureLog("ERROR", `Error handling command /${cmd.command}`, {
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack
            } : error,
            command: cmd
          });
        }
      });
    });

    // Handle any other messages
    bot.on('message', async (ctx) => {
      try {
        // Save user to database if they don't exist
        const { id, username, first_name, last_name } = ctx.from;
        addUser(id.toString(), username, first_name, last_name);
        
        // Log the message with full details
        captureLog("INFO", `Received message from ${username || id}`, {
          user: { id, username, first_name, last_name },
          chat: ctx.chat,
          message: ctx.message,
          fullUpdate: ctx.update
        });
        
        // For non-command messages, we can reply with a default message or process it
        if (ctx.message && 'text' in ctx.message && !ctx.message.text.startsWith('/')) {
          const response = await ctx.reply("I only respond to commands. Use /help to see available commands.");
          captureLog("INFO", "Sent non-command response", { responseMessage: response });
        }
      } catch (error) {
        captureLog("ERROR", "Error handling message", {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : error,
          update: ctx.update
        });
      }
    });

    // Log errors with detailed stack traces
    bot.catch((err, ctx) => {
      captureLog("ERROR", "Bot error", { 
        error: {
          message: err.message,
          name: err.name,
          stack: err.stack
        }, 
        updateType: ctx.updateType, 
        update: ctx.update 
      });
    });

    // If we're not using webhooks, use polling
    if (!webhookUrl) {
      await bot.launch();
      captureLog("INFO", "Bot started with long polling");
    } else {
      captureLog("INFO", "Bot configured to use webhook mode");
    }

    setBotRunningStatus(true);
    captureLog("INFO", "Bot initialized successfully");
  } catch (error) {
    captureLog("ERROR", "Failed to initialize bot", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    setBotRunningStatus(false);
    throw error;
  }
}

// Process an update received from a webhook
export async function processUpdate(update: any): Promise<void> {
  if (!bot) {
    captureLog("ERROR", "Received webhook update but bot is not initialized", { update });
    return;
  }

  try {
    captureLog("INFO", "Processing webhook update", { 
      updateId: update.update_id,
      updateType: getUpdateType(update),
      fullUpdate: update 
    });
    
    await bot.handleUpdate(update);
    captureLog("INFO", "Successfully processed webhook update", { updateId: update.update_id });
  } catch (error) {
    captureLog("ERROR", "Error processing webhook update", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      update
    });
  }
}

// Helper to determine update type
function getUpdateType(update: any): string {
  if (update.message) return 'message';
  if (update.edited_message) return 'edited_message';
  if (update.channel_post) return 'channel_post';
  if (update.edited_channel_post) return 'edited_channel_post';
  if (update.inline_query) return 'inline_query';
  if (update.chosen_inline_result) return 'chosen_inline_result';
  if (update.callback_query) return 'callback_query';
  if (update.shipping_query) return 'shipping_query';
  if (update.pre_checkout_query) return 'pre_checkout_query';
  if (update.poll) return 'poll';
  if (update.poll_answer) return 'poll_answer';
  if (update.my_chat_member) return 'my_chat_member';
  if (update.chat_member) return 'chat_member';
  if (update.chat_join_request) return 'chat_join_request';
  return 'unknown';
}

// Stop the bot
export async function stopBot(): Promise<void> {
  if (bot) {
    try {
      // Remove webhook and stop polling
      captureLog("INFO", "Attempting to stop bot");
      await bot.telegram.deleteWebhook();
      bot.stop();
      bot = null;
      
      setBotRunningStatus(false);
      captureLog("INFO", "Bot stopped successfully");
    } catch (error) {
      captureLog("ERROR", "Error stopping bot", {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });
    }
  }
}

// Check if the bot is running
export function isBotRunning(): boolean {
  return bot !== null;
}

// Function to start the bot from settings in the database
export async function startBotFromSettings(): Promise<boolean> {
  try {
    const settings = getBotSettings();
    captureLog("INFO", "Attempting to start bot from settings", { settingsFound: !!settings });
    
    if (!settings || !settings.token) {
      captureLog("ERROR", "Cannot start bot: No token found in settings");
      return false;
    }
    
    await initBot(settings.token, settings.webhook_url || undefined);
    return true;
  } catch (error) {
    captureLog("ERROR", "Failed to start bot from settings", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    return false;
  }
}

// Add a function to manually test the webhook connection
export async function testWebhook(webhookUrl: string): Promise<any> {
  if (!bot) {
    const error = new Error("Bot not initialized");
    captureLog("ERROR", "Test webhook failed: Bot not initialized", { error });
    throw error;
  }
  
  try {
    captureLog("INFO", "Testing webhook connection", { webhookUrl });
    
    // First check current webhook info
    const webhookInfo = await bot.telegram.getWebhookInfo();
    captureLog("INFO", "Current webhook info", { webhookInfo });
    
    // Delete any existing webhook
    await bot.telegram.deleteWebhook();
    captureLog("INFO", "Deleted existing webhook for testing");
    
    // Set the webhook
    await bot.telegram.setWebhook(webhookUrl);
    captureLog("INFO", "Set webhook for testing", { webhookUrl });
    
    // Get the new webhook info
    const newWebhookInfo = await bot.telegram.getWebhookInfo();
    captureLog("INFO", "New webhook info after setting", { webhookInfo: newWebhookInfo });
    
    const result = {
      previous: webhookInfo,
      current: newWebhookInfo,
      success: newWebhookInfo.url === webhookUrl
    };
    
    captureLog(result.success ? "SUCCESS" : "ERROR", 
               result.success ? "Webhook test successful" : "Webhook test failed", 
               result);
    
    return result;
  } catch (error) {
    captureLog("ERROR", "Test webhook failed", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      webhookUrl
    });
    throw error;
  }
}
