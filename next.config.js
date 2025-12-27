/** @type {import('next').NextConfig} */
const nextConfig = {
  // 添加构建时间戳，强制重新构建
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // 添加headers禁用admin路由缓存
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0'
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
            key: 'Surrogate-Control',
            value: 'no-store'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
