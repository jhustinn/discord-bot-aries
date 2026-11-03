<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('class'); // frigates, destroyers, cruisers, battleships, submarines, carriers, assault-carriers, ekranoplan, hovercrafts, assault-landing-ships
            $table->integer('tier')->default(3);
            $table->string('category')->default('Shop'); // Market, Gacha, Shop, Battle Pass, Event
            $table->string('country')->nullable(); // USA, Russia, China, Japan, etc.
            $table->jsonb('aliases')->nullable(); // alternative names / abbreviations for OCR
            $table->text('image_url')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('class');
            $table->index('tier');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ships');
    }
};
