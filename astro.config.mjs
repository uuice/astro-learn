import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import remarkToc from 'remark-toc'
import remarkCustomDirectives from './src/plugins/remark-custom-directives.mjs'
import rehypeRaw from 'rehype-raw'
import rehypeCustomDirectives from './src/plugins/rehype-custom-directives.mjs'
import rehypeSlug from 'rehype-slug'
import rehypePresetMinify from 'rehype-preset-minify'
import tailwindcss from '@tailwindcss/vite'
import node from '@astrojs/node'
import react from '@astrojs/react'
import vue from '@astrojs/vue'

const rehypePluginsBase = [rehypeSlug]

export default defineConfig({
  output: 'server',
  session: {
    driver: 'fs',
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
    remarkPlugins: [remarkCustomDirectives, [remarkToc, { heading: '目录', maxDepth: 3 }]],
    rehypePlugins: [rehypeRaw, rehypeCustomDirectives, ...rehypePluginsBase],
    gfm: true,
  },

  integrations: [mdx({
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
    remarkPlugins: [remarkCustomDirectives, [remarkToc, { heading: '目录', maxDepth: 3 }]],
    rehypePlugins: [rehypeRaw, rehypeCustomDirectives, ...rehypePluginsBase, rehypePresetMinify],
    remarkRehype: { footnoteLabel: 'Footnotes' },
    gfm: true,
    extendMarkdownConfig: true,
  }), react(), vue()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: 'middleware',
  }),

  security: {
    checkOrigin: false,
  },
}) 