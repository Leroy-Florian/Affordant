# Diagrams

Source files for the diagrams rendered as assets under [`docs/public/diagrams`](../public/diagrams).
The generated SVGs are committed, so building the docs needs no extra tooling.

## Regenerating

Renders with [`@mermaid-js/mermaid-cli`](https://github.com/mermaid-js/mermaid-cli) (no global install needed):

```sh
npx -y @mermaid-js/mermaid-cli \
  -i docs/diagrams/packages.mmd \
  -o docs/public/diagrams/packages.svg \
  -b transparent \
  -c docs/diagrams/mermaid.config.json
```

`mermaid.config.json` keeps the palette readable on both the light and dark VitePress
themes: opaque light node boxes with dark text, plus neutral-gray connector lines.
