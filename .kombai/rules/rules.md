# Kombai Rules – Habit & Time Tracker

## Design Token Usage

- **Always** use semantic color tokens from `globals.css` (e.g., `bg-primary`, `text-muted-foreground`, `border-border`) instead of hardcoded color values like `bg-green-500` or `text-gray-600`.
- **Always** use the `--radius-*` tokens (`rounded-sm`, `rounded-md`, `rounded-lg`, etc.) instead of arbitrary border-radius values.
- Available semantic colors: `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `danger`, `warning`, `info`, `card`, `popover`, `sidebar-*`, `chart-1` through `chart-5`, `timer-bg`, `timer-border`.
- When a new color is needed, add it as a CSS variable in `globals.css` (both light and dark mode) and register it in `@theme inline`, rather than using arbitrary values.

## Component Guidelines

- Use shadcn components from `src/components/ui/` before creating custom elements. Check existing components before installing new ones.
- Use Lucide React for all icons. Import from `lucide-react`.
- All pages under `src/app/(dashboard)/` share a dashboard layout — keep new dashboard pages consistent with this pattern.

## Code Organization

- Reusable feature components go in `src/components/<feature>/` (e.g., `time-tracking/`).
- Shared utility functions go in `src/lib/`.
- TypeScript types go in `src/types/`.
- Use the `cn()` helper from `src/lib/utils` for conditional class merging.

## Styling

- Use Tailwind v4 utility classes. Do not write inline styles or raw CSS outside of `globals.css`.
- All custom CSS must be wrapped in `@layer base` or `@layer components` in `globals.css`.
- Support dark mode using the `dark:` variant — never hardcode light-only colors.
