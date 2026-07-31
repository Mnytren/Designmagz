# Minimal static file server for the project root at http://localhost:3000
# Usage: powershell -File serve.ps1
$root = $PSScriptRoot
$port = 3000

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css'
  '.js'   = 'text/javascript'
  '.mjs'  = 'text/javascript'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.json' = 'application/json'
  '.woff2'= 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Output "Serving $root at http://localhost:$port"

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  try {
    $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
    if ($path.EndsWith('/')) { $path = $path + 'index.html' }
    $filePath = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
    $fullPath = [System.IO.Path]::GetFullPath($filePath)
    if (-not $fullPath.StartsWith($root) -or -not (Test-Path $fullPath -PathType Leaf)) {
      $response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
    } else {
      $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
      $type = $mime[$ext]
      if ($null -eq $type) { $type = 'application/octet-stream' }
      $response.ContentType = $type
      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    }
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    try { $response.StatusCode = 500 } catch {}
  } finally {
    try { $response.OutputStream.Close() } catch {}
  }
}
