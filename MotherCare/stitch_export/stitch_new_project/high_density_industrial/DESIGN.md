---
name: High-Density Industrial
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#504533'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#827560'
  outline-variant: '#d4c4ac'
  surface-tint: '#7a5900'
  primary: '#7a5900'
  on-primary: '#ffffff'
  primary-container: '#f4b400'
  on-primary-container: '#654800'
  inverse-primary: '#fdbc13'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#bfbebe'
  on-tertiary-container: '#4d4d4d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea3'
  primary-fixed-dim: '#fdbc13'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4200'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  table-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for the heavy-duty requirements of construction enterprise resource planning. It communicates reliability, structural integrity, and industrial precision. The brand personality is authoritative and "site-ready," bridging the gap between the field and the executive office.

The visual style is **Corporate / Modern** with a focus on high information density. It prioritizes utility and clarity over decorative elements, utilizing a structured grid and a high-contrast palette to ensure legibility in environments ranging from low-light offices to high-glare construction sites. The interface should feel robust and high-performance, capable of handling complex data without overwhelming the user.

## Colors
The color palette is anchored by "Construction Yellow" (#F4B400), used strategically for primary actions, progress indicators, and safety-critical highlights. Deep Black (#1A1A1A) provides a heavy, grounded foundation for navigation and headers, while Pure White (#FFFFFF) serves as the workspace canvas for data entry.

A sophisticated range of functional grays is employed to manage information density. Use `#F5F5F5` for background surfaces to reduce eye strain, and `#E0E0E0` for borders to define clear structural boundaries between data modules. Status colors are high-chroma to ensure immediate recognition of project health and safety alerts.

## Typography
Inter is the primary typeface, chosen for its exceptional legibility in dense data tables and its neutral, professional character. To support the industrial and technical nature of the ERP, JetBrains Mono is utilized for labels, serial numbers, and technical metadata, providing a "built" aesthetic and clear character distinction.

Hierarchy is established through weight rather than dramatic size shifts. In high-density environments (like data grids), use `table-data` (13px) to maximize visible content without sacrificing readability. Mobile typography scales down to prevent horizontal scrolling on data-heavy pages.

## Layout & Spacing
This design system utilizes a **Fixed-Fluid Hybrid Grid**. Sidebars and navigation panels are fixed-width to ensure tool accessibility, while main content areas are fluid to accommodate expansive data tables. A 4px baseline shift is used to maintain strict alignment in dense forms.

- **Desktop (1440px+):** 12-column grid, 32px margins, 16px gutters.
- **Tablet (768px - 1439px):** 8-column grid, 24px margins, 16px gutters. Sidebars collapse into icons.
- **Mobile (Up to 767px):** 4-column grid, 16px margins. Tables must utilize horizontal swiping or card-view transformations.

Data density is categorized into three tiers:
1. **Standard:** 16px padding (Forms, Settings).
2. **Compact:** 8px padding (Data Tables, Sidebars).
3. **High:** 4px padding (Log views, technical schematics).

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and crisp, low-opacity shadows. Because the system is designed for high density, excessive shadows are avoided to prevent visual clutter.

- **Level 0 (Surface):** The background canvas (#F5F5F5).
- **Level 1 (Card/Section):** White surfaces with a 1px border (#E0E0E0). No shadow. Used for secondary data grouping.
- **Level 2 (Active/Raised):** White surfaces with a subtle ambient shadow (0px 2px 4px rgba(0,0,0,0.05)). Used for primary KPI cards and interactive modules.
- **Level 3 (Overlay):** Modals and dropdowns with a defined shadow (0px 8px 24px rgba(0,0,0,0.12)) to separate them from the complex grid below.

## Shapes
The shape language is **Soft** (0.25rem), reflecting the precision of architectural blueprints. Sharp corners are avoided to maintain a modern feel, but large radii are excluded to preserve the serious, industrial tone of the software. 

- **Small Components (Buttons, Inputs):** 4px (0.25rem).
- **Medium Components (Cards, Modals):** 8px (0.5rem).
- **Large Components (Main Containers):** 12px (0.75rem).
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components
- **Data Tables:** The core of the system. Use a 13px font size with alternating row stripes (Zebra striping) in `#F9F9F9`. Headers must be sticky with a 2px bottom border in Primary Yellow.
- **Buttons:** Primary buttons use Primary Yellow (#F4B400) with Deep Black text. Secondary buttons are Deep Black with White text. Outlined buttons use a 1px `#E0E0E0` border.
- **KPI Cards:** Feature a Primary Yellow accent bar (4px) on the left or top. Include a "trend" indicator (up/down arrow) using status colors.
- **Input Fields:** Use a 1px border. On focus, the border changes to Deep Black with a 2px Primary Yellow bottom highlight. Labels are always visible (not floating) using the `label-md` style.
- **Status Badges:** Use a subtle background tint of the status color (e.g., 10% opacity) with a 100% opacity text color for high contrast and accessibility.
- **Gantt Charts / Timelines:** Use Primary Yellow for active phases and Deep Black for milestones. Use Grays for completed or inactive states.