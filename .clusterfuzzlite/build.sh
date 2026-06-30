#!/bin/bash -eu

cd "$SRC/envguardr"

npm ci
npm run build

cp -r "$SRC/envguardr" "$OUT/envguardr"

mkdir -p "$OUT/node/bin"
cp "$(command -v node)" "$OUT/node/bin/node"

"$OUT/node/bin/node" --version | grep -E '^v26\.' >/dev/null

create_jazzer_wrapper() {
  local fuzz_target="$1"
  local fuzzer_name

  fuzzer_name="$(basename "$fuzz_target" .js | tr '.' '-')"

  cat > "$OUT/$fuzzer_name" <<'EOF'
#!/bin/bash
# LLVMFuzzerTestOneInput

project_dir="$(dirname "$0")/envguardr"
node_bin="$(dirname "$0")/node/bin/node"

exec "$node_bin" "$project_dir/node_modules/@jazzer.js/core/dist/cli.js" "$project_dir/__FUZZ_TARGET__" --sync ${JAZZERJS_EXTRA_ARGS:-} -- "$@"
EOF

  sed -i "s#__FUZZ_TARGET__#$fuzz_target#g" "$OUT/$fuzzer_name"
  chmod +x "$OUT/$fuzzer_name"
}

create_jazzer_wrapper "fuzz/validate-env.fuzz.js"
create_jazzer_wrapper "fuzz/validate-env-custom-validators.fuzz.js"
create_jazzer_wrapper "fuzz/validate-env-schema.fuzz.js"
create_jazzer_wrapper "fuzz/validate-env-edge-cases.fuzz.js"
