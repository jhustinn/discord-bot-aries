<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Discord\Discord;
use Discord\WebSockets\Event;
use Discord\WebSockets\Intents;
use Discord\Parts\Channel\Message;
use App\Models\VerificationTicket;
use App\Models\VerifiedPlayer;
use App\Models\RbacRole;

class RunDiscordBot extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'discord:run {--test : Run in self-test mode and disconnect after ready}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the Modern Warships Discord Bot directly inside Laravel';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $token = env('DISCORD_TOKEN');

        if (empty($token)) {
            $this->error('DISCORD_TOKEN is not configured in .env!');
            return 1;
        }

        $this->info('Initializing Discord Bot client in Laravel PHP...');

        try {
            $discord = new Discord([
                'token' => $token,
                'intents' => Intents::getDefaultIntents() | Intents::MESSAGE_CONTENT | Intents::GUILD_MEMBERS,
            ]);

            $discord->on('ready', function (Discord $discord) {
                $this->newLine();
                $this->info('======================================================');
                $this->info('🚀 DISCORD BOT SUCCESSFULLY CONNECTED VIA LARAVEL!');
                $this->info("🤖 Logged in as: {$discord->user->username}#{$discord->user->discriminator} (ID: {$discord->user->id})");
                $this->info("🏰 Guilds connected: {$discord->guilds->count()}");
                
                foreach ($discord->guilds as $guild) {
                    $this->line("   - {$guild->name} (ID: {$guild->id}, Members: {$guild->member_count})");
                }

                // Query database directly using Laravel Eloquent Models
                $this->newLine();
                $this->info('📊 DIRECT LARAVEL ELOQUENT ACCESS TEST:');
                $ticketCount = VerificationTicket::count();
                $playerCount = VerifiedPlayer::count();
                $roleCount = RbacRole::count();
                $this->line("   - Total Verification Tickets in DB: {$ticketCount}");
                $this->line("   - Total Verified Players in DB: {$playerCount}");
                $this->line("   - Total RBAC Roles in DB: {$roleCount}");
                $this->info('======================================================');
                $this->newLine();

                if ($this->option('test')) {
                    $this->info('✅ Self-test completed successfully! Disconnecting...');
                    $discord->close();
                    return;
                }

                $this->info('📡 Bot is listening for events (Type !ping in any server channel to test)...');
            });

            // Message handler for test commands
            $discord->on(Event::MESSAGE_CREATE, function (Message $message, Discord $discord) {
                // Ignore bot messages
                if ($message->author->bot) {
                    return;
                }

                $content = trim($message->content);

                // Ping-pong test
                if ($content === '!ping') {
                    $playerCount = VerifiedPlayer::count();
                    $ticketCount = VerificationTicket::count();

                    $message->reply(
                        "🏓 **Pong from Laravel 12 & PHP 8.2!**\n" .
                        "⚡ Bot berjalan 100% murni di dalam Laravel.\n" .
                        "📊 **Live Eloquent DB Data:**\n" .
                        "• Verified Players: **{$playerCount}**\n" .
                        "• Total Tickets: **{$ticketCount}**"
                    );
                    
                    $this->info("Replied to !ping from {$message->author->username} in #{$message->channel->name}");
                }
            });

            $discord->run();

        } catch (\Throwable $e) {
            $this->error('Error running Discord bot: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}
