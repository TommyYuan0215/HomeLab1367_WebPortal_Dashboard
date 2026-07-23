<?php
/**
 * HomeLab1367 Dashboard — Upload-Icon API
 * ========================================
 * Accepts a POST file upload and saves it to assets/data/custom-icons/
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

if (!isset($_FILES['icon']) || $_FILES['icon']['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES['icon']['error'] ?? 'no file';
    respond(400, ['error' => 'No file uploaded or upload error occurred. Code: ' . $errCode]);
}

$file = $_FILES['icon'];
$tmpPath = $file['tmp_name'];

// Validate file size (e.g., 2MB max)
if ($file['size'] > 2 * 1024 * 1024) {
    respond(400, ['error' => 'File size exceeds limit of 2MB']);
}

// Validate file type
$allowedTypes = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/jpg' => 'jpg',
    'image/gif' => 'gif',
    'image/svg+xml' => 'svg',
    'image/webp' => 'webp',
    'image/x-icon' => 'ico'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $tmpPath);
finfo_close($finfo);

// Check if SVG or image type is matched
$ext = null;
if (isset($allowedTypes[$mimeType])) {
    $ext = $allowedTypes[$mimeType];
} else {
    // Fallback: check extension if finfo is not matching SVG perfectly
    $pathInfo = pathinfo($file['name']);
    $extension = strtolower($pathInfo['extension'] ?? '');
    if (in_array($extension, ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'])) {
        $ext = $extension;
    }
}

if (!$ext) {
    respond(400, ['error' => 'Unsupported file type: ' . $mimeType]);
}

$destDir = __DIR__ . '/../assets/data/custom-icons';
if (!is_dir($destDir)) {
    if (!mkdir($destDir, 0755, true)) {
        respond(500, ['error' => 'Failed to create target directory assets/data/custom-icons']);
    }
}

// Sanitize filename
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '', $originalName);
if (empty($sanitizedName)) {
    $sanitizedName = 'icon';
}
$finalName = time() . '_' . uniqid() . '_' . $sanitizedName . '.' . $ext;
$destPath = $destDir . '/' . $finalName;

if (move_uploaded_file($tmpPath, $destPath)) {
    respond(200, [
        'status' => 'uploaded',
        'path' => 'assets/data/custom-icons/' . $finalName,
        'message' => 'Icon uploaded successfully'
    ]);
} else {
    respond(500, ['error' => 'Failed to save uploaded file']);
}

function respond(int $code, array $payload): never {
    http_response_code($code);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}
