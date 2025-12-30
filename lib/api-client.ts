const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: this.getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data.data;
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<{ token: string; admin: any }>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', data.token);
    }
    
    return data;
  }

  async getMe() {
    return this.request<{ admin: any }>('/api/admin/auth/me');
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  // Nodes
  async getNodesStats() {
    return this.request<{ total: number; active: number }>('/api/admin/nodes/stats');
  }

  async getNodes(page = 1, limit = 20) {
    return this.request<any>(`/api/admin/nodes?page=${page}&limit=${limit}`);
  }

  async getNode(id: string) {
    return this.request<any>(`/api/admin/nodes/${id}`);
  }

  // Wallets
  async getWallets(page = 1, limit = 20) {
    return this.request<any>(`/api/admin/wallets?page=${page}&limit=${limit}`);
  }

  async getWallet(address: string) {
    return this.request<any>(`/api/admin/wallets/${address}`);
  }

  async banWallet(address: string, reason: string) {
    return this.request<any>(`/api/admin/wallets/${address}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Withdrawals
  async getWithdrawals() {
    return this.request<any>('/api/admin/withdrawals');
  }

  async approveWithdrawal(id: string) {
    return this.request<any>(`/api/admin/withdrawals/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectWithdrawal(id: string, reason: string) {
    return this.request<any>(`/api/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Orders
  async getOrders() {
    return this.request<any>('/api/orders');
  }
}

export const api = new ApiClient();
