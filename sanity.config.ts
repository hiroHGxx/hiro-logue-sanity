import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Hiro-Logue',

  projectId: '9dzq8f77',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  studio: {
    components: {
      layout: (props) => {
        // Remove any CSS imports that might conflict
        return props.renderDefault(props)
      },
    },
  },
})