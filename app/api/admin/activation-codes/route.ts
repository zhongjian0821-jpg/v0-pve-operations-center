import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = 4
  const segmentLength = 4
  
  let code = ''
  for (let i = 0; i < segments; i++) {
    if (i > 0) code += '-'
    for (let j = 0; j < segmentLength; j++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  
  return code
}

export async function GET() {
  try {
    const codes = await sql`
      SELECT * FROM activation_codes
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      data: codes
    })
  } catch (error: any) {
    console.error('Get activation codes error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, blockchain } = body

    if (!wallet_address || !blockchain) {
      return NextResponse.json(
        { success: false, error: 'wallet_address and blockchain are required' },
        { status: 400 }
      )
    }

    const code = generateCode()

    await sql`
      INSERT INTO activation_codes (code, wallet_address, blockchain)
      VALUES (${code}, ${wallet_address}, ${blockchain})
    `

    return NextResponse.json({
      success: true,
      code: code,
      message: 'Activation code generated'
    })
  } catch (error: any) {
    console.error('Generate activation code error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
