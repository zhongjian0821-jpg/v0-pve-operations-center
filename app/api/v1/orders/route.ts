import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      productType,
      nodeId,
      totalAmount,
      transactionHash,
      specs = {},
      createdAt
    } = body;

    console.log('[订单Webhook] 收到订单:', { nodeId, walletAddress });

    // 检查是否已存在
    const existing = await sql`
      SELECT id FROM pending_assignments WHERE node_id = ${nodeId}
    `;

    if (existing.length > 0) {
      return errorResponse('订单已存在', 400);
    }

    // 创建待分配订单
    const assignment = await sql`
      INSERT INTO pending_assignments (
        node_id,
        wallet_address,
        product_type,
        tx_hash,
        cpu_cores,
        memory_gb,
        storage_gb,
        amount_ashva,
        status,
        created_at
      ) VALUES (
        ${nodeId},
        ${walletAddress.toLowerCase()},
        ${productType},
        ${transactionHash},
        ${specs.cpu_cores || null},
        ${specs.memory_gb || null},
        ${specs.storage_gb || null},
        ${totalAmount},
        'pending',
        ${createdAt || new Date().toISOString()}
      ) RETURNING *
    `;

    console.log('[订单Webhook] 订单创建成功:', assignment[0].id);

    return successResponse(assignment[0], '订单接收成功');
  } catch (error: any) {
    console.error('[订单Webhook] 失败:', error);
    return errorResponse(error.message, 500);
  }
}
