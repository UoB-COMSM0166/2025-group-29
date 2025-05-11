output="all.txt"

> "$output"

find . \
  \( \
    -path '*/node_modules/*' \
    -o -name "$(basename "$output")" \
    -o -name "GameFile.js" \
  \) -prune \
  -o -type f -print | sort | while IFS= read -r file; do

  if file "$file" | grep -qE 'text|empty'; then
    printf "===== %s =====\n" "$file" >> "$output"
    cat "$file" >> "$output"
    printf "\n\n" >> "$output"
  else
    printf "===== SKIPPED (binary) %s =====\n\n" "$file" >> "$output"
  fi
done

echo "✅ Success $output"