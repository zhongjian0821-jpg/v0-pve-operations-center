import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const withdrawals = await sql`
      SELECT * FROM withdrawals WHERE id = ${id}
    `

    if (withdrawals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: withdrawals[0]
    })
  } catch (error: any) {
    console.error('Get withdrawal error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
