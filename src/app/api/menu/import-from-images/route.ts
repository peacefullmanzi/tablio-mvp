import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdminAuth } from '@/lib/api-security';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { images } = await request.json(); // Array of base64 strings
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json({ error: 'Free AI Service not configured' }, { status: 500 });
    }

    // 3. Call Google Gemini API with Fallback Logic
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        
        const imageParts = images.map(img => {
          const base64Data = img.split(',')[1] || img;
          return {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          };
        });

        const promptText = `Extract all menu items from these images. Return ONLY a JSON object with an 'items' array. 
        Each item must have 'name' (string), 'price' (number), and 'category' (string). 
        If category is unclear, use 'kitchen'. Extract prices as numbers only (e.g. 15.50). 
        Do not hallucinate items. Ignore decorative text. Group similar items logically.
        
        JSON format:
        {
          "items": [
            { "name": "Item Name", "price": 10.00, "category": "category name" }
          ]
        }`;

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                ...imageParts
              ]
            }]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          // If 404, try next model
          if (response.status === 404) {
            console.warn(`Model ${modelName} not found, trying next...`);
            lastError = errorData.error?.message || 'Not found';
            continue;
          }
          throw new Error(errorData.error?.message || 'API Error');
        }

        const aiData = await response.json();
        const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
          console.warn(`Model ${modelName} returned empty, trying next...`);
          continue;
        }

        // Robust JSON extraction
        let jsonString = responseText;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonString);
        const items = parsed.items || [];
        const validatedItems = items.filter((item: any) => item.name && typeof item.price === 'number');

        return NextResponse.json({ 
          success: true, 
          items: validatedItems,
          modelUsed: modelName
        });

      } catch (err: any) {
        lastError = err.message;
        console.error(`Error with ${modelName}:`, err);
        continue; // Try next model
      }
    }

    // If we get here, all models failed
    return NextResponse.json({ error: `All AI models failed. Last error: ${lastError}` }, { status: 500 });

  } catch (error: any) {
    console.error('[MenuImport Gemini] General Error:', error);
    return NextResponse.json({ error: `AI Error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

// Separate route for saving confirmed items
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
    
    // Batch write to Firestore
    const batch = adminDb.batch();
    const menuCollection = adminDb.collection('menus');

    items.forEach(item => {
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

    // Update restaurant flag
    batch.update(restaurantRef, { hasUsedMenuImport: true });

    await batch.commit();

    return NextResponse.json({ success: true, message: `${items.length} items imported successfully` });

  } catch (error: any) {
    console.error('[MenuSaveImport] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
