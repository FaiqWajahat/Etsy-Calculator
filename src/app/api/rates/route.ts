import { NextResponse } from 'next/server';
import { fetchLiveExchangeRates } from '@/lib/currency';

export async function GET() {
  try {
    const rates = await fetchLiveExchangeRates();
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      base: 'USD',
      rates,
    });
  } catch (error) {
    console.error('Error fetching rates:', error);
    return NextResponse.json(
      { success: false, error: 'Could not fetch exchange rates' },
      { status: 500 }
    );
  }
}
