import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdminAuth } from '@/lib/api-security';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const model = "gemini-2.5-flash";

// Extend Vercel timeout to 60 seconds (AI processing takes time)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    // 1. Check if feature has already been used
    const restaurantRef = adminDb.collection('restaurants').doc(restaurantId);
    const restaurantDoc = await restaurantRef.get();
    
    if (!restaurantDoc.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const restaurantData = restaurantDoc.data();
    if (restaurantData?.hasUsedMenuImport) {
      return NextResponse.json({ error: 'Menu import is only available during initial setup' }, { status: 403 });
    }

    // 2. Parse images
    const { images } = await request.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // 3. Build image parts (camelCase format)
    const imageParts = images.map((img: string) => {
      const base64Data = img.includes(',') ? img.split(',')[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      };
    });

    // 4. Call Gemini 2.5 Flash — mandatory, no fallbacks
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: `Extract all menu items from these images. Return a JSON object with an "items" array. Each item has "name" (string), "price" (number), and "category" (string). If category is unclear use "kitchen". Prices must be numbers only. Do not hallucinate.` },
            ...imageParts
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 16384,
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[MenuImport] ${model} error:`, errBody);
      return NextResponse.json({ error: `AI Error: ${errBody.substring(0, 300)}` }, { status: response.status });
    }

    const aiData = await response.json();
    const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      // Check for safety or other finish reasons
      const finishReason = aiData.candidates?.[0]?.finishReason;
      return NextResponse.json({ error: `AI returned empty. Reason: ${finishReason || 'unknown'}` }, { status: 500 });
    }

    // 5. Parse JSON with safety
    try {
      let cleanJson = responseText
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}');

      const parsed = JSON.parse(cleanJson);
      const items = parsed.items || [];
      const validatedItems = items
        .filter((item: any) => item.name && (typeof item.price === 'number' || !isNaN(Number(item.price))))
        .map((item: any) => ({
          name: String(item.name).trim(),
          price: Number(item.price),
          category: String(item.category || 'kitchen').trim()
        }));

      return NextResponse.json({ success: true, items: validatedItems });
    } catch (parseErr: any) {
      console.error('[MenuImport] JSON parse failed. Raw:', responseText.substring(0, 500));
      return NextResponse.json({ error: `JSON parse error: ${parseErr.message}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[MenuImport] Error:', error);
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 });
  }
}

// PUT: Save confirmed items
export async function PUT(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    const { items } = await request.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const restaurantRef = adminDb.collection('restaurants').doc(restaurantId);
    const batch = adminDb.batch();
    const menuCollection = adminDb.collection('menus');

    items.forEach((item: any) => {
      const docRef = menuCollection.doc();
      batch.set(docRef, {
        name: item.name,
        price: item.price,
        category: item.category || 'kitchen',
        restaurantId,
        createdAt: new Date(),
        image: null
      });
    });

    batch.update(restaurantRef, { hasUsedMenuImport: true });
    await batch.commit();

    return NextResponse.json({ success: true, message: `${items.length} items imported successfully` });

  } catch (error: any) {
    console.error('[MenuSaveImport] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
