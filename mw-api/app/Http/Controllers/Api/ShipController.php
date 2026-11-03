<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ship;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShipController extends Controller
{
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 100);
        $offset = (int) $request->query('offset', 0);
        $class = $request->query('class');
        $tier = $request->query('tier');
        $category = $request->query('category');
        $search = $request->query('search');

        $query = Ship::query()->orderBy('tier', 'desc')->orderBy('name', 'asc');

        if ($class && $class !== 'all') {
            $query->where('class', strtolower(trim($class)));
        }

        if ($tier && $tier !== 'all') {
            $query->where('tier', (int) $tier);
        }

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('country', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $total = $query->count();
        $ships = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'success' => true,
            'total' => $total,
            'data' => $ships
        ]);
    }

    public function classes()
    {
        $classesMeta = [
            'frigates' => ['id' => 'frigates', 'name' => 'Frigates', 'icon' => '🚢'],
            'destroyers' => ['id' => 'destroyers', 'name' => 'Destroyers', 'icon' => '⚔️'],
            'cruisers' => ['id' => 'cruisers', 'name' => 'Cruisers', 'icon' => '🛡️'],
            'battleships' => ['id' => 'battleships', 'name' => 'Battleships', 'icon' => '💥'],
            'submarines' => ['id' => 'submarines', 'name' => 'Submarines', 'icon' => '🦈'],
            'carriers' => ['id' => 'carriers', 'name' => 'Aircraft Carriers', 'icon' => '✈️'],
            'assault-carriers' => ['id' => 'assault-carriers', 'name' => 'Assault Carriers', 'icon' => '🦅'],
            'ekranoplan' => ['id' => 'ekranoplan', 'name' => 'Ekranoplans', 'icon' => '🚀'],
            'hovercrafts' => ['id' => 'hovercrafts', 'name' => 'Hovercrafts', 'icon' => '💨'],
            'assault-landing-ships' => ['id' => 'assault-landing-ships', 'name' => 'Assault Landing Ships', 'icon' => '🏝️'],
        ];

        $counts = Ship::groupBy('class')->selectRaw('class, count(*) as count')->pluck('count', 'class')->toArray();

        $result = [];
        foreach ($classesMeta as $key => $meta) {
            $result[] = array_merge($meta, [
                'count' => $counts[$key] ?? 0
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function show(string $id)
    {
        $ship = Ship::find($id);
        if (!$ship) {
            return response()->json(['error' => 'Ship not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ship
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:ships,name',
            'class' => 'required|string',
            'tier' => 'nullable|integer|min:1|max:3',
            'category' => 'nullable|string',
            'aliases' => 'nullable|array',
        ]);

        $aliases = $request->input('aliases', []);
        if (is_string($aliases)) {
            $aliases = array_map('trim', explode(',', $aliases));
        }

        $ship = Ship::create([
            'id' => (string) Str::uuid(),
            'name' => $request->input('name'),
            'class' => strtolower(trim($request->input('class'))),
            'tier' => (int) $request->input('tier', 3),
            'category' => $request->input('category', 'Shop'),
            'country' => $request->input('country'),
            'aliases' => $aliases,
            'image_url' => $request->input('image_url'),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ship created successfully',
            'data' => $ship
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $ship = Ship::find($id);
        if (!$ship) {
            return response()->json(['error' => 'Ship not found'], 404);
        }

        $aliases = $request->input('aliases');
        if (is_string($aliases)) {
            $aliases = array_map('trim', explode(',', $aliases));
        }

        $ship->update([
            'name' => $request->input('name', $ship->name),
            'class' => $request->has('class') ? strtolower(trim($request->input('class'))) : $ship->class,
            'tier' => $request->has('tier') ? (int) $request->input('tier') : $ship->tier,
            'category' => $request->input('category', $ship->category),
            'country' => $request->input('country', $ship->country),
            'aliases' => $aliases !== null ? $aliases : $ship->aliases,
            'image_url' => $request->input('image_url', $ship->image_url),
            'description' => $request->input('description', $ship->description),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $ship->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ship updated successfully',
            'data' => $ship
        ]);
    }

    public function destroy(string $id)
    {
        $ship = Ship::find($id);
        if ($ship) {
            $ship->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Ship deleted successfully'
        ]);
    }
}
