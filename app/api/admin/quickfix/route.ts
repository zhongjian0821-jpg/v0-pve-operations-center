import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // 添加缺失字段
    await query(`
      ALTER TABLE member_level_config 
      ADD COLUMN IF NOT EXISTS min_ashva_value_usd NUMERIC(20,2) DEFAULT 0
    `, []);

    // 更新数据
    await query(`UPDATE member_level_config SET min_ashva_value_usd = 0 WHERE level_name = 'normal'`, []);
    await query(`UPDATE member_level_config SET min_ashva_value_usd = 3000 WHERE level_name = 'market_partner'`, []);
    await query(`UPDATE member_level_config SET min_ashva_value_usd = 10000 WHERE level_name = 'global_partner'`, []);

    return NextResponse.json({ success: true, message: '字段已添加' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
