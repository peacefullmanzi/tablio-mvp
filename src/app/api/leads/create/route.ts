import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Simple in-memory rate limiter (per IP, 5 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

function sanitize(str: string): string {
  return str.trim().replace(/[<>]/g, '').slice(0, 200);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, businessType } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    // Sanitize inputs
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email).toLowerCase();
    const cleanBusiness = sanitize(businessType || 'restaurant');

    // Check for duplicate email
    const existing = await adminDb.collection('leads').where('email', '==', cleanEmail).limit(1).get();
    if (!existing.empty) {
      // Still return success to avoid leaking info, but don't create duplicate
      return NextResponse.json({ success: true, message: 'You\'re on the list!' });
    }

    // Save to Firestore
    await adminDb.collection('leads').add({
      name: cleanName,
      email: cleanEmail,
      businessType: cleanBusiness,
      createdAt: new Date(),
      source: 'landing_page',
    });

    return NextResponse.json({ success: true, message: 'You\'re on the list!' });

  } catch (error: any) {
    console.error('[Leads] Error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
