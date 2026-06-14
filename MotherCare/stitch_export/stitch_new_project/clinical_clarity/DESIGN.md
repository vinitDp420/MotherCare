---
name: Clinical Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4946'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c5'
  surface-tint: '#006b5f'
  primary: '#00685d'
  on-primary: '#ffffff'
  primary-container: '#008376'
  on-primary-container: '#f4fffb'
  inverse-primary: '#70d8c8'
  secondary: '#526069'
  on-secondary: '#ffffff'
  secondary-container: '#d3e2ed'
  on-secondary-container: '#56656e'
  tertiary: '#7d4e60'
  on-tertiary: '#ffffff'
  tertiary-container: '#996679'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8df5e4'
  primary-fixed-dim: '#70d8c8'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005048'
  secondary-fixed: '#d6e5ef'
  secondary-fixed-dim: '#bac9d3'
  on-secondary-fixed: '#0f1d25'
  on-secondary-fixed-variant: '#3b4951'
  tertiary-fixed: '#ffd9e4'
  tertiary-fixed-dim: '#f2b6cb'
  on-tertiary-fixed: '#330f1f'
  on-tertiary-fixed-variant: '#65394b'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for "MotherCare" at Shakuntala Hospital, focusing on the intersection of maternal healthcare and advanced SaaS functionality. The brand personality is empathetic yet authoritative, professional, and clinical without being cold.

The design style follows **Modern Minimalism** with a focus on high-readability and information density management. It utilizes generous whitespace to reduce cognitive load for healthcare providers. The interface relies on clear visual hierarchies, subtle depth, and a structured layout to ensure critical patient data is immediately accessible. The emotional response should be one of calm reliability and absolute precision.

## Colors
The palette is rooted in clinical trust and maternal warmth. 

- **Primary (Teal):** Used for primary actions, success states, and brand identification. It provides a high-contrast, professional anchor.
- **Secondary (Soft Blue):** Used for large surface areas, background tints, and subtle highlights to create a soothing environment.
- **Tertiary (Light Pink):** Reserved for specific maternal health accents, notifications, or soft categorical tagging.
- **Neutrals:** A range of slate greys ensures high legibility for body text and UI borders.

**Color Mode Support:** 
The design system implements a semantic token system for Light and Dark modes. In Dark mode, surfaces shift to deep navy/slate tones (`#0F172A`) rather than pure black to maintain softness, while primary Teal is adjusted for AA/AAA accessibility against dark backgrounds.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy SaaS environments. The type scale is optimized for clinical dashboards where quick scanning of metrics is vital.

- **Headlines:** Bold and tight-tracking to anchor sections.
- **Body:** Standardized at 16px for optimal readability across all patient records.
- **Labels:** Used for table headers and metadata. `label-lg` uses a slight uppercase treatment with letter-spacing to differentiate from interactive body text.
- **Mobile scaling:** Display and Headline sizes scale down by approximately 25% on mobile to maintain layout integrity.

## Layout & Spacing
The layout uses a **Fluid Grid** model with fixed maximum widths for dashboard containers. 

- **Desktop:** 12-column grid, 24px gutters, 40px side margins. Sidebar is fixed at 280px.
- **Tablet:** 8-column grid, 16px gutters, 24px side margins.
- **Mobile:** 4-column grid, 12px gutters, 16px side margins.

Spacing follows an 8px linear scale. For clinical data density, 12px (`sm`) is preferred for internal card padding, while 24px (`lg`) is used for section separation to provide visual breathing room.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. This design system avoids heavy borders in favor of soft shadows to maintain a "clean" healthcare aesthetic.

- **Level 0 (Background):** Neutral light grey/blue (`#F8FAFC`).
- **Level 1 (Cards/Surfaces):** White background with a "Soft Ambient" shadow (0px 4px 20px rgba(0,0,0,0.05)).
- **Level 2 (Modals/Popovers):** Higher elevation with a more pronounced shadow (0px 12px 32px rgba(0,0,0,0.1)).

In Dark mode, elevation is expressed through surface color lightening (lighter shades of navy) rather than shadows to prevent "muddy" UI.

## Shapes
The shape language is "Rounded" to evoke friendliness and safety, essential in a maternal care context.

- **Standard Elements:** 8px (`0.5rem`) for buttons, input fields, and small components.
- **Containers/Cards:** 16px (`1rem`) for patient cards and dashboard widgets.
- **Large Surfaces:** 24px (`1.5rem`) for main content areas or modal containers.
- **Interactive States:** Subtle 2px focus rings in Primary Teal for keyboard accessibility.

## Components
- **Buttons:** Primary buttons are solid Teal with white text. Secondary buttons use the Soft Blue background with Teal text. All buttons feature 8px rounded corners.
- **Cards:** The core of the dashboard. White (or Slate in dark mode) with 16px corner radius and a 1px soft border (#E2E8F0). Card headers should have a 12px bottom margin.
- **Input Fields:** 8px radius, 1px neutral border. On focus, the border transitions to Primary Teal with a 3px soft glow.
- **Chips/Badges:** Used for patient status (e.g., "Active", "High Risk"). High Risk uses the Light Pink background with a darkened text variant for contrast.
- **Lists:** Data tables use a "Zebra" striping approach with Soft Blue (`#E3F2FD`) at 20% opacity for alternate rows to aid horizontal eye tracking.
- **Healthcare Specifics:** 
    - **Metric Widgets:** Large `headline-lg` numbers for vital signs.
    - **Progress Bars:** Thin, 4px rounded bars for tracking pregnancy milestones or health goals.