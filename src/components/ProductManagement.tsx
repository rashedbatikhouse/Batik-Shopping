import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  Image as ImageIcon,
  Save,
  Package,
  Upload,
  Camera,
  Smartphone,
  Check,
} from 'lucide-react';
import { Product, ProductStatus } from '../types/index.ts';

interface ProductManagementProps {
  products: Product[];
  onRefresh: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uploaded images list (file URLs)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [waLiveUploadedNotice, setWaLiveUploadedNotice] = useState<string | null>(null);

  // Form states (matching 10 steps in PRD Section 7)
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    price: 0,
    discount_price: 0,
    colors: '',
    stock: 0,
    size: '',
    fabric: '',
    kameez_length: '',
    salwar_length: '',
    orna_length: '',
    description: '',
    delivery_info: 'সারা দেশে ক্যাশ অন হোম ডেলিভারি। ডেলিভারির সময় দেখে নেওয়ার সুযোগ আছে।',
    status: 'active' as ProductStatus,
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_id.toLowerCase().includes(search.toLowerCase()) ||
      p.fabric.toLowerCase().includes(search.toLowerCase()) ||
      p.colors.some((c) => c.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setUploadedImages([]);
    setWaLiveUploadedNotice(null);
    setFormData({
      product_id: `GS-BTK-${products.length + 1 < 10 ? '0' + (products.length + 1) : products.length + 1}`,
      product_name: '',
      price: 0,
      discount_price: 0,
      colors: '',
      stock: 10,
      size: '',
      fabric: '',
      kameez_length: '',
      salwar_length: '',
      orna_length: '',
      description: '',
      delivery_info: 'সারা দেশে ক্যাশ অন হোম ডেলিভারি। ডেলিভারির সময় দেখে নেওয়ার সুযোগ আছে।',
      status: 'active',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setUploadedImages(p.images?.map((img) => img.image_url) || []);
    setWaLiveUploadedNotice(null);
    setFormData({
      product_id: p.product_id,
      product_name: p.product_name,
      price: p.price,
      discount_price: p.discount_price || 0,
      colors: p.colors.join(', '),
      stock: p.stock,
      size: p.size,
      fabric: p.fabric,
      kameez_length: p.kameez_length || '',
      salwar_length: p.salwar_length || '',
      orna_length: p.orna_length || '',
      description: p.description,
      delivery_info: p.delivery_info,
      status: p.status,
    });
    setError(null);
    setIsModalOpen(true);
  };

  // Handle direct file upload from device and immediately upload to WhatsApp Group 1
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);
    setWaLiveUploadedNotice(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string;
          try {
            // Upload to server and simultaneously broadcast to WhatsApp Community Product Group 1
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dataUrl,
                filename: file.name,
                productId: formData.product_id,
                productName: formData.product_name,
                broadcastToWhatsApp: true,
              }),
            });

            if (res.ok) {
              const resData = await res.json();
              setUploadedImages((prev) => [...prev, resData.url]);
              if (resData.whatsappSynced) {
                setWaLiveUploadedNotice('✅ ছবি আপলোড সফল এবং সাথে সাথে WhatsApp Group 1 (Product Management)-এ লাইভ পোস্ট হয়েছে!');
              }
            } else {
              setUploadedImages((prev) => [...prev, dataUrl]);
            }
          } catch (err) {
            setUploadedImages((prev) => [...prev, dataUrl]);
          } finally {
            resolve();
          }
        };
        reader.readAsDataURL(file);
      });
    }

    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (uploadedImages.length === 0) {
      setError('ধাপ ২: অনুগ্রহ করে অন্তত একটি প্রোডাক্টের ছবি আপলোড করুন।');
      setLoading(false);
      return;
    }

    const colorsArray = formData.colors
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const imagesArray = uploadedImages.map((url, idx) => ({
      id: 'img-' + Date.now() + '-' + idx,
      product_id: editingProduct?.id || 'new',
      image_url: url,
      is_primary: idx === 0,
      display_order: idx + 1,
    }));

    const payload = {
      product_id: formData.product_id,
      product_name: formData.product_name,
      price: Number(formData.price),
      discount_price: formData.discount_price ? Number(formData.discount_price) : null,
      colors: colorsArray,
      stock: Number(formData.stock),
      size: formData.size,
      fabric: formData.fabric,
      kameez_length: formData.kameez_length,
      salwar_length: formData.salwar_length,
      orna_length: formData.orna_length,
      description: formData.description,
      delivery_info: formData.delivery_info,
      status: Number(formData.stock) <= 0 ? 'out_of_stock' : formData.status,
      images: imagesArray,
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update product');
        setSuccessToast(`প্রোডাক্ট "${formData.product_name}" সফলভাবে আপডেট হয়েছে!`);
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create product');
        setSuccessToast(`প্রোডাক্ট "${formData.product_name}" ছবিসহ সফলভাবে সংরক্ষিত হয়েছে এবং WhatsApp গ্রুপ ১ (Product Management Group)-এ আপলোড করা হয়েছে!`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await fetch(`/api/products/${id}/toggle`, { method: 'PATCH' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি "${name}" প্রোডাক্টটি ডিলিট করতে চান?`)) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleQuickStockChange = async (id: string, currentStock: number, delta: number) => {
    const next = Math.max(0, currentStock + delta);
    try {
      await fetch(`/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: next }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>বাটিক প্রোডাক্ট ক্যাটালগ ও ইনভেন্টরি</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            AI Sales Agent সবসময় এখান থেকেই প্রোডাক্টের সঠিক স্টক, মূল্য ও কালার তথ্য কাস্টমারকে সরবরাহ করে।
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বাটিক যুক্ত করুন</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="প্রোডাক্ট নাম, কোড (GS-BTK-01), কাপড় বা কালার দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="active">🟢 Active</option>
            <option value="out_of_stock">🔴 Out of Stock</option>
            <option value="inactive">⚪ Inactive</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            আপনার ডাটাবেজ বর্তমানে সম্পূর্ণ খালি ও ফ্রেশ। আপনি "নতুন বাটিক যুক্ত করুন" বাটনে ক্লিক করে সরাসরি প্রোডাক্ট ক্যাটালগ শুরু করতে পারেন।
          </p>
          <button
            onClick={openAddModal}
            className="mt-5 inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বাটিক প্রোডাক্ট যুক্ত করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((p) => {
          const effectivePrice = p.discount_price ?? p.price;
          const hasDiscount = p.discount_price && p.discount_price < p.price;

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Image and Badges */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={p.images[0]?.image_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'}
                    alt={p.product_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {p.product_id}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md">
                        ডিসকাউন্ট ৳{p.price - p.discount_price!}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleStatus(p.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer shadow-xs ${
                        p.status === 'active'
                          ? 'bg-emerald-600 text-white'
                          : p.status === 'out_of_stock'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {p.status === 'active' ? '🟢 Active' : p.status === 'out_of_stock' ? '🔴 Stock Out' : '⚪ Inactive'}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                    {p.product_name}
                  </h3>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-base font-extrabold text-slate-900">৳{effectivePrice}</span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through">৳{p.price}</span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>
                      <strong className="text-slate-700">কাপড়:</strong> {p.fabric}
                    </p>
                    <p>
                      <strong className="text-slate-700">সাইজ:</strong> {p.size}
                      {p.kameez_length ? ` | কামিজ: ${p.kameez_length}` : ''}
                    </p>
                    <p>
                      <strong className="text-slate-700">ওড়না:</strong> {p.orna_length}
                    </p>
                  </div>

                  {/* Colors */}
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">কালার সমূহ:</span>
                    <div className="flex flex-wrap gap-1">
                      {p.colors.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Stock Adjuster & Actions */}
              <div className="p-4 pt-0 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="text-slate-500 font-medium">ইনভেন্টরি স্টক:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuickStockChange(p.id, p.stock, -1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-900 px-1">{p.stock} পিস</span>
                    <button
                      onClick={() => handleQuickStockChange(p.id, p.stock, 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => openEditModal(p)}
                    className="inline-flex items-center space-x-1 text-slate-600 hover:text-amber-600 font-semibold cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>এডিট</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.product_name)}
                    className="inline-flex items-center space-x-1 text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ডিলিট</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* 10-Step Add / Edit Modal (PRD Section 7) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingProduct ? 'প্রোডাক্ট এডিট করুন' : 'নতুন বাটিক প্রোডাক্ট যুক্ত করুন (১০ ধাপ)'}
                </h3>
                <p className="text-xs text-slate-500">PRD সেকশন ৭ অনুযায়ী ধাপে ধাপে তথ্য ইনপুট দিন</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Step 1: Product Name & Code */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ১: প্রোডাক্টের নাম ও কোড (Product Name &amp; Code) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="GS-BTK-01"
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      required
                      className="col-span-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="যেমন: প্রিমিয়াম সুতি হাতের কাজ বাটিক থ্রি-পিস"
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      required
                      className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Step 2: Direct Image Upload & WhatsApp Auto-Upload Notice */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ধাপ ২: প্রোডাক্টের ছবি সরাসরি আপলোড করুন (Direct Image Upload) *
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <Smartphone className="w-3 h-3 text-emerald-600" />
                      <span>হোয়াটসঅ্যাপ গ্রুপ ১-এ সরাসরি পোস্ট হবে</span>
                    </span>
                  </div>

                  {/* Hidden native file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFilesSelected}
                    className="hidden"
                  />

                  {/* Modern Upload Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-colors shadow-xs">
                      {uploadingImage ? (
                        <div className="w-5 h-5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {uploadingImage ? 'ছবি আপলোড ও প্রসেসিং হচ্ছে...' : 'ছবি আপলোড করতে ক্লিক করুন অথবা ফাইল ড্র্যাগ করুন'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        মোবাইল ক্যামেরা বা কম্পিউটার থেকে JPG, PNG, WEBP ছবি নির্বাচন করুন (এক বা একাধিক)
                      </p>
                    </div>
                  </div>

                  {/* Uploaded Thumbnails Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        আপলোডকৃত ছবি ({uploadedImages.length} টি):
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {uploadedImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100 group shadow-xs"
                          >
                            <img
                              src={imgUrl}
                              alt={`Upload ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded shadow">
                                প্রধান ছবি
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(idx);
                              }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs opacity-90 hover:opacity-100 shadow-md cursor-pointer transition-transform hover:scale-110"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live WhatsApp upload notification */}
                  {waLiveUploadedNotice && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">{waLiveUploadedNotice}</span>
                    </div>
                  )}
                </div>

                {/* Step 3: Regular Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ৩: রেগুলার মূল্য (Regular Price) ৳ *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                {/* Step 4: Discount Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ৪: ডিসকাউন্ট মূল্য (Discount Price) ৳ (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: Number(e.target.value) })}
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Step 5: Available Colors */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ৫: অ্যাভেইলেবল কালার (কমা দিয়ে লিখুন) *
                  </label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    required
                    placeholder="নীল, লাল, কালো, সবুজ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Step 6: Stock Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ৬: স্টক পরিমাণ (Stock Quantity) *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    required
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                {/* Step 7: Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ৭: সাইজ (Size) *
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    required
                    placeholder="ফ্রি সাইজ (আনস্টিচড)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Step 8: Fabric */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ৮: ফেব্রিক / কাপড় (Fabric) *
                  </label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    required
                    placeholder="১০০% পিওর কটন বাটিক"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Step 9: Measurements & Details */}
                <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">কামিজের বহর/দৈর্ঘ্য</label>
                    <input
                      type="text"
                      value={formData.kameez_length}
                      onChange={(e) => setFormData({ ...formData, kameez_length: e.target.value })}
                      placeholder="৪৮ ইঞ্চি"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">সেলোয়ারের কাপড়</label>
                    <input
                      type="text"
                      value={formData.salwar_length}
                      onChange={(e) => setFormData({ ...formData, salwar_length: e.target.value })}
                      placeholder="৪২ ইঞ্চি (২.৫ গজ)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">ওড়নার মাপ</label>
                    <input
                      type="text"
                      value={formData.orna_length}
                      onChange={(e) => setFormData({ ...formData, orna_length: e.target.value })}
                      placeholder="৫ হাত সুতি ওড়না"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Step 9.2: Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ৯: প্রোডাক্ট বিস্তারিত বিবরণ (Description) *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Step 10: Delivery Info */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধাপ ১০: ডেলিভারি তথ্য (Delivery Info) *
                  </label>
                  <input
                    type="text"
                    value={formData.delivery_info}
                    onChange={(e) => setFormData({ ...formData, delivery_info: e.target.value })}
                    required
                    placeholder="সারা দেশে ক্যাশ অন হোম ডেলিভারি।"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'ডাটাবেজে সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
