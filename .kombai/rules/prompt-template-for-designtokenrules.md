# Prompt Template: Creating Token & Typography Rules in Kombai

Use the following prompt in Kombai to generate a rules file that enforces consistent design and typography token usage.

---

> Create a `.kombai/rules/rules.md` rule file that enforces consistent usage of our design and typography tokens throughout the codebase.
>
> **Token source:** [local repo path / npm package name — e.g., `src/styles/tokens.css` or `@acme/design-tokens`]
>
> **Usage patterns to enforce:**
> - [Describe how tokens should be used — e.g., "Always use `bg-primary` instead of hardcoded hex colors", "Use `text-heading-lg` utility instead of raw font-size classes"]
> - [Any anti-patterns to flag — e.g., "Never use arbitrary Tailwind values like `text-[#333]` when a token exists"]
>
> **Reference files (attach these to the chat):**
> - Token definitions: [attach your token file — e.g., `tokens.css`, `theme.ts`, `variables.scss`]
> - Usage guidelines: [attach any existing docs or skill files (e.g. claude skill files) that explain how tokens should be applied]

---

## Notes

- **Monorepos**: Each project can have its own `.kombai/rules/` directory with separate rules.
- Remove any section above that doesn't apply to your project.
- You can attach multiple reference files for more comprehensive rules.
