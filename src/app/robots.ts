import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/interview/', '/history/'],
    },
    sitemap: 'https://www.roundready.in/sitemap.xml',
  }
}
