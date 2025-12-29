import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const THRESHOLDS = { GLOBAL_PARTNER: 10000, MARKET_PARTNER: 3000 };

function calcLevel(usd: number): string {
  return usd >= THRESHOLDS.GLOBAL_PARTNER ? 'global_partner' : 
         usd >= THRESHOLDS.MARKET_PARTNER ? 'market_partner' : 'normal';
}

async function getAshvaPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.pairs?.[0]?.priceUsd) return parseFloat(data.pairs[0].priceUsd);
    }
  } catch (e) {}
  return 0.00008291;
}

export async function GET(req: NextRequest) {
  try {
    const address = new URL(req.url).searchParams.get('address') || new URL(req.url).searchParams.get('wallet');
    if (!address) return NextResponse.json({ success: false, error: '缺少钱包地址' }, { status: 400 });

    const w = await query(`SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1)`, [address]);
    if (w.length === 0) return NextResponse.json({ success: false, error: '钱包不存在' }, { status: 404 });

    const wallet = w[0];
    const price = await getAshvaPrice();
    const usd = parseFloat(wallet.ashva_balance) * price;
    const level = calcLevel(usd);

    const cfg = await query(`SELECT * FROM member_level_config WHERE level_name = $1`, [level]);
    const c = cfg[0] || {};

    const direct = await query(`SELECT COUNT(*) as count FROM wallets WHERE LOWER(parent_wallet) = LOWER($1)`, [address]);
    const team = await query(`SELECT COUNT(DISTINCT wallet_address) as count FROM hierarchy WHERE LOWER(parent_wallet) = LOWER($1)`, [address]);

    return NextResponse.json({
      success: true,
      data: {
        walletAddress: wallet.wallet_address,
        ashvaBalance: parseFloat(wallet.ashva_balance),
        ashvaValueUSD: usd,
        ashvaPrice: price,
        memberLevel: level,
        memberLevelDisplay: c.display_name || '普通会员',
        maxCommissionDepth: c.max_depth || 0,
        totalEarnings: parseFloat(wallet.total_earnings || 0),
        distributableCommission: parseFloat(wallet.distributable_commission || 0),
        distributedCommission: parseFloat(wallet.distributed_commission || 0),
        pendingWithdrawal: parseFloat(wallet.pending_withdrawal || 0),
        totalWithdrawn: parseFloat(wallet.total_withdrawn || 0),
        parentWallet: wallet.parent_wallet,
        directReferrals: parseInt(direct[0]?.count || 0),
        teamSize: parseInt(team[0]?.count || wallet.team_size || 0),
        joinDate: wallet.created_at,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
