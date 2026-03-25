# =============================================
# Push files directly to GitHub via REST API
# Repository: firka-kh/eip-test
# =============================================

param(
    [string]$Token = $env:GITHUB_TOKEN,
    [string]$CommitMessage = "Update files via API"
)

# --- НАСТРОЙКИ ---
$OWNER = "firka-kh"
$REPO  = "eip-test"
$BRANCH = "main"

# Файлы для загрузки (локальный путь → путь в репозитории)
$FILES = @{
    "src/js/ui/render.js"   = "src/js/ui/render.js"
    "src/styles/main.css"   = "src/styles/main.css"
    "public/contract.md"    = "public/contract.md"
}

if (-not $Token) {
    $Token = Read-Host "Введите ваш GitHub Personal Access Token"
}

$HEADERS = @{
    "Authorization" = "Bearer $Token"
    "Accept"        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$BASE_DIR = $PSScriptRoot
$successCount = 0
$errorCount = 0

foreach ($entry in $FILES.GetEnumerator()) {
    $localRelPath = $entry.Key
    $repoPath     = $entry.Value
    $localFile    = Join-Path $BASE_DIR $localRelPath

    if (-not (Test-Path $localFile)) {
        Write-Warning "Файл не найден: $localFile — пропускаю"
        $errorCount++
        continue
    }

    # Получаем текущий SHA файла из GitHub (нужен для обновления)
    $apiUrl = "https://api.github.com/repos/$OWNER/$REPO/contents/$repoPath`?ref=$BRANCH"
    try {
        $existing = Invoke-RestMethod -Uri $apiUrl -Headers $HEADERS -Method Get -ErrorAction Stop
        $sha = $existing.sha
    } catch {
        $sha = $null  # Файл новый — создаём без SHA
    }

    # Читаем файл и кодируем в Base64
    $bytes   = [System.IO.File]::ReadAllBytes($localFile)
    $content = [Convert]::ToBase64String($bytes)

    # Формируем тело запроса
    $body = @{
        message = $CommitMessage
        content = $content
        branch  = $BRANCH
    }
    if ($sha) { $body.sha = $sha }

    $putUrl = "https://api.github.com/repos/$OWNER/$REPO/contents/$repoPath"

    try {
        Invoke-RestMethod -Uri $putUrl -Headers $HEADERS -Method Put `
            -Body ($body | ConvertTo-Json -Depth 5) `
            -ContentType "application/json" | Out-Null

        Write-Host "✅ $repoPath — загружен" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "❌ $repoPath — ошибка: $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "=== Готово: $successCount успешно, $errorCount ошибок ===" -ForegroundColor Cyan
