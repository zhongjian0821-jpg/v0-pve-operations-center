# 灵瀚云数据存储系统

## 📊 数据库表结构

### 1. linghan_devices (设备详情表)
存储灵瀚云设备的基本信息

**字段说明：**
- `device_id` - 设备ID (唯一，来自灵瀚云API)
- `device_name` - 设备名称/备注
- `node_id` - 关联 blockchain_nodes 表的ID
- `province`, `city`, `isp` - 位置和运营商信息
- `up_bandwidth` - 上行带宽 (Mbps)
- `dev_type` - 设备类型: 1=大节点, 2=盒子
- `status` - 设备状态: 0=离线, 1=在线
- `last_sync_at` - 最后同步时间

**关联关系：**
```
blockchain_nodes (1) ←→ (1) linghan_devices
```

---

### 2. linghan_traffic_history (流量历史表)
存储设备的流量数据历史记录

**字段说明：**
- `device_id` - 设备ID
- `record_date` - 记录日期
- `record_hour` - 记录小时 (0-23, NULL表示全天汇总)
- `total_traffic` - 总流量 (MB)
- `in_traffic` - 入站流量 (MB)
- `out_traffic` - 出站流量 (MB)
- `avg_up_speed` - 平均上行速率 (Mbps)
- `peak_up_speed` - 峰值上行速率 (Mbps)

**用途：**
- 查看历史流量趋势
- 生成流量统计报表
- 分析设备使用情况

---

### 3. linghan_income_history (收益历史表)
存储设备的收益记录

**字段说明：**
- `device_id` - 设备ID
- `income_date` - 收益日期
- `total_income` - 总收益 (元)
- `fine` - 罚款 (元)
- `fine_reason` - 罚款原因
- `flow` - 流量 (GB)
- `bandwidth_95` - 95带宽峰值 (Mbps)
- `status` - 结算状态: 0=待结算, 1=已结算
- `settlement_date` - 结算时间

**用途：**
- 收益历史查询
- 生成收益报表
- 罚款分析

---

### 4. linghan_network_cards (网卡信息表)
存储设备的网卡配置信息

**字段说明：**
- `device_id` - 设备ID
- `card_name` - 网卡名称
- `ip_address` - IP地址
- `gateway` - 网关
- `speed` - 速率
- `status` - 状态: active/inactive
- `last_seen_at` - 最后在线时间

**用途：**
- 网卡配置管理
- 网络故障诊断
- IP地址追踪

---

### 5. linghan_dialing_info (拨号信息表)
存储大节点的拨号信息

**字段说明：**
- `device_id` - 设备ID
- `card_name` - 网卡名称
- `line_count` - 总线路数
- `have_dial_count` - 已拨号数
- `connect_count` - 已连接数
- `speed` - 速率 (Mbps)
- `line_list` - 线路详细列表 (JSON)

**用途：**
- 大节点拨号管理
- 线路状态监控
- 连接质量分析

**注意：** 仅适用于 dev_type=1 的大节点

---

### 6. linghan_sync_logs (同步日志表)
记录数据同步的日志

**字段说明：**
- `device_id` - 设备ID (NULL表示批量同步)
- `sync_type` - 同步类型: devices/traffic/income/network/dialing
- `sync_status` - 同步状态: success/failed/partial
- `records_synced` - 同步成功记录数
- `records_failed` - 同步失败记录数
- `error_message` - 错误信息
- `duration_seconds` - 耗时 (秒)

**用途：**
- 同步状态监控
- 错误诊断
- 性能分析

---

## 🚀 API 端点

### 1. 初始化数据表
```
POST /api/admin/linghan/init
```

**响应：**
```json
{
  "success": true,
  "message": "灵瀚云数据表初始化成功",
  "tables": [
    "linghan_devices",
    "linghan_traffic_history",
    "linghan_income_history",
    "linghan_network_cards",
    "linghan_dialing_info",
    "linghan_sync_logs"
  ]
}
```

### 2. 同步设备数据 (即将实现)
```
POST /api/admin/linghan/sync
Body: {
  "sync_type": "devices|traffic|income|network|dialing|all",
  "device_id": "可选，指定设备"
}
```

### 3. 查询历史数据 (即将实现)
```
GET /api/admin/linghan/traffic?device_id=xxx&start_date=xxx&end_date=xxx
GET /api/admin/linghan/income?device_id=xxx&start_date=xxx&end_date=xxx
```

---

## 📈 数据流向

```
┌──────────────────────┐
│   灵瀚云 API         │
│  (外部数据源)        │
└──────────┬───────────┘
           │
           ├─→ 定时同步任务 (Cron Job)
           │   每小时同步流量
           │   每天同步收益
           │
           ↓
┌──────────────────────┐
│  PVE 数据库         │
│  (6个灵瀚云表)      │
└──────────┬───────────┘
           │
           ├─→ 实时查询
           ├─→ 历史统计
           └─→ 报表生成
```

---

## 💡 使用场景

### 场景1：查看设备历史流量
```sql
SELECT 
  record_date,
  SUM(total_traffic)/1024 as daily_traffic_gb
FROM linghan_traffic_history
WHERE device_id = '4074445e'
  AND record_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY record_date
ORDER BY record_date DESC;
```

### 场景2：统计月度收益
```sql
SELECT 
  device_id,
  COUNT(*) as days,
  SUM(total_income) as total,
  SUM(fine) as total_fine,
  SUM(total_income - fine) as net_income
FROM linghan_income_history
WHERE income_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY device_id;
```

### 场景3：网卡状态监控
```sql
SELECT 
  d.device_name,
  nc.card_name,
  nc.ip_address,
  nc.status,
  nc.last_seen_at
FROM linghan_network_cards nc
JOIN linghan_devices d ON d.device_id = nc.device_id
WHERE nc.status = 'active'
ORDER BY nc.last_seen_at DESC;
```

---

## 🔧 部署步骤

### 1. 初始化数据表
```bash
curl -X POST https://你的域名/api/admin/linghan/init
```

### 2. 导入现有设备
```bash
# 使用现有的批量导入功能
curl -X POST https://你的域名/api/admin/blockchain/import-linghan-devices
```

### 3. 配置定时同步 (可选)
使用 Vercel Cron Jobs 或外部定时任务

---

## 📝 注意事项

1. **外键关联**
   - linghan_devices.node_id → blockchain_nodes.id
   - 删除 blockchain_nodes 记录会级联删除对应的 linghan_devices

2. **数据唯一性**
   - device_id 全局唯一
   - (device_id, record_date, record_hour) 唯一
   - (device_id, income_date) 唯一
   - (device_id, card_name) 唯一

3. **数据类型**
   - 流量单位: MB
   - 收益单位: 元 (CNY)
   - 速率单位: Mbps

4. **时区**
   - 所有 TIMESTAMP 字段使用 UTC
   - 前端显示时需要转换为本地时区

---

## 🎯 下一步计划

- [ ] 实现数据同步API
- [ ] 创建定时同步任务
- [ ] 添加数据查询API
- [ ] 前端页面集成数据库查询
- [ ] 添加数据导出功能
- [ ] 实现收益报表生成

