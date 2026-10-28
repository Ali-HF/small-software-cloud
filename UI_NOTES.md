# UI Architecture & Component Kit Notes

## Design System Tokens
- **Design Philosophy:** Calm, precise, trusted security engineering tool aesthetics. WCAG AA contrast compliant.
- **Theme Support:** Light theme by default, with dark theme using the exact same tokens. Respects `prefers-color-scheme` with manual toggle stored in `localStorage`.
- **Accent Color:** Focused single accent `#2563eb` (light) / `#3b82f6` (dark).
- **Semantic Status Tokens:**
  - Active: `#15803d` / `#4ade80`
  - Restricted (PIN/Password): `#b45309` / `#fbbf24`
  - Expired: `#475569` / `#94a3b8`
  - Revoked: `#b91c1c` / `#f87171`
- **Typography Scale:** 12px (`text-xs`), 14px (`text-sm`), 16px (`text-base`), 20px (`text-xl`), 28px (`text-2xl`), 40px (`text-4xl`). Monospace font applied strictly to tokens, URLs, commands, and secrets.
- **Spacing Grid:** 8px rhythm with 6px, 8px, and 12px border radii.

---

## Component Kit (`src/components/ui/`)
All components include visible focus rings (`.focus-ring`), keyboard accessibility, disabled states, and `data-testid` support.

| Component | File | States & Features |
|---|---|---|
| `Button` | `Button.tsx` | Primary, secondary, ghost, danger; sm/md/lg; loading spinner; disabled |
| `Input` | `Input.tsx` | Labels, hints, validation errors, left icon, right element, monospace mode |
| `Select` | `Select.tsx` | Native dropdown with chevron icon, error and hint states |
| `Switch` | `Switch.tsx` | Accessible toggle switch with Space/Enter keyboard support |
| `SegmentedControl` | `SegmentedControl.tsx` | Radio-group segmented button selector with icons |
| `Badge` | `Badge.tsx` | Status pills (`active`, `restricted`, `expired`, `revoked`, `default`, `accent`) with optional status dot |
| `Card` | `Card.tsx` | Modular `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Table` | `Table.tsx` | Accessible semantic table with `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` |
| `Drawer` | `Drawer.tsx` | Slide-over drawer with Escape key dismiss, backdrop blur, header, body, and footer |
| `Modal` | `Modal.tsx` | Centered dialog with Escape key dismiss, backdrop blur, and focus management |
| `Toast` | `Toast.tsx` | `ToastProvider` & `useToast()` hook supporting `success`, `error`, `warning`, `info` |
| `Tabs` | `Tabs.tsx` | Accessible `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent` |
| `CopyField` | `CopyField.tsx` | Monospace field with 1-click copy button, "Copied" feedback state, secret mask toggle |
| `EmptyState` | `EmptyState.tsx` | Clean dashed container with Lucide icon, headline, description, action button |
| `Skeleton` | `Skeleton.tsx` | Shimmer pulse placeholder for loading text, cards, and tables (`TableSkeleton`) |
| `InlineAlert` | `InlineAlert.tsx` | Semantic alerts (`info`, `warning`, `error`, `success`) with matching icons |
| `CodeBlock` | `CodeBlock.tsx` | Code container with language label and 1-click copy button |
| `Stepper` | `Stepper.tsx` | Multi-step progress bar with completed, current, and upcoming indicators |

---

## Review Route
- **Interactive Component Kit Showcase:** [http://localhost:3001/dev/components](http://localhost:3001/dev/components)
