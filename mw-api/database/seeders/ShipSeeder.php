<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ship;
use Illuminate\Support\Str;

class ShipSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ships = [
            // ─── FRIGATES ─────────────────────────────────────────────────────
            [
                'name' => 'IT FREMM-EVO',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'Italy',
                'aliases' => ['FREMM-EVO', 'FREMM EVO', 'IT FREMM EVO', 'FREMM'],
                'description' => 'Italian stealth multi-purpose frigate equipped with advanced anti-ship missiles.'
            ],
            [
                'name' => 'BR Bahia (G40)',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Brazil',
                'aliases' => ['BR Bahia', 'Bahia', 'G40'],
                'description' => 'Brazilian multipurpose frigate vessel.'
            ],
            [
                'name' => 'RF Admiral Gorshkov',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['Admiral Gorshkov', 'Gorshkov', 'Project 22350'],
                'description' => 'Russian stealth guided missile frigate.'
            ],
            [
                'name' => 'CNS Type 054B',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Battle Pass',
                'country' => 'China',
                'aliases' => ['Type 054B', '054B', 'CNS 054B'],
                'description' => 'Next-generation PLAN guided missile frigate.'
            ],
            [
                'name' => 'USS Constitution II',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'USA',
                'aliases' => ['Constitution II', 'Constitution'],
                'description' => 'Experimental US guided missile frigate.'
            ],
            [
                'name' => 'USS FF(X)',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['FF(X)', 'FFX', 'FFGX', 'Constellation Class'],
                'description' => 'US Navy guided-missile frigate program.'
            ],
            [
                'name' => 'JS Mogami (FFM-1)',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Japan',
                'aliases' => ['JS Mogami', 'Mogami', 'FFM-1'],
                'description' => 'JMSDF stealth frigate designed for multi-mission operations.'
            ],
            [
                'name' => 'FGS F126',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Battle Pass',
                'country' => 'Germany',
                'aliases' => ['F126', 'FGS F-126', 'MKS 180'],
                'description' => 'German Navy multi-role frigate.'
            ],
            [
                'name' => 'FGS F127',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Gacha',
                'country' => 'Germany',
                'aliases' => ['F127', 'FGS F-127'],
                'description' => 'Future German air defense frigate.'
            ],
            [
                'name' => 'ROKS FFX Batch III',
                'class' => 'frigates',
                'tier' => 3,
                'category' => 'Battle Pass',
                'country' => 'South Korea',
                'aliases' => ['FFX Batch III', 'Chungnam', 'ROKS Chungnam'],
                'description' => 'ROKN advanced anti-air frigate.'
            ],

            // ─── DESTROYERS ───────────────────────────────────────────────────
            [
                'name' => 'CN Type 055 Nanchang',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'China',
                'aliases' => ['Type 055 Nanchang', 'Type 055', 'Nanchang', '055'],
                'description' => 'Heavy stealth guided missile destroyer with 112 VLS cells.'
            ],
            [
                'name' => 'CN Type 055A',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'China',
                'aliases' => ['Type 055A', '055A'],
                'description' => 'Modernized variant of Type 055.'
            ],
            [
                'name' => 'CN Type 058',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Gacha',
                'country' => 'China',
                'aliases' => ['Type 058', '058'],
                'description' => 'Next-gen railgun guided missile destroyer.'
            ],
            [
                'name' => 'USS Zumwalt (DDG-1000)',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['USS Zumwalt', 'Zumwalt', 'DDG-1000'],
                'description' => 'US Navy stealth guided missile destroyer.'
            ],
            [
                'name' => 'USS Michael Monsoor (DDG-1001)',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'USA',
                'aliases' => ['Michael Monsoor', 'Monsoor', 'DDG-1001'],
                'description' => 'Second ship of the Zumwalt-class stealth destroyers.'
            ],
            [
                'name' => 'USS Jack H. Lucas (DDG-125)',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Battle Pass',
                'country' => 'USA',
                'aliases' => ['Jack H. Lucas', 'Jack Lucas', 'DDG-125', 'Flight III'],
                'description' => 'First Arleigh Burke Flight III guided missile destroyer.'
            ],
            [
                'name' => 'RF Lider (Project 23560)',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['RF Lider', 'Lider', 'Project 23560'],
                'description' => 'Russian nuclear-powered stealth destroyer concept.'
            ],
            [
                'name' => 'RF Admiral Ushakov',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['Admiral Ushakov', 'Ushakov', 'Sovremenny'],
                'description' => 'Sovremenny-class guided missile destroyer.'
            ],
            [
                'name' => 'JS Maya (DDG-179)',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Japan',
                'aliases' => ['JS Maya', 'Maya', 'DDG-179'],
                'description' => 'JMSDF improved Atago-class Aegis guided missile destroyer.'
            ],
            [
                'name' => 'ROKS Jeongjo the Great',
                'class' => 'destroyers',
                'tier' => 3,
                'category' => 'Battle Pass',
                'country' => 'South Korea',
                'aliases' => ['Jeongjo the Great', 'Jeongjo', 'KDX-III Batch II'],
                'description' => 'Korean KDX-III Batch-II Aegis guided-missile destroyer.'
            ],

            // ─── CRUISERS ─────────────────────────────────────────────────────
            [
                'name' => 'RF TARK Pyotr Velikiy',
                'class' => 'cruisers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['Pyotr Velikiy', 'Peter the Great', 'RF Pyotr Velikiy', 'Kirov Class'],
                'description' => 'Heavy nuclear-powered guided missile battlecruiser.'
            ],
            [
                'name' => 'RF Varyag',
                'class' => 'cruisers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['Varyag', 'RF Varyag', 'Slava Class'],
                'description' => 'Slava-class guided missile cruiser.'
            ],
            [
                'name' => 'USS Port Royal (CG-73)',
                'class' => 'cruisers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['USS Port Royal', 'Port Royal', 'CG-73', 'Ticonderoga'],
                'description' => 'Ticonderoga-class Aegis guided missile cruiser.'
            ],
            [
                'name' => 'USS CGX-21',
                'class' => 'cruisers',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'USA',
                'aliases' => ['CGX-21', 'CGX21'],
                'description' => 'Next-generation stealth cruiser program concept.'
            ],
            [
                'name' => 'FS Blue Shark',
                'class' => 'cruisers',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'France',
                'aliases' => ['Blue Shark', 'FS Blue Shark'],
                'description' => 'French futuristic stealth trimaran cruiser.'
            ],

            // ─── BATTLESHIPS ──────────────────────────────────────────────────
            [
                'name' => 'USS Missouri (BB-63)',
                'class' => 'battleships',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['USS Missouri', 'Missouri', 'BB-63', 'Mighty Mo'],
                'description' => 'Iowa-class modernized battleship with massive 406mm guns and Tomahawks.'
            ],
            [
                'name' => 'USS Massachusetts (BB-59)',
                'class' => 'battleships',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'USA',
                'aliases' => ['Massachusetts', 'BB-59'],
                'description' => 'South Dakota-class fast battleship.'
            ],
            [
                'name' => 'USS New Hampshire (BB-1011)',
                'class' => 'battleships',
                'tier' => 3,
                'category' => 'Gacha',
                'country' => 'USA',
                'aliases' => ['New Hampshire', 'BB-1011'],
                'description' => 'Modernized railgun dreadnought battleship.'
            ],
            [
                'name' => 'IJN Yamato',
                'class' => 'battleships',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Japan',
                'aliases' => ['Yamato', 'IJN Yamato'],
                'description' => 'Legendary super-battleship with 460mm naval artillery.'
            ],
            [
                'name' => 'IJN Yamato Aegis',
                'class' => 'battleships',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'Japan',
                'aliases' => ['Yamato Aegis', 'Aegis Yamato'],
                'description' => 'Futuristic refit of Yamato with Aegis radar and laser air defense.'
            ],
            [
                'name' => 'RF Moscow',
                'class' => 'battleships',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'Russia',
                'aliases' => ['Moscow', 'RF Moscow'],
                'description' => 'Heavy Russian missile battleship.'
            ],
            [
                'name' => 'Bismarck',
                'class' => 'battleships',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'Germany',
                'aliases' => ['KMS Bismarck', 'Bismarck'],
                'description' => 'Kriegsmarine flagship battleship.'
            ],

            // ─── SUBMARINES ───────────────────────────────────────────────────
            [
                'name' => 'SMX-31',
                'class' => 'submarines',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'France',
                'aliases' => ['SMX31', 'SMX 31', 'The Electric'],
                'description' => 'French futuristic biomimetic stealth submarine.'
            ],
            [
                'name' => 'RF Belgorod (K-329)',
                'class' => 'submarines',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'Russia',
                'aliases' => ['Belgorod', 'K-329', 'RF Belgorod'],
                'description' => 'Gigantic special-purpose nuclear submarine armed with Poseidon torpedoes.'
            ],
            [
                'name' => 'USS Ohio (SSGN-726)',
                'class' => 'submarines',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['USS Ohio', 'Ohio', 'SSGN-726'],
                'description' => 'Guided missile nuclear submarine carrying up to 154 cruise missiles.'
            ],
            [
                'name' => 'USS Columbia (SSBN-826)',
                'class' => 'submarines',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'USA',
                'aliases' => ['Columbia', 'SSBN-826'],
                'description' => 'US Navy next-generation ballistic missile submarine.'
            ],
            [
                'name' => 'CN Type 096',
                'class' => 'submarines',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'China',
                'aliases' => ['Type 096', '096'],
                'description' => 'Chinese third-generation ballistic missile nuclear submarine.'
            ],

            // ─── AIRCRAFT CARRIERS ────────────────────────────────────────────
            [
                'name' => 'USS Nimitz (CVN-68)',
                'class' => 'carriers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['Nimitz', 'CVN-68', 'USS Nimitz'],
                'description' => 'US Navy nuclear-powered supercarrier.'
            ],
            [
                'name' => 'RF Shtorm (Project 23000E)',
                'class' => 'carriers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['RF Shtorm', 'Shtorm', 'Project 23000E'],
                'description' => 'Russian heavy prospective aircraft carrier design.'
            ],
            [
                'name' => 'CN Type 003 Fujian',
                'class' => 'carriers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'China',
                'aliases' => ['Type 003', 'Fujian', 'Type 003 Fujian', '003'],
                'description' => 'PLAN CATOBAR aircraft carrier equipped with electromagnetic catapults.'
            ],

            // ─── ASSAULT CARRIERS (ACV) ───────────────────────────────────────
            [
                'name' => 'USS Gerald R. Ford (CVN-78)',
                'class' => 'assault-carriers',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['Gerald R. Ford', 'Gerald Ford', 'CVN-78', 'Ford'],
                'description' => 'Most advanced US Navy nuclear-powered supercarrier with EMALS.'
            ],
            [
                'name' => 'USS Enterprise (CVN-80)',
                'class' => 'assault-carriers',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'USA',
                'aliases' => ['Enterprise', 'CVN-80', 'USS Enterprise'],
                'description' => 'Third Gerald R. Ford-class aircraft carrier.'
            ],
            [
                'name' => 'CN Type 004',
                'class' => 'assault-carriers',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'China',
                'aliases' => ['Type 004', '004', 'CN Type 004'],
                'description' => 'Chinese prospective nuclear-powered supercarrier.'
            ],
            [
                'name' => 'FS Charles de Gaulle',
                'class' => 'assault-carriers',
                'tier' => 3,
                'category' => 'Battle Pass',
                'country' => 'France',
                'aliases' => ['Charles de Gaulle', 'De Gaulle', 'FS Charles de Gaulle (R91)'],
                'description' => 'French nuclear-powered aircraft carrier.'
            ],

            // ─── EKRANOPLANS ──────────────────────────────────────────────────
            [
                'name' => 'RF Burevestnik (Project 905)',
                'class' => 'ekranoplan',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'Russia',
                'aliases' => ['RF Burevestnik', 'Burevestnik', 'Project 905'],
                'description' => 'Heavy ground-effect wing-in-ground combat ekranoplan.'
            ],
            [
                'name' => 'Pan Spatial Argonas',
                'class' => 'ekranoplan',
                'tier' => 3,
                'category' => 'Market',
                'country' => 'USA',
                'aliases' => ['Argonas', 'Pan Spatial Argonas'],
                'description' => 'Futuristic high-speed aerospace combat ground-effect craft.'
            ],
            [
                'name' => 'RF Bartini A-2000-7',
                'class' => 'ekranoplan',
                'tier' => 3,
                'category' => 'Gacha',
                'country' => 'Russia',
                'aliases' => ['Bartini A-2000-7', 'Bartini', 'A-2000-7'],
                'description' => 'Experimental amphibious high-speed combat ground-effect vehicle.'
            ],
            [
                'name' => 'Lun-class MD-160',
                'class' => 'ekranoplan',
                'tier' => 2,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['Lun', 'Lun-class', 'MD-160', 'Caspian Sea Monster'],
                'description' => 'Legendary Soviet ground-effect missile carrier.'
            ],

            // ─── HOVERCRAFTS ──────────────────────────────────────────────────
            [
                'name' => 'LCAC (Landing Craft Air Cushion)',
                'class' => 'hovercrafts',
                'tier' => 2,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['LCAC', 'Landing Craft'],
                'description' => 'Air-cushioned landing craft capable of high speed on water and land.'
            ],
            [
                'name' => 'Zubr-class',
                'class' => 'hovercrafts',
                'tier' => 2,
                'category' => 'Shop',
                'country' => 'Russia',
                'aliases' => ['Zubr', 'Zubr-class', 'Project 12322'],
                'description' => 'World largest military hovercraft.'
            ],
            [
                'name' => 'Mudskipper',
                'class' => 'hovercrafts',
                'tier' => 3,
                'category' => 'Battle Pass',
                'country' => 'USA',
                'aliases' => ['Mudskipper'],
                'description' => 'Advanced tactical hovercraft.'
            ],

            // ─── ASSAULT LANDING SHIPS ────────────────────────────────────────
            [
                'name' => 'CN Type 075',
                'class' => 'assault-landing-ships',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'China',
                'aliases' => ['Type 075', '075', 'Hainan'],
                'description' => 'PLAN landing helicopter dock with a full flight deck.'
            ],
            [
                'name' => 'USS America (LHA-6)',
                'class' => 'assault-landing-ships',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'USA',
                'aliases' => ['USS America', 'America', 'LHA-6'],
                'description' => 'US Navy aviation-centric amphibious assault ship.'
            ],
            [
                'name' => 'Mistral-class',
                'class' => 'assault-landing-ships',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'France',
                'aliases' => ['Mistral', 'Mistral-class', 'BPC'],
                'description' => 'French Navy amphibious assault helicopter carrier.'
            ],
            [
                'name' => 'ROKS Dokdo (LPH-6111)',
                'class' => 'assault-landing-ships',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'South Korea',
                'aliases' => ['Dokdo', 'ROKS Dokdo', 'LPH-6111'],
                'description' => 'Republic of Korea Navy amphibious assault ship.'
            ],
            [
                'name' => 'JS Hyuga (DDH-181)',
                'class' => 'assault-landing-ships',
                'tier' => 3,
                'category' => 'Shop',
                'country' => 'Japan',
                'aliases' => ['JS Hyuga', 'Hyuga', 'DDH-181'],
                'description' => 'JMSDF helicopter destroyer with flat top deck.'
            ]
        ];

        foreach ($ships as $ship) {
            Ship::updateOrCreate(
                ['name' => $ship['name']],
                [
                    'id' => (string) Str::uuid(),
                    'class' => $ship['class'],
                    'tier' => $ship['tier'],
                    'category' => $ship['category'],
                    'country' => $ship['country'] ?? null,
                    'aliases' => $ship['aliases'],
                    'description' => $ship['description'] ?? null,
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Seeded ' . count($ships) . ' master ships into PostgreSQL!');
    }
}
