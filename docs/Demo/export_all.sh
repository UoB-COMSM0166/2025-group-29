#!/usr/bin/env bash

# 输出文件
output="all.txt"

# 如果已经存在，就先清空
> "$output"

# 遍历所有文件，排除 all.txt、GameFile.js，以及任意 node_modules 目录
find . \
  \( \
    -path '*/node_modules/*' \
    -o -name "$(basename "$output")" \
    -o -name "GameFile.js" \
  \) -prune \
  -o -type f -print | sort | while IFS= read -r file; do
  # 用 file 判断是不是文本
  if file "$file" | grep -qE 'text|empty'; then
    printf "===== %s =====\n" "$file" >> "$output"
    cat "$file" >> "$output"
    printf "\n\n" >> "$output"
  else
    printf "===== SKIPPED (binary) %s =====\n\n" "$file" >> "$output"
  fi
done

echo "✅ 已将所有文本文件的路径和内容输出到 $output，二进制文件已被跳过。"