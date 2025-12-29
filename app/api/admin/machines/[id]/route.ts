import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const machines = await sql`
      SELECT * FROM machines WHERE id = ${id}
    `

    if (machines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Machine not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: machines[0]
    })
  } catch (error: any) {
    console.error('Get machine error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    await sql`
      DELETE FROM machines WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: 'Machine deleted'
    })
  } catch (error: any) {
    console.error('Delete machine error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
