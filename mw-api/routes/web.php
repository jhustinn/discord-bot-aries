<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

// ─── Local Uploads & Static Image Assets ────────────────────────────────────
Route::get('/uploads/{path}', function ($path) {
    $filePath = realpath(base_path('../uploads/' . $path));
    if ($filePath && File::exists($filePath)) {
        return response()->file($filePath);
    }
    abort(404);
})->where('path', '.*');

Route::get('/storage/v1/object/public/{path}', function ($path) {
    $baseUploads = realpath(base_path('../uploads'));
    $filename = basename($path);

    // 1. Direct path in uploads
    $directPath = realpath($baseUploads . '/' . $path);
    if ($directPath && File::exists($directPath)) {
        return response()->file($directPath);
    }

    // 2. In verification-attachments
    $attachPath = realpath($baseUploads . '/verification-attachments/' . $filename);
    if ($attachPath && File::exists($attachPath)) {
        return response()->file($attachPath);
    }

    // 3. In kqpipzaqpcktuwuxfgno
    $kqPath = realpath($baseUploads . '/kqpipzaqpcktuwuxfgno/' . $path);
    if ($kqPath && File::exists($kqPath)) {
        return response()->file($kqPath);
    }

    abort(404);
})->where('path', '.*');

Route::get('/{any}', function () {
    $indexPath = public_path('index.html');
    if (File::exists($indexPath)) {
        return response(File::get($indexPath))->header('Content-Type', 'text/html');
    }
    return view('welcome');
})->where('any', '.*');
