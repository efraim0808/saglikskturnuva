import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Camera, Upload, X, ChevronLeft, ChevronRight, Trash2, ImageIcon, Loader2, Tag } from 'lucide-react';
import { cn, compressImage } from '../lib/utils';

const DEFAULT_CATEGORIES = ['Genel', 'Sosyal', '1. Hafta', '2. Hafta', '3. Hafta', 'Final Maçı', 'Ödül Töreni'];

export function Gallery() {
  const { galleryItems, isSuperAdmin, isScorekeeper, addGalleryItem, deleteGalleryItem } = useApp();

  const canUpload = isSuperAdmin || isScorekeeper;
  const canDelete = isSuperAdmin;

  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedData, setCompressedData] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Genel');
  const [customCategory, setCustomCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allCategories = Array.from(new Set(galleryItems.map(g => g.category)));
  const existingCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...allCategories]));

  const filtered = activeCategory === 'Tümü'
    ? galleryItems
    : galleryItems.filter(g => g.category === activeCategory);

  const filterCategories = ['Tümü', ...Array.from(new Set(galleryItems.map(g => g.category)))];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setCompressedData(compressed);
      setPreview(compressed);
    } catch {
      alert('Görsel işlenirken hata oluştu.');
    } finally {
      setCompressing(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!compressedData) return;
    const finalCategory = category === '__custom__' ? customCategory.trim() || 'Genel' : category;
    setUploading(true);
    try {
      await addGalleryItem(compressedData, caption, finalCategory);
      resetModal();
    } catch {
      alert('Yükleme sırasında hata oluştu.');
    } finally {
      setUploading(false);
    }
  }

  function resetModal() {
    setUploadOpen(false);
    setPreview(null);
    setCompressedData(null);
    setCaption('');
    setCategory('Genel');
    setCustomCategory('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, filtered.length - 1) : null);
    if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null);
    if (e.key === 'Escape') setLightboxIndex(null);
  }, [lightboxIndex, filtered.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const lightboxItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fotoğraf Galerisi</h1>
          <p className="text-slate-500">{galleryItems.length} fotoğraf</p>
        </div>
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Fotoğraf Yükle
          </Button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filterCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
            )}
          >
            {cat !== 'Tümü' && <Tag className="w-3 h-3" />}
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {filtered.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="break-inside-avoid group relative rounded-xl overflow-hidden bg-slate-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              onClick={() => setLightboxIndex(idx)}
            >
              <img
                src={item.image_url}
                alt={item.caption || ''}
                className="w-full object-cover block"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {item.caption && (
                  <p className="text-white text-sm font-medium leading-snug line-clamp-2">{item.caption}</p>
                )}
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-white/75">
                  <Tag className="w-3 h-3" />{item.category}
                </span>
              </div>
              {/* Delete button */}
              {canDelete && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
                      deleteGalleryItem(item.id);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <ImageIcon className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">Henüz fotoğraf yok</p>
          {canUpload && (
            <p className="text-sm mt-1">Yukarıdaki butonu kullanarak ilk fotoğrafı ekleyin.</p>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          {lightboxIndex! > 0 && (
            <button
              className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i - 1 : null); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next */}
          {lightboxIndex! < filtered.length - 1 && (
            <button
              className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i + 1 : null); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3 px-16"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightboxItem.image_url}
              alt={lightboxItem.caption || ''}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            {(lightboxItem.caption || lightboxItem.category) && (
              <div className="text-center">
                {lightboxItem.caption && (
                  <p className="text-white font-medium">{lightboxItem.caption}</p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-white/60 mt-0.5">
                  <Tag className="w-3 h-3" />{lightboxItem.category}
                </span>
              </div>
            )}
            <p className="text-white/40 text-xs">
              {lightboxIndex! + 1} / {filtered.length} &nbsp;&middot;&nbsp; Ok tuşlarıyla gezin
            </p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-emerald-700" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Fotoğraf Yükle</h2>
              </div>
              <button onClick={resetModal} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-5">
              {/* File picker */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Fotoğraf Seç</label>
                <div
                  className={cn(
                    'relative rounded-xl border-2 border-dashed transition-colors overflow-hidden',
                    preview ? 'border-emerald-300' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="Önizleme" className="w-full max-h-52 object-contain bg-slate-50" />
                      <button
                        type="button"
                        onClick={() => { setPreview(null); setCompressedData(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white shadow text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/80 text-white text-xs py-1 px-3 text-center">
                        Otomatik sıkıştırma uygulandı (maks. 1200px, %70 kalite)
                      </div>
                    </div>
                  ) : compressing ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm">Sıkıştırılıyor...</span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-10 cursor-pointer gap-2">
                      <Upload className="w-8 h-8 text-slate-300" />
                      <span className="text-sm text-slate-500">Fotoğraf seçmek için tıklayın</span>
                      <span className="text-xs text-slate-400">JPG, PNG, WebP — otomatik sıkıştırılır</span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                {!preview && !compressing && (
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} id="gallery-file-hidden" />
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Açıklama (İsteğe bağlı)</label>
                <Input
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Maçın en kritik anı..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {existingCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom__">+ Yeni kategori yaz...</option>
                </select>
                {category === '__custom__' && (
                  <Input
                    className="mt-2"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Kategori adı (örn: Çeyrek Final)"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!compressedData || uploading}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yükleniyor...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Yükle</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetModal} className="flex-1">
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
