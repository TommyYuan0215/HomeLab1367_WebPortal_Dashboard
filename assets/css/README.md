# CSS structure

This folder now contains modular, plain CSS files (no build step required):

- `variables.css` — design tokens and CSS variables
- `base.css` — global base styles (html, body, particles)
- `layout.css` — layout-related styles (navbar, banner, rows, footer)
- `components.css` — UI components (cards, news grid, settings modal)
- `utilities.css` — utility classes, responsive rules, accessibility helpers

`styles.css` serves as the primary wrapper that imports these modular files. A backup of the original monolithic stylesheet was saved as `styles.full.css`.

Once you're confident everything looks correct, you can:

- Remove `styles.css` and ensure all pages link to the modular files directly, or
- Keep `styles.css` as a wrapper for backward compatibility.

If you'd like, I can also:

- Remove `styles.css` entirely and update project documentation, or
- Run a quick visual check (locally) — note: I can't render your site here, but I can suggest test steps.
