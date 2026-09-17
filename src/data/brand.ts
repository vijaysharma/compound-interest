/*
 * Brand colour literals for contexts that cannot read CSS custom properties:
 * Next.js viewport metadata, web app manifests and other build-time or
 * third-party surfaces.
 *
 * These must stay in sync with the light-theme `--color-primary` /
 * `--color-bg` tokens in `src/styles/_theme.scss`, which remain the source of
 * truth for anything rendered inside the app.
 */
export const BRAND_PRIMARY = '#6d0b74';
export const BRAND_BACKGROUND = '#ffffff';
