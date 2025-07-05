import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { parseDesignInstruction, generateCSSVariables, defaultDesign, DesignConfig } from '@/lib/design-system'

const DESIGN_CONFIG_PATH = join(process.cwd(), 'design-config.json')
const CUSTOM_CSS_PATH = join(process.cwd(), 'app', 'design-variables.css')

// Get current design configuration
export async function GET(request: NextRequest) {
  try {
    let currentConfig = defaultDesign
    
    try {
      const configFile = await readFile(DESIGN_CONFIG_PATH, 'utf-8')
      currentConfig = { ...defaultDesign, ...JSON.parse(configFile) }
    } catch (error) {
      // File doesn't exist, use default
    }

    return NextResponse.json({
      success: true,
      config: currentConfig
    })
  } catch (error) {
    console.error('Error getting design config:', error)
    return NextResponse.json(
      { error: 'Failed to get design configuration' },
      { status: 500 }
    )
  }
}

// Update design based on natural language instruction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instruction, directConfig } = body

    let newConfig: DesignConfig

    if (instruction) {
      // Parse natural language instruction
      const changes = parseDesignInstruction(instruction)
      
      // Merge with existing config
      let currentConfig = defaultDesign
      try {
        const configFile = await readFile(DESIGN_CONFIG_PATH, 'utf-8')
        currentConfig = { ...defaultDesign, ...JSON.parse(configFile) }
      } catch (error) {
        // File doesn't exist, use default
      }

      newConfig = {
        colors: { ...currentConfig.colors, ...changes.colors },
        typography: { ...currentConfig.typography, ...changes.typography },
        spacing: { ...currentConfig.spacing, ...changes.spacing },
        layout: { ...currentConfig.layout, ...changes.layout }
      }
    } else if (directConfig) {
      // Direct configuration update
      newConfig = { ...defaultDesign, ...directConfig }
    } else {
      return NextResponse.json(
        { error: 'Either instruction or directConfig is required' },
        { status: 400 }
      )
    }

    // Save configuration
    await writeFile(DESIGN_CONFIG_PATH, JSON.stringify(newConfig, null, 2))

    // Generate and save CSS variables
    const cssVariables = generateCSSVariables(newConfig)
    await writeFile(CUSTOM_CSS_PATH, cssVariables)

    return NextResponse.json({
      success: true,
      config: newConfig,
      message: instruction ? 
        `デザインを更新しました: "${instruction}"` : 
        'デザイン設定を更新しました',
      instruction: instruction || 'Direct config update'
    })

  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    )
  }
}

// Reset to default design
export async function DELETE(request: NextRequest) {
  try {
    // Save default configuration
    await writeFile(DESIGN_CONFIG_PATH, JSON.stringify(defaultDesign, null, 2))

    // Generate default CSS variables
    const cssVariables = generateCSSVariables(defaultDesign)
    await writeFile(CUSTOM_CSS_PATH, cssVariables)

    return NextResponse.json({
      success: true,
      config: defaultDesign,
      message: 'デザインをデフォルトにリセットしました'
    })

  } catch (error) {
    console.error('Error resetting design:', error)
    return NextResponse.json(
      { error: 'Failed to reset design' },
      { status: 500 }
    )
  }
}