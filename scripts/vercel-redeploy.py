#!/usr/bin/env python3
"""Redeploy BachMain Vercel projects from their linked GitHub ref.

Token resolution (never print):
1) VERCEL_TOKEN env
2) .env.vercel in repo root (VERCEL_TOKEN=...)
3) ~/Library/Application Support/com.vercel.cli/auth.json

Usage:
  python3 scripts/vercel-redeploy.py --team team_xxx --ref main crm:prj_... admin:prj_...
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


def load_token(repo_root: Path) -> str:
    tok = os.environ.get("VERCEL_TOKEN") or os.environ.get("VERCEL_ACCESS_TOKEN")
    if tok:
        return tok.strip()
    envf = repo_root / ".env.vercel"
    if envf.exists():
        for line in envf.read_text(errors="ignore").splitlines():
            if line.startswith("VERCEL_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    auth = Path.home() / "Library/Application Support/com.vercel.cli/auth.json"
    if auth.exists():
        data = json.loads(auth.read_text())
        t = data.get("token")
        if isinstance(t, str) and t.strip():
            return t.strip()
    raise SystemExit(
        "No Vercel token. Create one at https://vercel.com/account/tokens "
        "and save as .env.vercel (VERCEL_TOKEN=...) or run vercel login."
    )


def api(token: str, method: str, url: str, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--team", required=True)
    parser.add_argument("--ref", default="main")
    parser.add_argument("projects", nargs="+", help="name:projectId")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    token = load_token(root)
    team = args.team
    results = []

    for item in args.projects:
        if ":" not in item:
            print(f"!! bad project arg: {item}")
            continue
        name, pid = item.split(":", 1)
        st, p = api(token, "GET", f"https://api.vercel.com/v9/projects/{pid}?teamId={team}")
        if st != 200 or not isinstance(p, dict):
            print(f"!! {name} project fetch failed: {st}")
            continue
        # Ensure broken ignore-build commands are cleared
        if p.get("commandForIgnoringBuildStep"):
            api(
                token,
                "PATCH",
                f"https://api.vercel.com/v9/projects/{pid}?teamId={team}",
                {"commandForIgnoringBuildStep": None},
            )
        link = p.get("link") or {}
        if link.get("type") != "github" or not link.get("repoId"):
            print(f"!! {name} is not GitHub-linked; skip")
            continue
        body = {
            "name": p["name"],
            "project": p["name"],
            "target": "production",
            "gitSource": {
                "type": "github",
                "repoId": link["repoId"],
                "ref": args.ref or link.get("productionBranch") or "main",
            },
        }
        st2, dep = api(
            token,
            "POST",
            f"https://api.vercel.com/v13/deployments?teamId={team}&forceNew=1",
            body,
        )
        if st2 not in (200, 201) or not isinstance(dep, dict):
            print(f"!! {name} deploy failed: {st2} {str(dep)[:200]}")
            continue
        print(f"==> {name} started {dep.get('id')} → {dep.get('url')}")
        results.append((name, dep["id"]))

    for name, did in results:
        for i in range(90):
            st, d = api(token, "GET", f"https://api.vercel.com/v13/deployments/{did}?teamId={team}")
            state = d.get("readyState") if isinstance(d, dict) else "fail"
            if state in ("READY", "ERROR", "CANCELED"):
                print(f"==> {name} {state} https://{d.get('url')}")
                if state == "ERROR":
                    print(f"   {d.get('errorCode')}: {d.get('errorMessage')}")
                break
            time.sleep(5)
        else:
            print(f"!! {name} still building (timeout)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
