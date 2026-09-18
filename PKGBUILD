# Maintainer: obrienck
# Local/dev package — builds Got directly from this source checkout.
# Usage: makepkg -si   (run from the repo root)
pkgname=got
pkgver=1.0.3
pkgrel=1
pkgdesc="A fast, visual, modern Git client for the desktop"
arch=('x86_64')
url="https://github.com/obrienck/Got"
license=('MIT')
depends=('gtk3' 'nss' 'alsa-lib' 'libxss' 'libnotify' 'at-spi2-core' 'libdrm' 'mesa' 'libxkbcommon')
makedepends=('nodejs' 'npm')
options=('!strip' '!emptydirs')
source=()
sha256sums=()

# Build out-of-tree: electron-builder walks the whole project directory
# when packaging, so it must not see makepkg's own src/pkg scratch dirs.
_repo="$startdir"
_build="/tmp/makepkg-got-build"

pkgver() {
  cd "$_repo"
  grep -m1 '"version"' package.json | sed -E 's/.*"version": *"([^"]+)".*/\1/'
}

prepare() {
  rm -rf "$_build"
  mkdir -p "$_build"
  tar --exclude='./node_modules' --exclude='./dist' --exclude='./out' --exclude='./.git' \
    -cf - -C "$_repo" . | tar -xf - -C "$_build"
}

build() {
  cd "$_build"
  npm ci
  npm run build:unpack
}

package() {
  cd "$_build"

  install -dm755 "$pkgdir/opt/got"
  cp -a dist/linux-unpacked/. "$pkgdir/opt/got/"

  # Electron's setuid sandbox helper must be root-owned and setuid to work.
  chmod 4755 "$pkgdir/opt/got/chrome-sandbox"
  chown root:root "$pkgdir/opt/got/chrome-sandbox"

  install -dm755 "$pkgdir/usr/bin"
  ln -s /opt/got/got "$pkgdir/usr/bin/got"

  install -Dm644 build/icon.png "$pkgdir/usr/share/icons/hicolor/1024x1024/apps/got.png"
  install -Dm644 "$_repo/got.desktop" "$pkgdir/usr/share/applications/got.desktop"
}
