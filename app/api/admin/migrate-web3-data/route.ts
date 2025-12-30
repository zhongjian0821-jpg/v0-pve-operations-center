// app/api/admin/migrate-web3-data/route.ts
// 从Web3会员中心迁移数据到PVE，并提供管理界面

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { neon } from '@neondatabase/serverless';

// Web3数据库连接
const WEB3_DATABASE_URL = process.env.WEB3_DATABASE_URL || process.env.DATABASE_URL;
const web3Sql = neon(WEB3_DATABASE_URL!);

// GET - 检查Web3数据库状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // 检查Web3数据库的数据状态
      const web3Tables = [
        'wallets',
        'hierarchy', 
        'nodes',
        'assigned_records',
        'commission_records',
        'commission_distribution',
        'member_level_config',
        'withdrawal_records',
        'staking_records',
      ];

      const status = [];

      for (const table of web3Tables) {
        try {
          const countResult = await web3Sql`
            SELECT COUNT(*) as count FROM ${web3Sql(table)}
          `;
          const count = parseInt(countResult[0]?.count || '0');

          // 检查PVE中的数据
          const pveCountResult = await sql`
            SELECT COUNT(*) as count FROM ${sql(table)}
          `;
          const pveCount = parseInt(pveCountResult[0]?.count || '0');

          status.push({
            table,
            web3_rows: count,
            pve_rows: pveCount,
            needs_migration: count > pveCount,
            difference: count - pveCount,
          });
        } catch (error) {
          status.push({
            table,
            error: String(error),
          });
        }
      }

      return NextResponse.json({
        success: true,
        status,
        summary: {
          total_tables: status.length,
          tables_with_data: status.filter((s: any) => s.web3_rows > 0).length,
          tables_need_migration: status.filter((s: any) => s.needs_migration).length,
        },
      });
    }

    if (action === 'preview') {
      // 预览Web3数据
      const table = searchParams.get('table');
      const limit = parseInt(searchParams.get('limit') || '10');

      if (!table) {
        return NextResponse.json({
          success: false,
          error: 'table parameter required',
        }, { status: 400 });
      }

      const data = await web3Sql`
        SELECT * FROM ${web3Sql(table)}
        LIMIT ${limit}
      `;

      return NextResponse.json({
        success: true,
        table,
        count: data.length,
        data,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('检查Web3数据失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

// POST - 执行数据迁移
export async function POST(request: NextRequest) {
  try {
    const { table, mode } = await request.json();

    // mode: 'merge' (合并) 或 'replace' (替换)
    const migrationMode = mode || 'merge';

    if (!table) {
      return NextResponse.json({
        success: false,
        error: 'table parameter required',
      }, { status: 400 });
    }

    console.log(`开始迁移表: ${table}, 模式: ${migrationMode}`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // 根据不同的表执行不同的迁移策略
    switch (table) {
      case 'wallets':
        const wallets = await web3Sql`SELECT * FROM wallets`;
        
        for (const wallet of wallets) {
          try {
            if (migrationMode === 'replace') {
              // 替换模式：删除后插入
              await sql`DELETE FROM wallets WHERE wallet_address = ${wallet.wallet_address}`;
            }

            await sql`
              INSERT INTO wallets (
                wallet_address,
                ashva_balance,
                member_level,
                parent_wallet,
                total_referrals,
                commission_balance,
                total_withdrawn,
                is_active,
                last_login_at,
                created_at,
                updated_at
              ) VALUES (
                ${wallet.wallet_address},
                ${wallet.ashva_balance || 0},
                ${wallet.member_level || 'Bronze'},
                ${wallet.parent_wallet},
                ${wallet.total_referrals || 0},
                ${wallet.commission_balance || 0},
                ${wallet.total_withdrawn || 0},
                ${wallet.is_active !== false},
                ${wallet.last_login_at},
                ${wallet.created_at || new Date()},
                ${wallet.updated_at || new Date()}
              )
              ON CONFLICT (wallet_address) 
              DO UPDATE SET
                ashva_balance = EXCLUDED.ashva_balance,
                member_level = EXCLUDED.member_level,
                parent_wallet = EXCLUDED.parent_wallet,
                total_referrals = EXCLUDED.total_referrals,
                commission_balance = EXCLUDED.commission_balance,
                total_withdrawn = EXCLUDED.total_withdrawn,
                is_active = EXCLUDED.is_active,
                last_login_at = EXCLUDED.last_login_at,
                updated_at = NOW()
            `;
            migrated++;
          } catch (error) {
            console.error(`迁移钱包失败 ${wallet.wallet_address}:`, error);
            errors++;
          }
        }
        break;

      case 'hierarchy':
        const hierarchies = await web3Sql`SELECT * FROM hierarchy`;
        
        for (const h of hierarchies) {
          try {
            if (migrationMode === 'replace') {
              await sql`DELETE FROM hierarchy WHERE wallet_address = ${h.wallet_address}`;
            }

            await sql`
              INSERT INTO hierarchy (
                wallet_address,
                parent_wallet,
                level,
                path,
                direct_referrals,
                total_team_size,
                team_volume,
                created_at,
                updated_at
              ) VALUES (
                ${h.wallet_address},
                ${h.parent_wallet},
                ${h.level || 0},
                ${h.path},
                ${h.direct_referrals || 0},
                ${h.total_team_size || 0},
                ${h.team_volume || 0},
                ${h.created_at || new Date()},
                ${h.updated_at || new Date()}
              )
              ON CONFLICT (wallet_address)
              DO UPDATE SET
                parent_wallet = EXCLUDED.parent_wallet,
                level = EXCLUDED.level,
                path = EXCLUDED.path,
                direct_referrals = EXCLUDED.direct_referrals,
                total_team_size = EXCLUDED.total_team_size,
                team_volume = EXCLUDED.team_volume,
                updated_at = NOW()
            `;
            migrated++;
          } catch (error) {
            console.error(`迁移层级失败:`, error);
            errors++;
          }
        }
        break;

      case 'nodes':
        const nodes = await web3Sql`SELECT * FROM nodes`;
        
        for (const node of nodes) {
          try {
            if (migrationMode === 'replace') {
              await sql`DELETE FROM nodes WHERE node_id = ${node.node_id}`;
            }

            await sql`
              INSERT INTO nodes (
                node_id,
                wallet_address,
                node_type,
                status,
                purchase_price,
                purchase_date,
                activation_date,
                total_earned,
                is_transferable,
                created_at,
                updated_at
              ) VALUES (
                ${node.node_id},
                ${node.wallet_address},
                ${node.node_type},
                ${node.status || 'active'},
                ${node.purchase_price},
                ${node.purchase_date || new Date()},
                ${node.activation_date},
                ${node.total_earned || 0},
                ${node.is_transferable !== false},
                ${node.created_at || new Date()},
                ${node.updated_at || new Date()}
              )
              ON CONFLICT (node_id)
              DO UPDATE SET
                wallet_address = EXCLUDED.wallet_address,
                node_type = EXCLUDED.node_type,
                status = EXCLUDED.status,
                purchase_price = EXCLUDED.purchase_price,
                total_earned = EXCLUDED.total_earned,
                updated_at = NOW()
            `;
            migrated++;
          } catch (error) {
            console.error(`迁移节点失败:`, error);
            errors++;
          }
        }
        break;

      case 'commission_records':
        const commissions = await web3Sql`SELECT * FROM commission_records`;
        
        for (const c of commissions) {
          try {
            await sql`
              INSERT INTO commission_records (
                wallet_address,
                from_wallet,
                amount,
                commission_level,
                commission_type,
                node_id,
                transaction_id,
                status,
                notes,
                created_at
              ) VALUES (
                ${c.wallet_address},
                ${c.from_wallet},
                ${c.amount},
                ${c.commission_level},
                ${c.commission_type},
                ${c.node_id},
                ${c.transaction_id},
                ${c.status || 'completed'},
                ${c.notes},
                ${c.created_at || new Date()}
              )
              ON CONFLICT DO NOTHING
            `;
            migrated++;
          } catch (error) {
            errors++;
          }
        }
        break;

      case 'withdrawal_records':
        const withdrawals = await web3Sql`SELECT * FROM withdrawal_records`;
        
        for (const w of withdrawals) {
          try {
            await sql`
              INSERT INTO withdrawal_records (
                wallet_address,
                amount,
                amount_usd,
                fee,
                net_amount,
                status,
                transaction_hash,
                withdrawal_address,
                admin_notes,
                processed_at,
                created_at
              ) VALUES (
                ${w.wallet_address},
                ${w.amount},
                ${w.amount_usd},
                ${w.fee || 0},
                ${w.net_amount},
                ${w.status || 'pending'},
                ${w.transaction_hash},
                ${w.withdrawal_address},
                ${w.admin_notes},
                ${w.processed_at},
                ${w.created_at || new Date()}
              )
              ON CONFLICT DO NOTHING
            `;
            migrated++;
          } catch (error) {
            errors++;
          }
        }
        break;

      case 'staking_records':
        const stakings = await web3Sql`SELECT * FROM staking_records`;
        
        for (const s of stakings) {
          try {
            await sql`
              INSERT INTO staking_records (
                wallet_address,
                node_id,
                staked_amount,
                staked_amount_usd,
                reward_rate,
                total_rewards,
                last_reward_at,
                status,
                lock_period_days,
                unlock_at,
                created_at,
                updated_at
              ) VALUES (
                ${s.wallet_address},
                ${s.node_id},
                ${s.staked_amount},
                ${s.staked_amount_usd},
                ${s.reward_rate},
                ${s.total_rewards || 0},
                ${s.last_reward_at},
                ${s.status || 'active'},
                ${s.lock_period_days || 0},
                ${s.unlock_at},
                ${s.created_at || new Date()},
                ${s.updated_at || new Date()}
              )
              ON CONFLICT DO NOTHING
            `;
            migrated++;
          } catch (error) {
            errors++;
          }
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Table ${table} migration not implemented`,
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      table,
      mode: migrationMode,
      migrated,
      skipped,
      errors,
      message: `成功迁移 ${migrated} 条数据`,
    });

  } catch (error) {
    console.error('数据迁移失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
