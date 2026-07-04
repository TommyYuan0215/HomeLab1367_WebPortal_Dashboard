<?php
/**
 * HomeLab1367 Dashboard — Setup & Initialization API
 * ===================================================
 * Manages the initial password setup and config generation.
 * If data files do not exist, it will copy the example templates
 * and set the admin password chosen by the user.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = realpath(__DIR__ . '/../assets/data');
if ($dataDir === false) {
    // If realpath fails because directory is not resolved, get raw path
    $dataDir = __DIR__ . '/../assets/data';
}

$configPath = $dataDir . '/config.json';
$servicesPath = $dataDir . '/services.json';
$configExamplePath = $dataDir . '/config.example.json';
$servicesExamplePath = $dataDir . '/services.example.json';

// Detect web-server process owner for instructions
$software = $_SERVER['SERVER_SOFTWARE'] ?? '';
$serverType = 'unknown';
if (stripos($software, 'apache') !== false) $serverType = 'apache';
elseif (stripos($software, 'nginx') !== false) $serverType = 'nginx';
elseif (php_sapi_name() === 'fpm-fcgi') $serverType = 'nginx';

$webUser = ($serverType === 'nginx') ? 'nginx' : 'www-data';
$isInitialized = file_exists($configPath) && file_exists($servicesPath);

// ── GET  — Check initialization status ───────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(200, [
        'initialized' => $isInitialized,
        'writable'    => is_writable($dataDir),
        'server'      => $serverType
    ]);
}

// ── POST — Initialize configurations ──────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

// If already initialized, block re-initialization for security
if ($isInitialized) {
    respond(400, ['error' => 'Dashboard is already initialized. To reset, please delete config.json and services.json manually.']);
}

// Check if assets/data directory is writable
if (!is_writable($dataDir)) {
    respond(403, [
        'error'  => 'The data directory is not writable by the web server process.',
        'server' => $serverType,
        'fix'    => [
            'command' => "sudo chown -R {$webUser}:{$webUser} \"" . realpath($dataDir) . "\"",
            'or'      => "sudo chmod 775 \"" . realpath($dataDir) . "\"",
            'note'    => 'The web server needs write access to create config.json and services.json.'
        ]
    ]);
}

// Read raw body
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
$password = $data['password'] ?? '';

if (empty($password) || strlen($password) < 4) {
    respond(400, ['error' => 'Password must be at least 4 characters long.']);
}

// 1. Create config.json from example or scratch
$configJson = [];
if (file_exists($configExamplePath)) {
    $exampleContent = file_get_contents($configExamplePath);
    $configJson = json_decode($exampleContent, true) ?: [];
}

// Make sure structure exists
if (!isset($configJson['config'])) {
    $configJson['config'] = [];
}
$configJson['config']['adminPassword'] = $password;

$configOutput = json_encode($configJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if (file_put_contents($configPath, $configOutput, LOCK_EX) === false) {
    respond(500, ['error' => 'Failed to write config.json.']);
}

// 2. Create services.json from example or scratch
if (file_exists($servicesExamplePath)) {
    if (!copy($servicesExamplePath, $servicesPath)) {
        respond(500, ['error' => 'Failed to copy services.example.json to services.json.']);
    }
} else {
    // Write a default blank services structure
    $defaultServices = [
        'sections' => [
            [
                'id' => 'first-section',
                'title' => 'My Services',
                'icon' => 'bi-house-heart-fill',
                'type' => 'favorite',
                'items' => []
            ]
        ]
    ];
    $servicesOutput = json_encode($defaultServices, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if (file_put_contents($servicesPath, $servicesOutput, LOCK_EX) === false) {
        respond(500, ['error' => 'Failed to write services.json.']);
    }
}

respond(200, [
    'status'  => 'success',
    'message' => 'Dashboard initialized successfully!'
]);

function respond(int $code, array $payload): never {
    http_response_code($code);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}
