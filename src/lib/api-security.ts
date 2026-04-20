import { NextResponse } from 'next/server';
import { validateAdminPin } from './admin-utils';

// =============================================================================
// SECURITY MIDDLEWARE — Shared guards for all API routes
// =============================================================================

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

/**
 * Parses and validates the request body with a 1MB size limit.
 * Returns the parsed body or an error response.
 */
export async function parseAndValidateBody(
  request: Request
): Promise<{ data: Record<string, unknown> } | { error: NextResponse }> {
  // 1. Enforce body size limit
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return {
      error: NextResponse.json(
        { error: 'Request body too large. Maximum size is 1MB.' },
        { status: 413 }
      ),
    };
  }

  // 2. Read and parse body safely
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return {
        error: NextResponse.json(
          { error: 'Request body too large. Maximum size is 1MB.' },
          { status: 413 }
        ),
      };
    }
    body = JSON.parse(text);
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Invalid JSON in request body.' },
        { status: 400 }
      ),
    };
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      error: NextResponse.json(
        { error: 'Request body must be a JSON object.' },
        { status: 400 }
      ),
    };
  }

  return { data: body };
}

export async function requireAdminPin(
  body: Record<string, unknown>
): Promise<NextResponse | null> {
  const { pin, restaurantId } = body;

  if (!pin || typeof pin !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid PIN.' },
      { status: 400 }
    );
  }

  // Pass restaurantId to the validator to support multi-tenant PINs
  const isValid = await validateAdminPin(pin, typeof restaurantId === 'string' ? restaurantId : undefined);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid PIN' },
      { status: 401 }
    );
  }

  return null; // PIN is valid
}

/**
 * Validates restaurantId from request body.
 * Returns null if valid, or an error NextResponse to return immediately.
 */
export function requireRestaurantId(
  body: Record<string, unknown>
): NextResponse | null {
  const { restaurantId } = body;

  if (!restaurantId || typeof restaurantId !== 'string' || restaurantId.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing or invalid restaurantId.' },
      { status: 400 }
    );
  }

  // Reject restaurantId that is too long or has suspicious characters
  if (restaurantId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(restaurantId)) {
    return NextResponse.json(
      { error: 'Invalid restaurantId format.' },
      { status: 400 }
    );
  }

  return null; // restaurantId is valid
}

/**
 * Validates a string field exists, is a non-empty string, and is within max length.
 */
export function requireString(
  body: Record<string, unknown>,
  field: string,
  maxLength: number = 500
): NextResponse | null {
  const value = body[field];
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return NextResponse.json(
      { error: `Missing or invalid field: ${field}` },
      { status: 400 }
    );
  }
  if (value.length > maxLength) {
    return NextResponse.json(
      { error: `Field '${field}' exceeds maximum length of ${maxLength} characters.` },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validates that a field is a valid OrderStatus value.
 */
const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'completed'] as const;

export function requireValidStatus(
  body: Record<string, unknown>
): NextResponse | null {
  const { status } = body;
  if (!status || typeof status !== 'string' || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }
  return null;
}
