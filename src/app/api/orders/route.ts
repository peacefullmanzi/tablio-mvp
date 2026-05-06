import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseAndValidateBody, requireRestaurantId } from '@/lib/api-security';
import { FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

/**
 * POST /api/orders — Server-side order creation
 * 
 * SECURITY: Prices are fetched from the database, NOT trusted from the client.
 * The client sends item IDs + quantities. The server looks up real prices.
 *
 * Body: {
 *   restaurantId: string,
 *   table_number: string,
 *   items: [{ id: string, quantity: number }]
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Parse body with size limit (1MB)
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 2. Validate restaurantId
    const restaurantError = requireRestaurantId(body);
    if (restaurantError) return restaurantError;
    const restaurantId = body.restaurantId as string;

    // 3. Validate table_number
    const tableNumber = body.table_number;
    if (!tableNumber || typeof tableNumber !== 'string' || tableNumber.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or invalid table_number.' }, { status: 400 });
    }
    if (tableNumber.length > 20) {
      return NextResponse.json({ error: 'table_number is too long.' }, { status: 400 });
    }

    // 4. Validate items array
    const clientItems = body.items;
    if (!Array.isArray(clientItems) || clientItems.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item.' }, { status: 400 });
    }
    if (clientItems.length > 50) {
      return NextResponse.json({ error: 'Order cannot exceed 50 items.' }, { status: 400 });
    }

    // 5. Validate each item has required fields
    for (const item of clientItems) {
      if (!item || typeof item !== 'object') {
        return NextResponse.json({ error: 'Invalid item in order.' }, { status: 400 });
      }
      if (!item.id || typeof item.id !== 'string') {
        return NextResponse.json({ error: 'Each item must have a valid id.' }, { status: 400 });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: `Invalid quantity for item ${item.id}. Must be an integer between 1 and 100.` }, { status: 400 });
      }
    }

    // 6. CRITICAL: Fetch real prices from database — NEVER trust client prices
    const itemIds = clientItems.map((item: { id: string }) => item.id);
    const menuDocs = await Promise.all(
      itemIds.map((id: string) => adminDb.collection('menus').doc(id).get())
    );

    const verifiedItems: { id: string; name: string; price: number; quantity: number; category?: string }[] = [];
    let serverTotal = 0;

    for (let i = 0; i < clientItems.length; i++) {
      const doc = menuDocs[i];
      const clientItem = clientItems[i] as { id: string; quantity: number };

      if (!doc.exists) {
        return NextResponse.json(
          { error: `Menu item not found: ${clientItem.id}` },
          { status: 400 }
        );
      }

      const menuData = doc.data()!;

      // Verify item belongs to this restaurant
      if (menuData.restaurantId !== restaurantId) {
        return NextResponse.json(
          { error: `Menu item does not belong to this restaurant: ${clientItem.id}` },
          { status: 403 }
        );
      }

      const realPrice = menuData.price;
      if (typeof realPrice !== 'number' || realPrice < 0) {
        return NextResponse.json(
          { error: `Invalid price for menu item: ${clientItem.id}` },
          { status: 500 }
        );
      }

      verifiedItems.push({
        id: clientItem.id,
        name: menuData.name,
        price: realPrice,
        category: menuData.category || 'kitchen',
        quantity: clientItem.quantity,
      });

      serverTotal += realPrice * clientItem.quantity;
    }

    // 7. Create the order with SERVER-calculated prices
    const orderData = {
      restaurantId,
      items: verifiedItems,
      total: serverTotal,
      table_number: tableNumber.trim(),
      status: 'pending' as const,
      created_at: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('orders').add(orderData);

    // 8. Send push notifications to all registered admin devices (fire-and-forget)
    try {
      const tokensSnapshot = await adminDb
        .collection('restaurants').doc(restaurantId)
        .collection('fcmTokens').get();

      if (!tokensSnapshot.empty) {
        const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
        if (tokens.length > 0) {
          const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
              title: `⚡ New Order — Table ${tableNumber.trim()}`,
              body: `${verifiedItems.length} item${verifiedItems.length > 1 ? 's' : ''} • ${serverTotal.toLocaleString()} total`,
            },
            webpush: {
              headers: {
                Urgency: 'high',
              },
              fcmOptions: { link: '/admin' },
              notification: {
                icon: '/logo.svg',
                tag: 'new-order',
                requireInteraction: true, // Keeps notification on screen until user acts
              }
            },
            android: {
              priority: 'high',
            },
          };
          admin.messaging().sendEachForMulticast(message).catch(e => console.warn('[FCM] Send error:', e));
        }
      }
    } catch (fcmErr) {
      console.warn('[FCM] Push notification skipped:', fcmErr);
    }

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
      total: serverTotal,
      message: 'Order placed successfully',
    });
  } catch (error: unknown) {
    console.error('[PlaceOrder] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to place order', details: errorMessage },
      { status: 500 }
    );
  }
}
