/** @type {import('next').NextConfig} */
const nextConfig = {
  // 添加headers禁用admin路由缓存
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      }
    ]
  },
  // 确保生成静态路由
  output: 'standalone'
}

module.exports = nextConfig
