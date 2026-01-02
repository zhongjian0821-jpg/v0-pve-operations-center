import { neon } from '@neondatabase/serverless';

// 创建 sql 函数（主要使用）
const sql = neon(process.env.DATABASE_URL!);

// 导出 sql 函数（推荐使用）
export { sql };

// 默认导出也是 sql（兼容性）
export default sql;

// 辅助查询函数
export async function query(text: string, params?: any[]) {
  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
