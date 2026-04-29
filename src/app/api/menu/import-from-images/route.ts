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

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format images for Gemini
    const imageParts = images.map(img => {
      const base64Data = img.split(',')[1] || img;
      return {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
    });

    const prompt = `Extract all menu items from these images. Return ONLY a JSON object with an 'items' array. 
    Each item must have 'name' (string), 'price' (number), and 'category' (string). 
    If category is unclear, use 'kitchen'. Extract prices as numbers only (e.g. 15.50). 
    Do not hallucinate items. Ignore decorative text. Group similar items logically.
    
    JSON format:
    {
      "items": [
        { "name": "Item Name", "price": 10.00, "category": "category name" }
      ]
    }`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Clean JSON response (Gemini sometimes adds markdown blocks)
    const jsonString = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    // 4. Post-processing
    const items = parsed.items || [];
    const validatedItems = items.filter((item: any) => item.name && typeof item.price === 'number');

    return NextResponse.json({ 
      success: true, 
      items: validatedItems 
    });

  } catch (error: any) {
    console.error('[MenuImport Gemini] Error:', error);
    return NextResponse.json({ error: 'Failed to process images with Free AI' }, { status: 500 });
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
