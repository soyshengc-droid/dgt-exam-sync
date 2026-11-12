#!/bin/sh
# 双击启动"本地版"（题库完全在本机，断网也能刷题）
# 有网时点顶栏 ☁️ Sync 或右下角 ☁️ 同步到云端。
cd "$(dirname "$0")" || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  echo "✗ 找不到 python3，请先安装 Python 3。"
  read -r _
  exit 1
fi

# 8000 端口常被其他服务占用（比如 CaptionPro 的引擎），自动挑一个空闲端口
PORT=""
for p in 8765 8766 8767 8877 8888; do
  if ! lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then PORT=$p; break; fi
done
if [ -z "$PORT" ]; then
  echo "✗ 8765-8888 都被占用了，请先关掉其他本地服务。"
  read -r _
  exit 1
fi

URL="http://127.0.0.1:$PORT"
echo ""
echo "  本地版地址：$URL"
echo "  关掉这个终端窗口 = 停止服务"
echo ""
(sleep 1; open "$URL") &
python3 -m http.server "$PORT" --bind 127.0.0.1

echo ""
echo "服务已停止。按回车关闭窗口。"
read -r _
