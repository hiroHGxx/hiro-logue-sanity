// Design system configuration
export interface DesignConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: {
      primary: string
      secondary: string
      muted: string
    }
  }
  typography: {
    headings: {
      h1: {
        fontSize: string
        fontWeight: string
        lineHeight: string
      }
      h2: {
        fontSize: string
        fontWeight: string
        lineHeight: string
      }
      h3: {
        fontSize: string
        fontWeight: string
        lineHeight: string
      }
    }
    body: {
      fontSize: string
      lineHeight: string
      fontWeight: string
    }
  }
  spacing: {
    sectionPadding: string
    cardPadding: string
    elementSpacing: string
  }
  layout: {
    maxWidth: string
    headerHeight: string
    borderRadius: string
  }
}

// Default design configuration
export const defaultDesign: DesignConfig = {
  colors: {
    primary: '#2563eb',      // Blue-600
    secondary: '#64748b',    // Slate-500  
    accent: '#0ea5e9',       // Sky-500
    background: '#ffffff',   // White
    surface: '#f8fafc',      // Slate-50
    text: {
      primary: '#0f172a',    // Slate-900
      secondary: '#475569',  // Slate-600
      muted: '#64748b'       // Slate-500
    }
  },
  typography: {
    headings: {
      h1: {
        fontSize: '3rem',     // text-5xl
        fontWeight: '700',    // font-bold
        lineHeight: '1.2'
      },
      h2: {
        fontSize: '2rem',     // text-3xl
        fontWeight: '600',    // font-semibold
        lineHeight: '1.3'
      },
      h3: {
        fontSize: '1.5rem',   // text-2xl
        fontWeight: '600',    // font-semibold
        lineHeight: '1.4'
      }
    },
    body: {
      fontSize: '1rem',      // text-base
      lineHeight: '1.6',
      fontWeight: '400'      // font-normal
    }
  },
  spacing: {
    sectionPadding: '4rem',  // py-16
    cardPadding: '1.5rem',   // p-6
    elementSpacing: '1rem'   // space-y-4
  },
  layout: {
    maxWidth: '72rem',       // max-w-6xl
    headerHeight: '4rem',    // h-16
    borderRadius: '0.5rem'   // rounded-lg
  }
}

// Generate CSS custom properties from design config
export function generateCSSVariables(config: DesignConfig): string {
  return `
    :root {
      --color-primary: ${config.colors.primary};
      --color-secondary: ${config.colors.secondary};
      --color-accent: ${config.colors.accent};
      --color-background: ${config.colors.background};
      --color-surface: ${config.colors.surface};
      --color-text-primary: ${config.colors.text.primary};
      --color-text-secondary: ${config.colors.text.secondary};
      --color-text-muted: ${config.colors.text.muted};
      
      --font-size-h1: ${config.typography.headings.h1.fontSize};
      --font-size-h2: ${config.typography.headings.h2.fontSize};
      --font-size-h3: ${config.typography.headings.h3.fontSize};
      --font-size-body: ${config.typography.body.fontSize};
      
      --font-weight-h1: ${config.typography.headings.h1.fontWeight};
      --font-weight-h2: ${config.typography.headings.h2.fontWeight};
      --font-weight-h3: ${config.typography.headings.h3.fontWeight};
      --font-weight-body: ${config.typography.body.fontWeight};
      
      --line-height-h1: ${config.typography.headings.h1.lineHeight};
      --line-height-h2: ${config.typography.headings.h2.lineHeight};
      --line-height-h3: ${config.typography.headings.h3.lineHeight};
      --line-height-body: ${config.typography.body.lineHeight};
      
      --spacing-section: ${config.spacing.sectionPadding};
      --spacing-card: ${config.spacing.cardPadding};
      --spacing-element: ${config.spacing.elementSpacing};
      
      --layout-max-width: ${config.layout.maxWidth};
      --layout-header-height: ${config.layout.headerHeight};
      --layout-border-radius: ${config.layout.borderRadius};
    }
  `
}

// Parse natural language design instructions
export function parseDesignInstruction(instruction: string): Partial<DesignConfig> {
  const changes: Partial<DesignConfig> = {}
  const lowerInstruction = instruction.toLowerCase()

  // Text color adjustments
  if (lowerInstruction.includes('本文') && (lowerInstruction.includes('濃く') || lowerInstruction.includes('読みやすく'))) {
    changes.colors = {
      ...defaultDesign.colors,
      text: {
        ...defaultDesign.colors.text,
        primary: '#111827',   // Even darker
        secondary: '#374151'  // Darker secondary
      }
    }
  }

  // Background color changes
  if (lowerInstruction.includes('背景') && lowerInstruction.includes('オフホワイト')) {
    changes.colors = {
      ...changes.colors || defaultDesign.colors,
      background: '#fefefe',
      surface: '#f9fafb'
    }
  }

  // Font size changes
  if (lowerInstruction.includes('見出し') && lowerInstruction.includes('大きく')) {
    changes.typography = {
      ...defaultDesign.typography,
      headings: {
        h1: { ...defaultDesign.typography.headings.h1, fontSize: '3.5rem' },
        h2: { ...defaultDesign.typography.headings.h2, fontSize: '2.5rem' },
        h3: { ...defaultDesign.typography.headings.h3, fontSize: '1.75rem' }
      }
    }
  }

  // Blue theme
  if (lowerInstruction.includes('青') || lowerInstruction.includes('ブルー')) {
    changes.colors = {
      ...changes.colors || defaultDesign.colors,
      primary: '#1d4ed8',
      accent: '#3b82f6'
    }
  }

  // Green theme  
  if (lowerInstruction.includes('緑') || lowerInstruction.includes('グリーン')) {
    changes.colors = {
      ...changes.colors || defaultDesign.colors,
      primary: '#059669',
      accent: '#10b981'
    }
  }

  return changes
}