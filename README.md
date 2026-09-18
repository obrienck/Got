<div align="center">
  <img src="got_logo_transparent.png" alt="Got logo" width="160" />

  # Got

  A fast, visual, modern Git client for the desktop.

  [![Latest Release](https://img.shields.io/github/v/release/obrienck/Got?label=latest%20release)](https://github.com/obrienck/Got/releases/latest)
  [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
</div>

---

Got pairs an ancestry-aware commit graph with fast staging, branch
management, and a real diff viewer — without hiding Git's underlying
power. Built with Electron, React, TypeScript, and Tailwind CSS.

## Features

- **Ancestry-aware commit graph** — branch and merge lines are laid out
  from real parent/child relationships, not guessed from position.
- **Stage, unstage, and commit** — hunk-free but fast: check files in
  or out of the next commit and write a summary + description.
- **Branch & remote management** — local/remote branches, tags, and
  stashes in one place; create and check out branches with a click.
- **Commit details & diff viewer** — full commit metadata plus
  per-file diffs in both **Unified** and **Split** (side-by-side) view.
- **Clone, init, or open** — pick up an existing repo, clone one from
  a URL, or start a brand new one, all from the same screen.
- **Cross-platform** — packaged for macOS, Windows, and Linux.

## Install

Download the latest build for your platform from the
[Releases page](https://github.com/obrienck/Got/releases/latest).

- **macOS** — `.dmg` (Apple Silicon)
- **Windows** — `-setup.exe` (or the portable `.zip`)
- **Linux** — `.AppImage` or `.deb`
- **Arch / Omarchy** — `.pkg.tar.zst`, install with
  `sudo pacman -U got-*.pkg.tar.zst`

> **Heads up:** these builds aren't signed with a paid Apple/Microsoft
> developer certificate yet, so your OS will warn you on first launch:
> - **macOS:** *"Apple could not verify... is free of malware"* — right-click
>   (or Control-click) the app and choose **Open**, or allow it under
>   **System Settings → Privacy & Security**.
> - **Windows:** *"Windows protected your PC"* (SmartScreen) — click
>   **More info → Run anyway**.
>
> This is expected for an unsigned build, not a sign anything is wrong.

## Development

Requires Node 20+.

```bash
# Install dependencies
npm install

# Run in dev mode (hot-reloads main, preload, and renderer)
npm run dev
```

### Building installers locally

```bash
npm run build:mac    # .dmg + .zip
npm run build:win    # NSIS installer + .zip
npm run build:linux  # AppImage + .deb
```

Output lands in `dist/`.

On Arch / Omarchy, build the pacman package instead with `makepkg -f`
(run from the repo root, using the `PKGBUILD` at the top level) — this
produces a `got-*-x86_64.pkg.tar.zst` you can install with
`sudo pacman -U`.

### Type-checking & linting

```bash
npm run typecheck
npm run lint
```

## Releasing

Pushing a version tag builds and publishes installers for all three
platforms via GitHub Actions:

```bash
# Bump "version" in package.json first, then:
git tag vX.Y.Z
git push origin vX.Y.Z
```

The workflow (`.github/workflows/release.yml`) publishes the result as
a **draft** GitHub Release — review it and hit "Publish" when ready.
`package.json`'s version and the pushed tag should always match, since
electron-builder names the published assets after the former.

## Tech stack

Electron · React 18 · TypeScript · Tailwind CSS · TanStack Query ·
[`simple-git`](https://github.com/steveukx/git-js) · electron-builder

## Roadmap

Not yet built:

- A real recursive file-tree browser (the sidebar currently only shows
  changed files)
- Interactive rebase and a visual merge-conflict editor
- Code signing / notarization for the packaged builds

## License

[MIT](LICENSE)
