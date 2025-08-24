# Cupcake Core Styles

A comprehensive, reusable styling system for cupcake applications built on modern CSS custom properties and SCSS.

## Features

- 🎨 **Design System**: Comprehensive set of design tokens and CSS custom properties
- 🌙 **Dark Mode**: Built-in dark theme support with automatic switching
- 🧩 **Component Library**: Pre-built component styles for common UI patterns
- 🔧 **Bootstrap Integration**: Seamless integration with Bootstrap components
- 📱 **Responsive**: Mobile-first responsive design utilities
- ♿ **Accessible**: WCAG-compliant focus states and screen reader support
- 🎯 **Customizable**: Easy theming through CSS custom properties

## Installation

The styles are automatically included when you install `cupcake-core`:

```bash
npm install cupcake-core
```

## Quick Start

### Option 1: Full Import (Recommended)

```scss
// In your styles.scss
@import 'cupcake-core/lib/styles';
```

### Option 2: With Bootstrap

```scss
// Import Bootstrap first
@import 'bootstrap/scss/bootstrap';
@import 'bootstrap-icons/font/bootstrap-icons.css';

// Then import cupcake styles
@import 'cupcake-core/lib/styles/cupcake-core';
@import 'cupcake-core/lib/styles/bootstrap-integration';
```

### Option 3: Selective Import

```scss
// Just the essentials
@import 'cupcake-core/lib/styles/variables';
@import 'cupcake-core/lib/styles/mixins';

// Add components as needed
@import 'cupcake-core/lib/styles/components';
```

## Customization

### Custom Brand Colors

Override CSS custom properties to match your brand:

```scss
:root {
  --cupcake-primary: #your-brand-color;
  --cupcake-primary-rgb: r, g, b; // RGB values for transparency
  --cupcake-primary-dark: #darker-shade;
  --cupcake-primary-light: #lighter-shade;
}

@import 'cupcake-core/lib/styles';
```

### Custom Themes

Create your own theme by overriding variables:

```scss
:root {
  // Brand colors
  --cupcake-primary: #6366f1;
  --cupcake-primary-rgb: 99, 102, 241;
  --cupcake-secondary: #64748b;
  --cupcake-accent: #ec4899;
  
  // Custom spacing
  --cupcake-spacing-xs: 0.125rem;
  --cupcake-spacing-sm: 0.375rem;
  --cupcake-spacing-md: 0.75rem;
}

@import 'cupcake-core/lib/styles';
```

## Available Styles

### CSS Custom Properties

The system provides comprehensive CSS custom properties for:

- **Colors**: Primary, secondary, success, warning, danger, info
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl)
- **Typography**: Font families, sizes, and weights
- **Layout**: Borders, shadows, transitions
- **Components**: Cards, tables, forms, buttons

### Component Classes

Pre-built component classes with the `cupcake-` prefix:

```html
<!-- Cards -->
<div class="cupcake-card">
  <div class="cupcake-card-header">Header</div>
  <div class="cupcake-card-body">Content</div>
</div>

<!-- Buttons -->
<button class="cupcake-btn cupcake-btn-primary">Primary Button</button>
<button class="cupcake-btn cupcake-btn-outline-primary">Outline Button</button>

<!-- Forms -->
<div class="cupcake-form-group">
  <label class="cupcake-form-label">Label</label>
  <input class="cupcake-form-control" type="text">
</div>

<!-- Tables -->
<table class="cupcake-table">
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

### SCSS Mixins

Powerful mixins for common patterns:

```scss
// Responsive breakpoints
@include cupcake-media-breakpoint-up(md) {
  // Styles for medium screens and up
}

// Card styling
.my-component {
  @include cupcake-card();
}

// Focus states
.my-button {
  @include cupcake-focus-ring();
}

// Loading states
.loading-overlay {
  @include cupcake-loading-overlay();
}

// Animations
.fade-in-element {
  @include cupcake-fade-in();
}
```

### Utility Classes

Spacing and utility classes:

```html
<!-- Margin -->
<div class="cupcake-m-3">Margin on all sides</div>
<div class="cupcake-mt-2">Margin top</div>
<div class="cupcake-mx-4">Horizontal margin</div>

<!-- Padding -->
<div class="cupcake-p-3">Padding on all sides</div>
<div class="cupcake-py-2">Vertical padding</div>

<!-- Text utilities -->
<div class="cupcake-text-truncate">Long text that gets truncated...</div>

<!-- Layout utilities -->
<div class="cupcake-flex-center">Centered content</div>
<div class="cupcake-sr-only">Screen reader only</div>
```

## Dark Mode

Dark mode is automatically supported through CSS custom properties:

```html
<!-- Toggle dark mode -->
<html data-bs-theme="dark">
  <!-- or -->
<div class="dark-mode">
  <!-- Content with dark theme -->
</div>
```

## Bootstrap Integration

When using with Bootstrap, the integration file ensures cupcake colors are applied to Bootstrap components:

- All primary colors use cupcake's primary color
- Form controls inherit cupcake focus styles  
- Cards, modals, and dropdowns use cupcake backgrounds
- Tables inherit cupcake striping and hover styles

## Angular Integration

Import styles in your Angular application:

```typescript
// In angular.json
"styles": [
  "node_modules/cupcake-core/lib/styles/index.scss"
]
```

Or in your component:

```scss
// In component.scss
@import 'cupcake-core/lib/styles/variables';
@import 'cupcake-core/lib/styles/mixins';

.my-component {
  background-color: var(--cupcake-card-bg);
  padding: var(--cupcake-spacing-md);
  border-radius: var(--cupcake-border-radius);
  @include cupcake-hover-lift();
}
```

## File Structure

```
styles/
├── index.scss              # Main entry point
├── cupcake-core.scss       # Core stylesheet
├── _variables.scss         # CSS custom properties & SCSS variables  
├── _mixins.scss            # Reusable SCSS mixins
├── _components.scss        # Component styles
├── _bootstrap-integration.scss # Bootstrap theme integration
├── themes/
│   ├── _light.scss         # Light theme colors
│   └── _dark.scss          # Dark theme colors
└── README.md               # This documentation
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- All modern browsers with CSS custom property support

## Best Practices

1. **Use CSS Custom Properties**: Prefer `var(--cupcake-primary)` over hardcoded colors
2. **Leverage Mixins**: Use provided mixins for consistent styling patterns
3. **Follow BEM**: Use the `cupcake-` prefix for custom components
4. **Test Dark Mode**: Always test components in both light and dark themes
5. **Mobile First**: Use responsive mixins for mobile-first design

## Contributing

When adding new styles:

1. Follow the existing naming conventions
2. Add CSS custom properties for themeable values
3. Include both light and dark theme support
4. Provide SCSS mixins for reusable patterns
5. Update this documentation