# DS Environment Intelligence Design System

## Overview

Professional AI research platform for environmental classification and risk analysis. The design emphasizes technical precision, scientific rigor, and real-time monitoring capabilities, inspired by TensorBoard, Weights & Biases, Palantir Foundry, and NASA Mission Control.

## Design Principles

1. **Technical Precision** — Every element serves a functional purpose. No decoration for decoration's sake.
2. **Scientific Rigor** — Use real data, accurate metrics, and authentic technical terminology.
3. **Clarity First** — Information hierarchy must be immediately apparent.
4. **Premium Execution** — Multi-million dollar software aesthetic through meticulous attention to detail.
5. **Real-time Focus** — Design supports rapid decision-making and continuous monitoring.

## Typography

**Font Family**: Inter (Google Fonts)

### Scale

- **Hero Title**: 48px (3rem) / Bold / Tight leading
- **Section Title**: 30px (1.875rem) / Bold
- **Card Title**: 18px (1.125rem) / Semibold
- **Body**: 14px (0.875rem) / Medium
- **Metrics (Large)**: 40px (2.5rem) / Bold
- **Metrics (Standard)**: 28px (1.75rem) / Semibold
- **Labels**: 12px (0.75rem) / Medium
- **Captions**: 11px (0.6875rem) / Normal

### Hierarchy

Display text uses bold weights (700) to establish strong hierarchy. Body text uses medium (500) for improved legibility on dark backgrounds. Muted text uses normal weight (400) with reduced opacity color.

## Color Palette

### Backgrounds

- **Primary Background**: `#0B0F14` — Main application background
- **Secondary Background**: `#111827` — Section backgrounds, sidebar
- **Card**: `#161D29` — Standard card background
- **Card Highlighted**: `#1D2636` — Emphasized cards, hover states

### Text

- **Primary**: `#FFFFFF` — Headings, labels, primary content
- **Secondary**: `#9CA3AF` — Captions, helper text, metadata

### Accent Colors

- **Primary Blue**: `#3B82F6` — Interactive elements, primary actions
- **Light Blue**: `#60A5FA` — Hover states, secondary emphasis
- **Success Green**: `#22C55E` — Positive states, completion
- **Warning Yellow**: `#FACC15` — Caution, moderate risk
- **Orange**: `#FB923C` — Elevated concern
- **Danger Red**: `#EF4444` — Critical alerts, high risk

### Structural

- **Border**: `rgba(255, 255, 255, 0.06)` — Card borders, dividers
- **Focus Ring**: `#3B82F6` — Focus indicators

## Spacing Scale

Consistent 4px base unit.

- **4px** (0.25rem) — Tight internal spacing
- **8px** (0.5rem) — Compact spacing
- **12px** (0.75rem) — Default gap
- **16px** (1rem) — Standard spacing
- **24px** (1.5rem) — Section spacing
- **32px** (2rem) — Large gaps
- **48px** (3rem) — Hero spacing

## Border Radius

- **Small**: 8px — Badges, small elements
- **Medium**: 12px — Buttons, inputs
- **Large**: 16px — Cards
- **Extra Large**: 20px — Major containers

## Components

### Buttons

**Primary**
- Background: `#3B82F6`
- Text: `#FFFFFF`
- Padding: 10px 16px
- Border radius: 8px
- Font: 14px Medium
- Hover: `#60A5FA`

**Secondary**
- Background: `#161D29`
- Border: 1px solid `rgba(255, 255, 255, 0.06)`
- Text: `#FFFFFF`
- Hover: `#1D2636`

**Danger**
- Background: `#EF4444`
- Text: `#FFFFFF`

### Cards

**Standard Card**
- Background: `#161D29`
- Border: 1px solid `rgba(255, 255, 255, 0.06)`
- Padding: 24px
- Border radius: 16px
- Shadow: None (depth through contrast)

**Highlighted Card**
- Background: `#1D2636`
- Used for emphasis or hover states

### Metric Cards

Display key performance indicators with icon, large number, and label.

- Icon container: 40×40px, rounded 8px, background with 10% opacity accent
- Metric value: 28px Semibold
- Label: 14px text-muted-foreground

### Status Badges

Small indicators for states.

- Height: 20px
- Padding: 0 8px
- Border radius: 6px
- Font: 11px Medium
- Colors based on state (success, warning, danger)

### Progress Bars

**Horizontal Bar**
- Height: 8px
- Background: `#111827`
- Fill: Gradient or solid accent
- Border radius: 4px

**Circular Gauge**
- Stroke width: 12px
- Background stroke: `rgba(255, 255, 255, 0.06)`
- Active stroke: Color based on value
- Smooth transitions (500ms)

### Charts

Use Recharts with consistent theming:

- Grid lines: `rgba(255, 255, 255, 0.05)` with dash pattern
- Axes: `#9CA3AF`, 12px
- Tooltips: Background `#161D29`, border `rgba(255, 255, 255, 0.06)`
- Line width: 2-3px for primary data
- Colors: Use defined accent palette

### Navigation

**Top Navigation**
- Height: 64px
- Background: `#111827` with 50% opacity backdrop blur
- Sticky position
- Border bottom: `rgba(255, 255, 255, 0.06)`

**Nav Buttons**
- Active: `#3B82F6` background, white text, shadow
- Inactive: Muted text, hover to card-highlight background

### Inputs

- Background: `#161D29`
- Border: `rgba(255, 255, 255, 0.06)`
- Padding: 10px 12px
- Border radius: 8px
- Focus: Ring with primary color

### Timeline

Vertical timeline with events:

- Connector: 1px vertical line `rgba(255, 255, 255, 0.06)`
- Event dot: 12px circle, colored by severity
- Time: Monospace 12px
- Title: 14px Semibold
- Description: 14px text-muted-foreground

## Layout Patterns

### Dashboard Grid

Use CSS Grid for responsive layouts:

- 6-column grid for metrics
- 2-column grid for charts
- Full-width heatmaps
- Responsive breakpoint at ~1000px

### Three-Column Real-time

- Column 1 (5/12): Frame capture and metadata
- Column 2 (4/12): CNN predictions
- Column 3 (3/12): Fuzzy risk assessment

### Sidebar + Main

- Sidebar: 3 columns, configuration and controls
- Main: 9 columns, charts and data visualization

## Micro-interactions

### Transitions

- Default: 200ms ease
- Charts: 500ms ease for data changes
- Hover states: 150ms ease

### Hover States

- Cards: Subtle background lightening
- Buttons: Color shift to lighter variant
- Interactive elements: Cursor pointer

### Focus States

- Ring: 2px solid primary color with 50% opacity
- Offset: 2px

## Data Visualization

### Chart Color Mapping

1. Primary: `#3B82F6`
2. Success: `#22C55E`
3. Warning: `#FACC15`
4. Orange: `#FB923C`
5. Danger: `#EF4444`

### Confusion Matrix

- Correct predictions: Success green background
- Incorrect predictions: Card-highlight with opacity based on value
- Text: White for correct, muted for incorrect

### Heatmaps

Use color intensity to show distribution. Higher values get stronger color saturation.

## Accessibility

### Contrast

All text meets WCAG AA standards:
- White on `#0B0F14`: 15.3:1
- `#9CA3AF` on `#0B0F14`: 7.2:1
- Primary blue has sufficient contrast for interactive elements

### Focus Indicators

All interactive elements have visible focus rings using the primary accent color.

### State Communication

Never rely on color alone. Use:
- Icons to reinforce status
- Text labels
- Size/position variations

## Content Guidelines

### Real Data Only

Use authentic values:
- Real metric names (Accuracy, Precision, Recall, F1)
- Realistic numbers (92.4%, not 100%)
- Technical terminology appropriate to AI/ML domain
- Proper timestamps and frame counts

### No Lorem Ipsum

All placeholder text should be contextually appropriate:
- Diagnostic messages describe actual system states
- Event descriptions match the application domain
- Error messages are specific and actionable

## Implementation Notes

### Tailwind Configuration

The theme uses CSS custom properties mapped to Tailwind utilities:
- `bg-background` → `#0B0F14`
- `bg-card` → `#161D29`
- `text-foreground` → `#FFFFFF`
- `text-muted-foreground` → `#9CA3AF`
- `border-border` → `rgba(255, 255, 255, 0.06)`

### Dark Mode Only

This design system is optimized exclusively for dark mode. Light mode is not supported.

### Performance

- Minimize re-renders in real-time components
- Use CSS transitions over JavaScript animations
- Lazy load heavy visualizations when possible
- Chart data should be memoized

## Inspiration Sources

The visual language draws from:
- **TensorBoard**: Technical charts, metric presentation
- **Weights & Biases**: Clean card layouts, real-time updates
- **Palantir Foundry**: Data density, professional aesthetic
- **NASA Mission Control**: Status monitoring, critical information hierarchy
- **Azure ML Studio**: Workflow visualization, experiment tracking
- **Datadog**: Real-time monitoring dashboards

The result is a premium, scientifically rigorous interface that conveys advanced AI capabilities and supports high-stakes decision-making.
