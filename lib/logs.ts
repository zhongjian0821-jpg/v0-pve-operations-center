import { sql } from './db';

export async function logAdminOperation(
  adminId: number,
  action: string,
  targetType: string,
  targetId: string,
  details?: any
) {
  try {
    await sql`
      INSERT INTO operation_logs (admin_id, action, target_type, target_id, details)
      VALUES (${adminId}, ${action}, ${targetType}, ${targetId}, ${JSON.stringify(details || {})})
    `;
  } catch (error) {
    console.error('Failed to log operation:', error);
  }
}
