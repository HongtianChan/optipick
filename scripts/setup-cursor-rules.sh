#!/bin/bash

# 自动为新项目设置 .cursorrules
# 使用方法：在新项目目录运行：bash ~/Desktop/Note-2602/setup-cursor-rules.sh

GLOBAL_RULES="$HOME/.cursorrules"
CURRENT_DIR=$(pwd)

if [ -f "$GLOBAL_RULES" ]; then
    cp "$GLOBAL_RULES" "$CURRENT_DIR/.cursorrules"
    echo "已复制全局规则到当前项目"
else
    echo "全局规则文件不存在：$GLOBAL_RULES"
fi

