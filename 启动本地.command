#!/bin/sh
# 双击启动"本地版"（题库完全在本机，断网也能刷题）
# 同步按钮仍然可用：有网时点顶栏 ☁️ Sync 或右下角 ☁️ 即可。
cd "$(dirname "$0")" || exit 1
PORT=8765
echo ""
echo "  本地版地址：http://localhost:$PORT"
echo "  关掉这个终端窗口 = 停止服务"
echo ""
(sleep 1; open "http://localhost:$PORT") &
exec python3 -m http.server "$PORT"
