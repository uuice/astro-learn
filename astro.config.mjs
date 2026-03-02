import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import remarkToc from 'remark-toc'
import rehypePresetMinify from 'rehype-preset-minify'
import tailwindcss from '@tailwindcss/vite'
import node from '@astrojs/node'
import react from '@astrojs/react'
// https://astro.build/config
export default defineConfig({
  markdown: {
      syntaxHighlight: 'prism',
      remarkPlugins: [[remarkToc, { heading: 'toc', maxDepth: 3 } ]],
      gfm: true,
  },

  integrations: [mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: { theme: 'dracula' },
      remarkPlugins: [[remarkToc, { heading: 'toc', maxDepth: 3 } ]],
      rehypePlugins: [rehypePresetMinify],
      remarkRehype: { footnoteLabel: 'Footnotes' },
      gfm: false, 
      extendMarkdownConfig: true
  }
  ), react()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: 'middleware',
  }),
}) 