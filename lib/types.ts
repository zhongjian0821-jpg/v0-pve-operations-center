export interface Admin {
  id: number;
  username: string;
  role: string;
}

export interface Wallet {
  id: number;
  wallet_address: string;
  ashva_balance: string;
  total_staked: string;
  total_rewards: string;
  referral_code: string | null;
  referred_by: string | null;
  status: string;
  created_at: string;
}

export interface Node {
  id: number;
  node_id: string;
  wallet_address: string;
  node_type: string;
  status: string;
  total_rewards: string;
  daily_rewards: string;
  last_active: string;
  created_at: string;
}

export interface Withdrawal {
  id: number;
  wallet_address: string;
  amount: string;
  to_address: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface Order {
  id: number;
  wallet_address: string;
  order_type: string;
  amount: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
