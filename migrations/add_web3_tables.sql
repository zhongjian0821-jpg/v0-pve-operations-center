-- PVE 完整迁移 - 添加 Web3 功能表
-- 执行时间: 2024-12-28

-- 1. 云节点购买记录
CREATE TABLE IF NOT EXISTS cloud_node_purchases (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  quantity INTEGER DEFAULT 1,
  price_per_node DECIMAL(20, 8),
  total_amount DECIMAL(20, 8),
  payment_method VARCHAR(50),
  payment_token VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cloud_purchases_wallet ON cloud_node_purchases(wallet_address);
CREATE INDEX idx_cloud_purchases_status ON cloud_node_purchases(status);

-- 2. 镜像节点购买记录
CREATE TABLE IF NOT EXISTS image_node_purchases (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  image_type VARCHAR(50) NOT NULL,
  device_id VARCHAR(100),
  price DECIMAL(20, 8),
  payment_method VARCHAR(50),
  payment_token VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',
  activation_date TIMESTAMP,
  expiry_date TIMESTAMP,
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_image_purchases_wallet ON image_node_purchases(wallet_address);
CREATE INDEX idx_image_purchases_device ON image_node_purchases(device_id);

-- 3. 节点市场挂单
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id SERIAL PRIMARY KEY,
  seller_address VARCHAR(42) NOT NULL,
  node_id INTEGER REFERENCES nodes(id),
  listing_price DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ASHVA',
  status VARCHAR(20) DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP
);

CREATE INDEX idx_marketplace_seller ON marketplace_listings(seller_address);
CREATE INDEX idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_node ON marketplace_listings(node_id);

-- 4. 节点市场交易记录
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES marketplace_listings(id),
  buyer_address VARCHAR(42) NOT NULL,
  seller_address VARCHAR(42) NOT NULL,
  node_id INTEGER REFERENCES nodes(id),
  transaction_price DECIMAL(20, 8) NOT NULL,
  platform_fee DECIMAL(20, 8),
  seller_receives DECIMAL(20, 8),
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_market_tx_buyer ON marketplace_transactions(buyer_address);
CREATE INDEX idx_market_tx_seller ON marketplace_transactions(seller_address);

-- 5. ASHVA 价格历史
CREATE TABLE IF NOT EXISTS ashva_price_history (
  id SERIAL PRIMARY KEY,
  price_usd DECIMAL(20, 8) NOT NULL,
  price_cny DECIMAL(20, 8),
  volume_24h DECIMAL(30, 8),
  market_cap DECIMAL(30, 8),
  source VARCHAR(50),
  dex_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_time ON ashva_price_history(created_at DESC);

-- 6. 系统日志（扩展 operation_logs）
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50),
  user_address VARCHAR(42),
  ip_address VARCHAR(45),
  description TEXT,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_logs_type ON system_logs(event_type);
CREATE INDEX idx_system_logs_user ON system_logs(user_address);
CREATE INDEX idx_system_logs_time ON system_logs(created_at DESC);

-- 7. 用户信息（扩展 wallets）
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  status VARCHAR(20) DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  referral_code VARCHAR(20) UNIQUE,
  referred_by VARCHAR(42),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_referral ON users(referral_code);
