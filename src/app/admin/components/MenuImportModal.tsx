import { useState, useRef, ChangeEvent } from 'react';
import { X, Upload, Wand2, Save, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { adminFetch } from '@/lib/api-client';

interface MenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExtractedItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export default function MenuImportModal({ isOpen, onClose, onSuccess }: MenuImportModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to max 800px and 60% JPEG quality
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
            else { w = Math.round(w * maxSize / h); h = maxSize; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 6) {
      alert("Maximum 6 images allowed");
      return;
    }

    for (const file of files) {
      const compressed = await compressImage(file);
      setImages(prev => [...prev, compressed]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const response = await adminFetch('/api/menu/import-from-images', {
        method: 'POST',
        body: JSON.stringify({ images })
      });
      const data = await response.json();
      if (data.success) {
        setExtractedItems(data.items.map((item: any, idx: number) => ({
          ...item,
          id: `extracted-${idx}-${Date.now()}`
        })));
      } else {
        alert(data.error || "Failed to process images");
      }
    } catch (error) {
      console.error("Processing error:", error);
      alert("An error occurred during processing");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItem = (id: string, field: keyof ExtractedItem, value: any) => {
    setExtractedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: field === 'price' ? (parseFloat(value) || 0) : value };
    }));
  };

  const removeItem = (id: string) => {
    setExtractedItems(prev => prev.filter(item => item.id !== id));
  };

  const saveItems = async () => {
    if (extractedItems.length === 0) return;
    setIsSaving(true);
    try {
      const response = await adminFetch('/api/menu/import-from-images', {
        method: 'PUT',
        body: JSON.stringify({ items: extractedItems })
      });
      const data = await response.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || "Failed to save items");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-primary-text">AI Menu Import</h2>
            <p className="text-xs text-secondary-text mt-1">Upload images of your menu to instantly create items</p>
          </div>
          <button onClick={onClose} className="text-secondary-text hover:text-primary-text transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {extractedItems.length === 0 ? (
            <div className="space-y-6">
              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                    <img src={img} className="w-full h-full object-cover" alt={`Menu preview ${idx + 1}`} />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-accent/50 hover:bg-accent/5 transition-all text-secondary-text hover:text-accent"
                  >
                    <Upload size={24} />
                    <span className="text-xs font-bold uppercase tracking-wider">Add Image</span>
                  </button>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-blue-400 shrink-0" size={20} />
                <p className="text-xs text-blue-200 leading-relaxed">
                  <strong>Pro Tip:</strong> Take clear photos of your menu sections. Make sure text is readable.
                  You can upload up to 6 images (one for each page/section).
                </p>
              </div>

              <button
                onClick={processImages}
                disabled={images.length === 0 || isProcessing}
                className="w-full bg-accent hover:bg-emerald-400 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing Menu...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Generate Menu Items
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-secondary-text uppercase tracking-widest">Verify Extracted Items</h3>
                <span className="text-xs text-accent font-bold">{extractedItems.length} items found</span>
              </div>

              <div className="space-y-3">
                {extractedItems.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center group">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-primary-text font-bold focus:outline-none focus:ring-0 placeholder:text-white/20"
                        placeholder="Item Name"
                      />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-accent font-black focus:border-accent outline-none transition-all"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-secondary-text focus:border-accent outline-none transition-all"
                          placeholder="Category"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-red-500/40 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-card pb-4">
                <button
                  onClick={() => setExtractedItems([])}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-secondary-text font-bold py-4 rounded-xl transition-all"
                >
                  Back to Upload
                </button>
                <button
                  onClick={saveItems}
                  disabled={isSaving}
                  className="flex-[2] bg-accent hover:bg-emerald-400 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-accent/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Saving to Menu...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Confirm & Save Menu
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
