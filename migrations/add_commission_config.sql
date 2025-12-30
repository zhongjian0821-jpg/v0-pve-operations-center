-- 创建佣金配置表
CREATE TABLE IF NOT EXISTS commission_config (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  member_level VARCHAR(50) NOT NULL,
  self_rate DECIMAL(5, 2) DEFAULT 0,
  level1_rate DECIMAL(5, 2) DEFAULT 3.0,
  level2_rate DECIMAL(5, 2) DEFAULT 2.0,
  market_partner_rate DECIMAL(5, 2) DEFAULT 10.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commission_config_wallet ON commission_config(wallet_address);

-- 添加注释
COMMENT ON TABLE commission_config IS '会员佣金配置表';
COMMENT ON COLUMN commission_config.wallet_address IS '钱包地址';
COMMENT ON COLUMN commission_config.member_level IS '会员等级';
COMMENT ON COLUMN commission_config.self_rate IS '自己保留的佣金比例';
COMMENT ON COLUMN commission_config.level1_rate IS '直推佣金比例';
COMMENT ON COLUMN commission_config.level2_rate IS '间推佣金比例';
COMMENT ON COLUMN commission_config.market_partner_rate IS '市场合伙人佣金比例（仅全球合伙人）';
