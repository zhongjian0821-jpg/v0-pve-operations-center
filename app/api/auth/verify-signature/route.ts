export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json();

    if (!address || !message || !signature) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证签名
    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.error('[API] 签名验证失败:', {
        expected: address,
        recovered: recoveredAddress
      });
      return NextResponse.json(
        { success: false, error: '签名验证失败' },
        { status: 401 }
      );
    }

    console.log('[API] 签名验证成功:', address);

    return NextResponse.json({
      success: true,
      data: {
        address: recoveredAddress,
        verified: true
      }
    });

  } catch (error: any) {
    console.error('[API] 签名验证错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '验证失败' },
      { status: 500 }
    );
  }
}
