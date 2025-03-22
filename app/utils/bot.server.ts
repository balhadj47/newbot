import { Telegraf } from "telegraf";
import { 
  addLog, 
  addUser, 
  getBotSettings, 
  getActiveCommands, 
  setBotRunningStatus 
} from "./db.server";

let bot: Telegraf | null = null;

// Initialize the bot with the given token
export async function initBot(token: string, webhookUrl?: string): Promise<void> {
  if (bot) {
    await stopBot();
  }

  try {
    bot = new Telegraf(token);
    
    // Set up webhook if URL is provided
    if (webhookUrl) {
      await bot.telegram.setWebhook(webhookUrl);
      addLog("INFO", `Webhook set to ${webhookUrl}`);
    }

    // Register all command handlers from the database
    const commands = getActiveCommands();
    
    // Register help command
    bot.command("start", async (ctx) => {
      const { id, username, first_name, last_name } = ctx.from;
      
      // Save user to database
      addUser(id.toString(), username, first_name, last_name);
      
      // Log the interaction
      addLog("INFO", `New user started the bot: ${username || id}`);
      
      await ctx.reply("Welcome to the bot! Use /help to see available commands.");
    });

    // Register help command
    bot.command("help", async (ctx) => {
      const commands = getActiveCommands();
      const commandList = commands.map(cmd => `/${cmd.command} - ${cmd.description}`).join('\n');
      
      await ctx.reply(`Available commands:\n${commandList || 'No commands available'}`);
    });

    // Register all custom commands
    commands.forEach(cmd => {
      bot.command(cmd.command, async (ctx) => {
        try {
          // Save user to database if they don't exist
          const { id, username, first_name, last_name } = ctx.from;
          addUser(id.toString(), username, first_name, last_name);
          
          // Log the command usage
          addLog("INFO", `Command /${cmd.command} used by ${username || id}`);
          
          // Reply with the command response
          await ctx.reply(cmd.response);
        } catch (error) {
          addLog("ERROR", `Error handling command /${cmd.command}`, error);
        }
      });
    });

    // Handle any other messages
    bot.on('message', async (ctx) => {
      try {
        // Save user to database if they don't exist
        const { id, username, first_name, last_name } = ctx.from;
        addUser(id.toString(), username, first_name, last_name);
        
        // Log the message
        addLog("INFO", `Received message from ${username || id}`, ctx.message);
        
        // For non-command messages, we can reply with a default message or process it
        if (ctx.message && 'text' in ctx.message && !ctx.message.text.startsWith('/')) {
          await ctx.reply("I only respond to commands. Use /help to see available commands.");
        }
      } catch (error) {
        addLog("ERROR", "Error handling message", error);
      }
    });

    // Log errors
    bot.catch((err, ctx) => {
      addLog("ERROR", "Bot error", { error: err.message, updateType: ctx.updateType, update: ctx.update });
    });

    // If we're not using webhooks, use polling
    if (!webhookUrl) {
      await bot.launch();
      addLog("INFO", "Bot started with long polling");
    }

    setBotRunningStatus(true);
    addLog("INFO", "Bot initialized successfully");
  } catch (error) {
    addLog("ERROR", "Failed to initialize bot", error);
    setBotRunningStatus(false);
    throw error;
  }
}

// Process an update received from a webhook
export async function processUpdate(update: any): Promise<void> {
  if (!bot) {
    addLog("ERROR", "Received webhook update but bot is not initialized");
    return;
  }

  try {
    await bot.handleUpdate(update);
  } catch (error) {
    addLog("ERROR", "Error processing webhook update", error);
  }
}

// Stop the bot
export async function stopBot(): Promise<void> {
  if (bot) {
    try {
      // Remove webhook and stop polling
      await bot.telegram.deleteWebhook();
      bot.stop();
      bot = null;
      
      setBotRunningStatus(false);
      addLog("INFO", "Bot stopped");
    } catch (error) {
      addLog("ERROR", "Error stopping bot", error);
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
    
    if (!settings || !settings.token) {
      addLog("ERROR", "Cannot start bot: No token found in settings");
      return false;
    }
    
    await initBot(settings.token, settings.webhook_url || undefined);
    return true;
  } catch (error) {
    addLog("ERROR", "Failed to start bot from settings", error);
    return false;
  }
}
