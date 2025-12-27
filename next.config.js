/** @type {import('next').NextConfig} */
const nextConfig = {
  // 强制禁用静态页面生成，确保动态路由
  experimental: {
    runtime: 'experimental-edge'
  },
  // 添加headers禁用缓存
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
