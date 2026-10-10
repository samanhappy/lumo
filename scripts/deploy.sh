#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'HELP'
用法: bash scripts/deploy.sh [user@]host
默认主机 root@43.130.3.115；可用参数或 DEPLOY_HOST 覆盖。
可选环境变量:
  DEPLOY_DIR          服务器项目目录，默认 /opt/lumo
  DEPLOY_IMAGE        镜像标签，默认 docker.io/samanhappy/lumo:latest
  DEPLOY_PLATFORM     默认 linux/amd64
  DEPLOY_SSH_PORT     SSH 端口，默认 22
  DEPLOY_SSH_KEY      SSH 私钥文件（指定后默认不读取密码文件）
  DEPLOY_SSH_PASSWORD_FILE  默认主机使用 ~/sshpass/openclaw；设为空禁用
  DEPLOY_OUTPUT_DIR   本地压缩包目录，默认系统临时目录
  DEPLOY_SUDO         auto（默认，非 root 使用 sudo -n）、yes 或 no
前提: 服务器已有 compose.yaml、.env、Docker Compose（支持 --wait）及数据库镜像。
compose.yaml 须通过 APP_IMAGE 指定应用镜像。部署成功后自动删除本地压缩包；失败时保留压缩包方便重试。不上传本地 .env。SSH 使用正常的主机密钥验证。
HELP
}
if [[ "${1:-}" == --help || "${1:-}" == -h ]]; then usage; exit 0; fi
[[ $# -le 1 ]] || { usage >&2; exit 2; }
target=${1:-${DEPLOY_HOST:-root@43.130.3.115}}
[[ "$target" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.@-]*$ ]] || { echo '请指定有效的 SSH 主机或别名' >&2; exit 2; }
remote_dir=${DEPLOY_DIR:-/opt/lumo}
image=${DEPLOY_IMAGE:-docker.io/samanhappy/lumo:latest}
port=${DEPLOY_SSH_PORT:-22}
sudo_mode=${DEPLOY_SUDO:-auto}
[[ "$port" =~ ^[0-9]+$ && "$sudo_mode" =~ ^(auto|yes|no)$ ]] || { echo 'SSH 端口或 DEPLOY_SUDO 无效' >&2; exit 2; }
for command in docker gzip ssh scp shasum; do command -v "$command" >/dev/null || { echo "缺少命令: $command" >&2; exit 1; }; done
auth=(env)
default_password_file=''
if [[ "$target" == root@43.130.3.115 && -z "${DEPLOY_SSH_KEY:-}" ]]; then
  default_password_file="$HOME/sshpass/openclaw"
fi
password_file=${DEPLOY_SSH_PASSWORD_FILE-$default_password_file}
if [[ -n "$password_file" ]]; then
  command -v sshpass >/dev/null || { echo '缺少命令: sshpass' >&2; exit 1; }
  [[ -f "$password_file" && -r "$password_file" && -s "$password_file" ]] || { echo 'SSH 密码文件不存在、不可读或为空' >&2; exit 1; }
  auth=(sshpass -f "$password_file")
fi
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
output_dir=${DEPLOY_OUTPUT_DIR:-${TMPDIR:-/tmp}}
mkdir -p "$output_dir"
archive=$(mktemp "$output_dir/lumo-$(date +%Y%m%d-%H%M%S).XXXXXX")
mv "$archive" "$archive.tar.gz"
archive="$archive.tar.gz"
ssh_args=(-p "$port")
scp_args=(-P "$port")
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then ssh_args+=(-i "$DEPLOY_SSH_KEY"); scp_args+=(-i "$DEPLOY_SSH_KEY"); fi
# POSIX shell quoting for arguments interpreted by the SSH remote shell.
quote() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }
remote_tmp=''
cleanup() {
  if [[ -n "$remote_tmp" ]]; then
    "${auth[@]}" ssh "${ssh_args[@]}" "$target" "rm -rf -- $(quote "$remote_tmp")" </dev/null || true
  fi
}
trap cleanup EXIT
printf '构建镜像 %s\n' "$image"
docker buildx build --platform "${DEPLOY_PLATFORM:-linux/amd64}" -t "$image" --load --progress plain "$root"
printf '导出镜像: %s\n' "$archive"
docker image save "$image" | gzip > "$archive"
gzip -t "$archive"
checksum=$(shasum -a 256 "$archive" | awk '{print $1}')
remote_tmp=$("${auth[@]}" ssh "${ssh_args[@]}" "$target" 'mktemp -d /tmp/lumo-deploy.XXXXXXXX')
[[ "$remote_tmp" =~ ^/tmp/lumo-deploy\.[a-zA-Z0-9]+$ ]] || { remote_tmp=''; echo '远端临时目录无效' >&2; exit 1; }
printf '上传到 %s\n' "$target"
"${auth[@]}" scp "${scp_args[@]}" "$archive" "$target:$remote_tmp/image.tar.gz"
"${auth[@]}" ssh "${ssh_args[@]}" "$target" "bash -s -- $(quote "$remote_dir") $(quote "$remote_tmp/image.tar.gz") $(quote "$image") $(quote "$checksum") $(quote "$sudo_mode")" <<'REMOTE'
set -euo pipefail
cd "$1"
[[ -f compose.yaml && -f .env ]] || { echo '部署目录缺少 compose.yaml 或 .env' >&2; exit 1; }
printf '%s  %s\n' "$4" "$2" | sha256sum -c -
gzip -t "$2"
privilege=()
if [[ "$5" == yes || ( "$5" == auto && $(id -u) != 0 ) ]]; then privilege=(sudo -n); fi
"${privilege[@]}" docker compose version >/dev/null
"${privilege[@]}" env APP_IMAGE="$3" docker compose config --quiet
"${privilege[@]}" docker load -i "$2"
"${privilege[@]}" env APP_IMAGE="$3" docker compose up -d --no-build --pull never --force-recreate --wait --wait-timeout 180 app
"${privilege[@]}" env APP_IMAGE="$3" docker compose ps
REMOTE
rm -f -- "$archive"
printf '部署成功，已删除本地压缩包。\n'
