/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://kapitansisig.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: ['/admin/*', '/api/*', '/_next/*', '/static/*'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kapitansisig.com'}/sitemap.xml`,
    ],
  },
  exclude: [
    '/server-sitemap.xml',
    '/admin/*',
    '/api/*',
    '/404',
    '/500',
    '/_error',
    '/_app',
    '/_document',
  ],
  // Change frequency and priority for different pages
  changefreq: 'daily',
  priority: 0.8,
  // Transform function to customize sitemap entries
  transform: async (config, path) => {
    // Custom priority based on path
    let priority = config.priority;
    if (path === '/') {
      priority = 1.0;
    } else if (path.startsWith('/menu')) {
      priority = 0.9;
    } else if (path.startsWith('/about') || path.startsWith('/contact')) {
      priority = 0.8;
    } else if (path.startsWith('/dishes')) {
      priority = 0.85;
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};
