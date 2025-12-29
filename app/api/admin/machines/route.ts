import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const machines = await sql`
      SELECT * FROM machines
      ORDER BY status DESC, last_heartbeat DESC
    `

    return NextResponse.json({
      success: true,
      data: machines
    })
  } catch (error: any) {
    console.error('Get machines error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
