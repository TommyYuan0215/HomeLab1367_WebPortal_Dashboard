<?php
/**
 * HomeLab1367 Dashboard — Save-Services API
 * ==========================================
 * Accepts a POST of the full services.json payload and writes it to disk.
 * Auto-detects Apache / Nginx and includes server-specific fix instructions
 * when permissions are missing.
 *
 * Works with:
 *   Apache — mod_php OR PHP-FPM via mod_proxy_fcgi
 *   Nginx  — PHP-FPM via fastcgi_pass
 *
 * Setup (run once on the server):
 *   Apache:  sudo chown www-data:www-data /path/to/assets/data/services.json
 *   Nginx:   sudo chown www-data:www-data /path/to/assets/data/services.json
 *            (or nginx:nginx if your distro uses that user)
 */

// ── CORS headers (allow local origins) ───────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Server type detection ─────────────────────────────────────
$software   = $_SERVER['SERVER_SOFTWARE'] ?? '';
$serverType = 'unknown';
if (stripos($software, 'apache') !== false) $serverType = 'apache';
elseif (stripos($software, 'nginx')  !== false) $serverType = 'nginx';
elseif (php_sapi_name() === 'fpm-fcgi')         $serverType = 'nginx';   // nginx+fpm without SERVER_SOFTWARE

// Web-server process owner (used in fix instructions)
$webUser = ($serverType === 'nginx') ? 'nginx' : 'www-data';

// ── Path to services.json (relative to this script in /api/) ──
$servicesPath = realpath(__DIR__ . '/../assets/data/services.json');

if ($servicesPath === false || !file_exists($servicesPath)) {
    respond(500, [
        'error'  => 'services.json not found at expected path',
        'looked' => __DIR__ . '/../assets/data/services.json',
    ]);
}

// ── GET  —  probe endpoint, return server info ─────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(200, [
        'status'   => 'ok',
        'server'   => $serverType,
        'software' => $software ?: 'php-fpm',
        'writable' => is_writable($servicesPath),
        'path'     => $servicesPath,
    ]);
}

// ── POST — receive and save JSON ──────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

// Read raw body
$raw = file_get_contents('php://input');
if (empty($raw)) {
    respond(400, ['error' => 'Empty request body']);
}

// Validate JSON
$data = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    respond(400, ['error' => 'Invalid JSON: ' . json_last_error_msg()]);
}

// Validate expected structure
if (!isset($data['sections']) || !is_array($data['sections'])) {
    respond(400, ['error' => 'Invalid structure: "sections" array is required']);
}

// Writability check — return helpful per-server instructions if locked
if (!is_writable($servicesPath)) {
    respond(403, [
        'error'   => 'services.json is not writable by the web server process',
        'server'  => $serverType,
        'fix'     => [
            'command' => "sudo chown {$webUser}:{$webUser} \"{$servicesPath}\"",
            'or'      => "sudo chmod 664 \"{$servicesPath}\"",
            'note'    => ($serverType === 'nginx')
                ? 'Nginx typically runs as www-data or nginx depending on your distro'
                : 'Apache typically runs as www-data',
        ],
    ]);
}

// ── Backup existing file before overwriting ───────────────────
$backupPath = $servicesPath . '.bak';
if (!copy($servicesPath, $backupPath)) {
    // Non-fatal: warn but continue
    $backupNote = 'Backup could not be created (continuing anyway)';
} else {
    $backupNote = basename($backupPath) . ' created';
}

// ── Write pretty-printed JSON ─────────────────────────────────
$encoded = json_encode(
    $data,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

$bytes = file_put_contents($servicesPath, $encoded, LOCK_EX);

if ($bytes === false) {
    respond(500, ['error' => 'Write failed — disk full or permission issue']);
}

respond(200, [
    'status'  => 'saved',
    'server'  => $serverType,
    'bytes'   => $bytes,
    'backup'  => $backupNote,
    'message' => 'services.json updated successfully',
]);

// ── Helper ────────────────────────────────────────────────────
function respond(int $code, array $payload): never {
    http_response_code($code);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}
