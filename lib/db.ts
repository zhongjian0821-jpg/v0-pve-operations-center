import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// 配置 WebSocket (仅在非 Edge 环境)
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;

// 兼容旧的查询方式
export { pool };
