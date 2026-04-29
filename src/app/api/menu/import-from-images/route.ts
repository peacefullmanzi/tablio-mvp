import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdminAuth } from '@/lib/api-security';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

    // 2. Parse images from request
    const { images } = await request.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured in Vercel' }, { status: 500 });
    }

    // 3. Build image parts using EXACT Google camelCase format
    const imageParts = images.map((img: string) => {
      const base64Data = img.includes(',') ? img.split(',')[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      };
    });

    const promptText = `Extract all menu items from these images. Return a JSON object with an "items" array. Each item has "name" (string), "price" (number), and "category" (string). If category is unclear use "kitchen". Prices must be numbers only. Do not hallucinate.`;

    // 4. Try models in order of preference
    const modelsToTry = [
      { name: "gemini-2.5-flash", apiVersion: "v1beta" },
      { name: "gemini-2.0-flash", apiVersion: "v1beta" },
      { name: "gemini-2.0-flash-lite", apiVersion: "v1beta" },
      { name: "gemini-1.5-flash", apiVersion: "v1" },
      { name: "gemini-1.5-flash", apiVersion: "v1beta" },
    ];
    
    const errors: string[] = [];

    for (const model of modelsToTry) {
      try {
        console.log(`[MenuImport] Trying ${model.name} via ${model.apiVersion}...`);
        
        const url = `https://generativelanguage.googleapis.com/${model.apiVersion}/models/${model.name}:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: promptText },
                ...imageParts
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          const errMsg = `${model.name}(${model.apiVersion}): ${response.status} - ${errBody.substring(0, 200)}`;
          console.warn(`[MenuImport] Failed:`, errMsg);
          errors.push(errMsg);
          continue;
        }

        const aiData = await response.json();
        const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
          errors.push(`${model.name}: empty response`);
          continue;
        }

        console.log(`[MenuImport] Success with ${model.name}! Parsing response...`);

        // Robust JSON extraction and cleaning
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          errors.push(`${model.name}: no JSON found in response`);
          continue;
        }

        // Clean common AI JSON issues: trailing commas, comments
        let cleanJson = jsonMatch[0]
          .replace(/,\s*]/g, ']')     // trailing comma before ]
          .replace(/,\s*}/g, '}')     // trailing comma before }
          .replace(/\/\/.*$/gm, '')   // single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, ''); // multi-line comments

        const parsed = JSON.parse(cleanJson);
        const items = parsed.items || [];
        const validatedItems = items
          .filter((item: any) => item.name && (typeof item.price === 'number' || !isNaN(Number(item.price))))
          .map((item: any) => ({
            name: String(item.name).trim(),
            price: Number(item.price),
            category: String(item.category || 'kitchen').trim()
          }));

        return NextResponse.json({ 
          success: true, 
          items: validatedItems,
          modelUsed: model.name
        });

      } catch (err: any) {
        errors.push(`${model.name}: ${err.message}`);
        continue;
      }
    }

    // All models failed - return detailed error
    return NextResponse.json({ 
      error: `All AI models failed. Details: ${errors.join(' | ')}` 
    }, { status: 500 });

  } catch (error: any) {
    console.error('[MenuImport] Fatal Error:', error);
    return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
  }
}

// PUT: Save confirmed items to Firestore
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
