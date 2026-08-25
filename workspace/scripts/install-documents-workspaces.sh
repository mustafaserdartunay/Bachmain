#!/usr/bin/env bash
# Belgeler/Bachmain içine 3 ayrı workspace kopyalar (mutlak yollar — 8GB RAM).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${BACHMAIN_DOCUMENTS_DIR:-$HOME/Documents/Bachmain}"
mkdir -p "$DEST"

write_ws() {
  local name="$1"
  local folder_path="$2"
  local out="$DEST/$name.code-workspace"
  python3 - "$out" "$name" "$folder_path" "$ROOT" <<'PY'
import json, sys
out, name, folder_path, root = sys.argv[1:5]
templates = {
    "UYGULAMA - BACHMAIN": {
        "files.exclude": {
            "**/node_modules": True, "**/.next": True, "**/dist": True, "**/.vite": True,
            "apps/landing/out": True, "apps/admin/node_modules": True, "apps/landing/node_modules": True,
        },
        "files.watcherExclude": {
            "**/node_modules/**": True, "apps/admin/**": True, "apps/landing/**": True,
            "apps/api/**": True, "apps/android/**": True, "apps/website-os/**": True,
            "**/.git/objects/**": True, "**/dist/**": True, "**/.next/**": True, "**/.vite/**": True,
            "**/docs/**": True, "**/BACHMAIN_DOCUMENT_CENTER/**": True, "**/*.mp4": True,
            "**/*.pack.gz": True, "**/.vercel/**": True,
        },
        "search.exclude": {
            "**/node_modules": True, "apps/admin": True, "apps/landing": True, "**/.next": True,
            "**/dist": True, "**/package-lock.json": True, "**/docs": True,
        },
        "tasks": [
            {"label": "UYGULAMA - BACHMAIN aç", "type": "shell", "command": "npm run uygulama:open",
             "options": {"cwd": root}, "group": {"kind": "build", "isDefault": True}},
            {"label": "UYGULAMA dev", "type": "shell", "command": "npm run dev",
             "options": {"cwd": root}, "group": "build"},
        ],
    },
    "YÖNETİM - BACHMAIN": {
        "files.exclude": {"**/node_modules": True, "**/dist": True, "**/.vite": True},
        "files.watcherExclude": {
            "**/node_modules/**": True, "**/.git/objects/**": True, "**/dist/**": True,
            "**/.vite/**": True, "**/.vercel/**": True, "**/*.pack.gz": True,
        },
        "search.exclude": {"**/node_modules": True, "**/dist": True, "**/package-lock.json": True},
        "tasks": [
            {"label": "YÖNETİM - BACHMAIN aç", "type": "shell", "command": "npm run yonetim:open",
             "options": {"cwd": root}, "group": {"kind": "build", "isDefault": True}},
            {"label": "YÖNETİM dev", "type": "shell", "command": "npm run dev:all",
             "options": {"cwd": f"{root}/apps/admin"}, "group": "build"},
        ],
    },
    "WEB - BACHMAIN": {
        "files.exclude": {"**/node_modules": True, "**/.next": True, "out": True, "**/.vite": True},
        "files.watcherExclude": {
            "**/node_modules/**": True, "**/.next/**": True, "out/**": True, "public/bachy/**": True,
            "**/.git/objects/**": True, "**/dist/**": True, "**/.vite/**": True, "**/.vercel/**": True,
            "**/*.mp4": True, "**/*.pack.gz": True,
        },
        "search.exclude": {
            "**/node_modules": True, "**/.next": True, "out": True, "**/package-lock.json": True,
            "public/bachy": True,
        },
        "tasks": [
            {"label": "WEB - BACHMAIN aç", "type": "shell", "command": "npm run web:open",
             "options": {"cwd": root}, "group": {"kind": "build", "isDefault": True}},
            {"label": "WEB dev", "type": "shell", "command": "npm run dev",
             "options": {"cwd": f"{root}/apps/landing"}, "group": "build"},
        ],
    },
}
base_settings = {
    "git.openRepositoryInParentFolders": "never",
    "git.autofetch": False,
    "git.autorefresh": False,
    "git.autoRepositoryScan": False,
    "git.detectSubmodules": False,
    "search.followSymlinks": False,
    "search.maxResults": 2000,
    "npm.autoDetect": "off",
    "workbench.editor.limit.enabled": True,
    "workbench.editor.limit.value": 4,
    "workbench.localHistory.enabled": False,
    "typescript.tsserver.maxTsServerMemory": 384,
    "typescript.tsserver.experimental.enableProjectDiagnostics": False,
    "typescript.disableAutomaticTypeAcquisition": True,
    "javascript.updateImportsOnFileMove.enabled": "never",
    "editor.largeFileOptimizations": True,
}
tpl = templates[name]
settings = {**base_settings, "files.exclude": tpl["files.exclude"],
            "files.watcherExclude": tpl["files.watcherExclude"], "search.exclude": tpl["search.exclude"]}
doc = {
    "folders": [{"name": name, "path": folder_path}],
    "settings": settings,
    "tasks": {"version": "2.0.0", "tasks": tpl["tasks"]},
    "extensions": {"recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "bradlc.vscode-tailwindcss"]},
}
with open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"→ {out}")
PY
}

write_ws "UYGULAMA - BACHMAIN" "$ROOT"
write_ws "YÖNETİM - BACHMAIN" "$ROOT/apps/admin"
write_ws "WEB - BACHMAIN" "$ROOT/apps/landing"

echo ""
echo "Belgeler workspace dosyaları hazır: $DEST"
echo "Cursor: File → Open Workspace from File… → istediğiniz .code-workspace"
echo "Repo kökü: $ROOT"
