-- =====================================================
-- 🔧 创建PVE管理系统缺失的数据库表
-- =====================================================
-- 创建日期: 2024-12-30
-- 目的: 补充PVE数据库缺失的9个表，使所有API正常工作
-- 执行方式: psql $DATABASE_URL < create_missing_tables.sql
-- =====================================================

-- 0. 检查现有表
DO $$ 
BEGIN
  RAISE NOTICE '检查现有表...';
END $$;

SELECT 'Table: ' || table_name as existing_tables
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 1. wallets - 钱包主表
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  ashva_balance DECIMAL(20, 8) DEFAULT 0,
  member_level VARCHAR(20) DEFAULT 'Bronze',
  parent_wallet VARCHAR(42),
  total_referrals INTEGER DEFAULT 0,
  commission_balance DECIMAL(20, 8) DEFAULT 0,
  total_withdrawn DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_parent ON wallets(parent_wallet);
CREATE INDEX IF NOT EXISTS idx_wallets_level ON wallets(member_level);

COMMENT ON TABLE wallets IS '钱包主表 - 存储用户钱包基本信息';
COMMENT ON COLUMN wallets.ashva_balance IS 'ASHVA代币余额';
COMMENT ON COLUMN wallets.member_level IS '会员等级: Bronze, Silver, Gold, Platinum, Diamond';
COMMENT ON COLUMN wallets.parent_wallet IS '推荐人钱包地址';

DO $$ 
BEGIN
  RAISE NOTICE '✅ wallets 表已创建';
END $$;

-- =====================================================
-- 2. hierarchy - 推荐层级关系表
-- =====================================================
CREATE TABLE IF NOT EXISTS hierarchy (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  parent_wallet VARCHAR(42),
  level INTEGER DEFAULT 0,
  path TEXT,
  direct_referrals INTEGER DEFAULT 0,
  total_team_size INTEGER DEFAULT 0,
  team_volume DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_wallet ON hierarchy(wallet_address);
CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON hierarchy(parent_wallet);
CREATE INDEX IF NOT EXISTS idx_hierarchy_level ON hierarchy(level);

COMMENT ON TABLE hierarchy IS '用户推荐层级关系表';
COMMENT ON COLUMN hierarchy.path IS '层级路径，如: /root/user1/user2';
COMMENT ON COLUMN hierarchy.level IS '层级深度，从0开始';
COMMENT ON COLUMN hierarchy.team_volume IS '团队总业绩';

DO $$ 
BEGIN
  RAISE NOTICE '✅ hierarchy 表已创建';
END $$;

-- =====================================================
-- 3. nodes - 节点信息主表
-- =====================================================
CREATE TABLE IF NOT EXISTS nodes (
  node_id VARCHAR(100) PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  purchase_price DECIMAL(20, 8),
  purchase_date TIMESTAMP DEFAULT NOW(),
  activation_date TIMESTAMP,
  deactivation_date TIMESTAMP,
  total_earned DECIMAL(20, 8) DEFAULT 0,
  is_transferable BOOLEAN DEFAULT true,
  cpu_cores INTEGER,
  memory_gb INTEGER,
  storage_gb INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_wallet ON nodes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);

COMMENT ON TABLE nodes IS '节点信息主表';
COMMENT ON COLUMN nodes.node_type IS '节点类型: cloud_basic, cloud_pro, image_standard, etc.';
COMMENT ON COLUMN nodes.status IS '状态: active, inactive, pending, transferred';

DO $$ 
BEGIN
  RAISE NOTICE '✅ nodes 表已创建';
END $$;

-- =====================================================
-- 4. assigned_records - 节点收益分配记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS assigned_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  node_id VARCHAR(100),
  device_id VARCHAR(100),
  daily_income_ashva DECIMAL(20, 8) DEFAULT 0,
  daily_income_usd DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  last_payout_at TIMESTAMP,
  total_earned DECIMAL(20, 8) DEFAULT 0,
  nodes_count INTEGER DEFAULT 0,
  payout_frequency VARCHAR(20) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assigned_wallet ON assigned_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_assigned_node ON assigned_records(node_id);
CREATE INDEX IF NOT EXISTS idx_assigned_status ON assigned_records(status);
CREATE INDEX IF NOT EXISTS idx_assigned_date ON assigned_records(created_at DESC);

COMMENT ON TABLE assigned_records IS '节点收益分配记录表';
COMMENT ON COLUMN assigned_records.status IS '状态: active, paused, completed';
COMMENT ON COLUMN assigned_records.payout_frequency IS '发放频率: daily, weekly, monthly';

DO $$ 
BEGIN
  RAISE NOTICE '✅ assigned_records 表已创建';
END $$;

-- =====================================================
-- 5. commission_records - 佣金历史记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS commission_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  from_wallet VARCHAR(42),
  amount DECIMAL(20, 8) NOT NULL,
  commission_level INTEGER,
  commission_type VARCHAR(50),
  node_id VARCHAR(100),
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_rec_wallet ON commission_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_commission_rec_from ON commission_records(from_wallet);
CREATE INDEX IF NOT EXISTS idx_commission_rec_type ON commission_records(commission_type);
CREATE INDEX IF NOT EXISTS idx_commission_rec_date ON commission_records(created_at DESC);

COMMENT ON TABLE commission_records IS '佣金历史记录表';
COMMENT ON COLUMN commission_records.commission_type IS '佣金类型: referral, team, node_income, etc.';

DO $$ 
BEGIN
  RAISE NOTICE '✅ commission_records 表已创建';
END $$;

-- =====================================================
-- 6. commission_distribution - 佣金分配规则表
-- =====================================================
CREATE TABLE IF NOT EXISTS commission_distribution (
  id SERIAL PRIMARY KEY,
  from_wallet VARCHAR(42) NOT NULL,
  to_wallet VARCHAR(42) NOT NULL,
  level INTEGER NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  amount DECIMAL(20, 8),
  transaction_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commission_dist_from ON commission_distribution(from_wallet);
CREATE INDEX IF NOT EXISTS idx_commission_dist_to ON commission_distribution(to_wallet);
CREATE INDEX IF NOT EXISTS idx_commission_dist_status ON commission_distribution(status);
CREATE INDEX IF NOT EXISTS idx_commission_dist_date ON commission_distribution(created_at DESC);

COMMENT ON TABLE commission_distribution IS '佣金分配规则和记录表';
COMMENT ON COLUMN commission_distribution.level IS '推荐层级: 1=直推, 2=二级, 以此类推';
COMMENT ON COLUMN commission_distribution.status IS '状态: pending, processing, completed, failed';

DO $$ 
BEGIN
  RAISE NOTICE '✅ commission_distribution 表已创建';
END $$;

-- =====================================================
-- 7. member_level_config - 会员等级配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS member_level_config (
  id SERIAL PRIMARY KEY,
  level_name VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  level_order INTEGER DEFAULT 0,
  max_depth INTEGER DEFAULT 10,
  commission_total_percentage DECIMAL(5, 2),
  min_nodes_required INTEGER DEFAULT 0,
  min_team_size INTEGER DEFAULT 0,
  benefits TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_level_order ON member_level_config(level_order);

COMMENT ON TABLE member_level_config IS '会员等级配置表';
COMMENT ON COLUMN member_level_config.level_order IS '等级顺序: 1=Bronze, 2=Silver, ...';
COMMENT ON COLUMN member_level_config.max_depth IS '最大推荐层级深度';

-- 插入默认会员等级
INSERT INTO member_level_config 
  (level_name, display_name, level_order, max_depth, commission_total_percentage, min_nodes_required, min_team_size)
VALUES
  ('Bronze', '青铜会员', 1, 5, 5.00, 0, 0),
  ('Silver', '白银会员', 2, 7, 7.00, 1, 3),
  ('Gold', '黄金会员', 3, 10, 10.00, 3, 10),
  ('Platinum', '铂金会员', 4, 12, 12.00, 5, 30),
  ('Diamond', '钻石会员', 5, 15, 15.00, 10, 100)
ON CONFLICT (level_name) DO NOTHING;

DO $$ 
BEGIN
  RAISE NOTICE '✅ member_level_config 表已创建（包含默认数据）';
END $$;

-- =====================================================
-- 8. withdrawal_records - 提现记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS withdrawal_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(20, 8),
  fee DECIMAL(20, 8) DEFAULT 0,
  net_amount DECIMAL(20, 8),
  status VARCHAR(20) DEFAULT 'pending',
  transaction_hash VARCHAR(66),
  withdrawal_address VARCHAR(42),
  admin_notes TEXT,
  rejected_reason TEXT,
  processed_by VARCHAR(42),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_wallet ON withdrawal_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_records(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_date ON withdrawal_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_tx ON withdrawal_records(transaction_hash);

COMMENT ON TABLE withdrawal_records IS '提现记录表';
COMMENT ON COLUMN withdrawal_records.status IS '状态: pending, processing, completed, rejected, failed';
COMMENT ON COLUMN withdrawal_records.net_amount IS '扣除手续费后实际到账金额';

DO $$ 
BEGIN
  RAISE NOTICE '✅ withdrawal_records 表已创建';
END $$;

-- =====================================================
-- 9. staking_records - 质押记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS staking_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  node_id VARCHAR(100),
  staked_amount DECIMAL(20, 8) NOT NULL,
  staked_amount_usd DECIMAL(20, 8),
  reward_rate DECIMAL(5, 2),
  total_rewards DECIMAL(20, 8) DEFAULT 0,
  last_reward_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  lock_period_days INTEGER DEFAULT 0,
  unlock_at TIMESTAMP,
  unstake_requested_at TIMESTAMP,
  unstaked_at TIMESTAMP,
  penalty_amount DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staking_wallet ON staking_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staking_node ON staking_records(node_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON staking_records(status);
CREATE INDEX IF NOT EXISTS idx_staking_date ON staking_records(created_at DESC);

COMMENT ON TABLE staking_records IS '质押记录表';
COMMENT ON COLUMN staking_records.status IS '状态: active, unstaking, completed, penalty';
COMMENT ON COLUMN staking_records.lock_period_days IS '锁定期天数, 0表示灵活质押';

DO $$ 
BEGIN
  RAISE NOTICE '✅ staking_records 表已创建';
END $$;

-- =====================================================
-- 最终检查
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================================================';
  RAISE NOTICE '  ✅ 所有表创建完成';
  RAISE NOTICE '======================================================================';
END $$;

-- 显示所有表
SELECT 'Table: ' || table_name as all_tables
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '下一步: 验证表结构';
  RAISE NOTICE '运行: SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'';';
END $$;
