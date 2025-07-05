// Convert markdown content to Sanity Portable Text format
export function markdownToPortableText(markdown: string): any[] {
  const lines = markdown.split('\n').filter(line => line.trim() !== '')
  const blocks: any[] = []
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    
    // Skip empty lines
    if (!trimmedLine) return
    
    // Heading 1
    if (trimmedLine.startsWith('# ')) {
      blocks.push({
        _type: 'block',
        _key: `h1-${index}`,
        style: 'h1',
        children: [
          {
            _type: 'span',
            text: trimmedLine.substring(2),
            marks: []
          }
        ]
      })
      return
    }
    
    // Heading 2
    if (trimmedLine.startsWith('## ')) {
      blocks.push({
        _type: 'block',
        _key: `h2-${index}`,
        style: 'h2',
        children: [
          {
            _type: 'span',
            text: trimmedLine.substring(3),
            marks: []
          }
        ]
      })
      return
    }
    
    // Heading 3
    if (trimmedLine.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        _key: `h3-${index}`,
        style: 'h3',
        children: [
          {
            _type: 'span',
            text: trimmedLine.substring(4),
            marks: []
          }
        ]
      })
      return
    }
    
    // List item
    if (trimmedLine.match(/^\d+\.\s/) || trimmedLine.startsWith('- ')) {
      const isNumbered = trimmedLine.match(/^\d+\.\s/)
      const text = isNumbered ? 
        trimmedLine.replace(/^\d+\.\s/, '') : 
        trimmedLine.substring(2)
      
      // Parse inline formatting
      const children = parseInlineFormatting(text)
      
      blocks.push({
        _type: 'block',
        _key: `list-${index}`,
        style: 'normal',
        listItem: isNumbered ? 'number' : 'bullet',
        level: 1,
        children
      })
      return
    }
    
    // Regular paragraph
    const children = parseInlineFormatting(trimmedLine)
    blocks.push({
      _type: 'block',
      _key: `p-${index}`,
      style: 'normal',
      children
    })
  })
  
  return blocks
}

// Parse inline formatting (bold, italic, etc.)
function parseInlineFormatting(text: string): any[] {
  const children: any[] = []
  let currentText = text
  
  // Simple approach: split by bold markers
  const boldRegex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index)
      if (beforeText) {
        children.push({
          _type: 'span',
          text: beforeText,
          marks: []
        })
      }
    }
    
    // Add bold text
    children.push({
      _type: 'span',
      text: match[1],
      marks: ['strong']
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    if (remainingText) {
      children.push({
        _type: 'span',
        text: remainingText,
        marks: []
      })
    }
  }
  
  // If no formatting found, return simple text
  if (children.length === 0) {
    children.push({
      _type: 'span',
      text: text,
      marks: []
    })
  }
  
  return children
}