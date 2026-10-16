import React, { useState, useEffect } from 'react';
import { Equipment } from '../types';
import { collection, onSnapshot, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_EQUIPMENTS } from '../data/seedData';
import { 
  Search, 
  Filter, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Eye, 
  CalendarPlus, 
  SlidersHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { BookingModal } from './BookingModal';

interface EquipmentListProps {
  onGoToBookings: () => void;
  onOpenProfile: () => void;
}

const CATEGORIES = [
  'ทั้งหมด',
  'กล้องถ่ายภาพและวิดีโอ',
  'ไมโครโฟนและระบบเสียง',
  'ขาตั้งและอุปกรณ์กันสั่น',
  'ไฟสตูดิโอและระบบแสง',
  'โปรเจกเตอร์และจอฉาย',
  'อุปกรณ์ VR และสื่อปฏิสัมพันธ์',
];

export const EquipmentList: React.FC<EquipmentListProps> = ({ onGoToBookings, onOpenProfile }) => {
  const { currentUser, isAdmin } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>(DEFAULT_EQUIPMENTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [isSampleData, setIsSampleData] = useState<boolean>(false);
  const [syncingFirestore, setSyncingFirestore] = useState<boolean>(false);

  // Modals state
  const [selectedEquipmentForDetail, setSelectedEquipmentForDetail] = useState<Equipment | null>(null);
  const [selectedEquipmentForBooking, setSelectedEquipmentForBooking] = useState<Equipment | null>(null);
  const [justBookedId, setJustBookedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const path = 'equipments';
    const unsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Equipment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Equipment);
        });
        if (list.length === 0) {
          // If Firestore collection is empty, display built-in EdTech gear so equipment is never missing!
          setEquipments(DEFAULT_EQUIPMENTS);
          setIsSampleData(true);
        } else {
          list.sort((a, b) => a.code.localeCompare(b.code));
          setEquipments(list);
          setIsSampleData(false);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore equipments fetch error, displaying default catalog:', error);
        setEquipments(DEFAULT_EQUIPMENTS);
        setIsSampleData(true);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleSyncToFirestore = async () => {
    setSyncingFirestore(true);
    try {
      for (const item of DEFAULT_EQUIPMENTS) {
        await setDoc(doc(db, 'equipments', item.id), item);
      }
      setIsSampleData(false);
    } catch (e) {
      console.error('Failed to sync to firestore:', e);
    } finally {
      setSyncingFirestore(false);
    }
  };

  const filteredEquipments = equipments.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;

    const matchesAvailability = onlyAvailable
      ? item.status === 'available' && item.availableQuantity > 0
      : true;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const totalItemsCount = equipments.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
  const availableItemsCount = equipments.reduce((sum, item) => sum + (item.availableQuantity || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with Educational Tech aesthetic */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/15 p-6 sm:p-10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Educational Technology Equipment Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            ระบบยืม-คืนอุปกรณ์สื่อการศึกษา
          </h1>

          <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
            ศูนย์บริการยืมอุปกรณ์ผลิตสื่อดิจิทัล กล้อง ไมโครโฟน ไฟสตูดิโอ และโสตทัศนูปกรณ์ เพื่อการเรียนการสอนและงานวิจัย ภาควิชาเทคโนโลยีการศึกษา
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium">
            <div className="bg-white/15 backdrop-blur-xs px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>พร้อมให้ยืม {availableItemsCount} ชิ้น</span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs px-3.5 py-1.5 rounded-xl">
              อุปกรณ์ทั้งหมด {totalItemsCount} ชิ้น ({equipments.length} รายการ)
            </div>
          </div>
        </div>

        {/* Decorative background glow circle */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </section>

      {/* Initial Equipment Ready Banner */}
      {isSampleData && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">
                พร้อมใช้งาน: รายการอุปกรณ์ประจำภาควิชาเทคโนโลยีการศึกษา 12 รายการ
              </p>
              <p className="text-[11px] text-gray-600">
                กล้องถ่ายทำ Full-Frame, ไมค์ไวเลส DJI/Rode, กิมบอล RS3, ไฟ Amaran, โปรเจกเตอร์, จอ Wacom และแว่น VR Quest 3 พร้อมส่งคำขอยืมได้ทันที
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handleSyncToFirestore}
              disabled={syncingFirestore}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{syncingFirestore ? 'กำลังบันทึก...' : 'ซิงค์ลง Firestore ถาวร'}</span>
            </button>
          )}
        </div>
      )}

      {/* Just Booked Toast Banner */}
      {justBookedId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                ส่งคำขอจองอุปกรณ์เรียบร้อยแล้ว!
              </p>
              <p className="text-xs text-emerald-700">
                เจ้าหน้าที่จะตรวจสอบและอนุมัติคำขอ สามารถติดตามสถานะหรือพิมพ์ใบยืมได้ในหน้ารายการจอง
              </p>
            </div>
          </div>
          <button
            onClick={onGoToBookings}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <span>ดูรายการจองของฉัน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-orange-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่ออุปกรณ์, รหัสอุปกรณ์ (เช่น CAM-001), หรือหมวดหมู่..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Toggle Availability Filter */}
          <button
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 cursor-pointer ${
              onlyAvailable
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>เฉพาะที่ว่างพร้อมยืม</span>
          </button>
        </div>

        {/* Categories scrollable pill row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-orange-50/60 text-gray-600 hover:bg-orange-100 hover:text-orange-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">กำลังโหลดรายการอุปกรณ์...</p>
        </div>
      ) : filteredEquipments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-orange-200 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">ไม่พบอุปกรณ์ที่ค้นหา</h3>
          <p className="text-sm text-gray-500 mb-4">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ทั้งหมด');
              setOnlyAvailable(false);
            }}
            className="text-xs text-orange-600 hover:underline font-semibold"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipments.map((item) => {
            const isAvailable = item.status === 'available' && item.availableQuantity > 0;
            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-orange-100 shadow-xs hover:shadow-xl hover:border-orange-300 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="bg-black/70 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md">
                      {item.code}
                    </span>
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    {item.status === 'maintenance' ? (
                      <span className="bg-amber-600/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        ซ่อมบำรุง
                      </span>
                    ) : isAvailable ? (
                      <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        ว่าง {item.availableQuantity} ชิ้น
                      </span>
                    ) : (
                      <span className="bg-gray-800/90 backdrop-blur-xs text-gray-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        ถูกยืมหมดแล้ว
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-[11px] text-orange-600 font-semibold uppercase tracking-wider">
                      {item.category}
                    </p>
                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </p>
                  </div>

                  {/* Quantity Indicator Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>คงเหลือในห้อง Lab</span>
                      <span className="font-bold text-gray-800">
                        {item.availableQuantity} / {item.totalQuantity} ชิ้น
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          item.availableQuantity === 0
                            ? 'bg-gray-300 w-0'
                            : item.availableQuantity <= 1
                            ? 'bg-amber-500'
                            : 'bg-orange-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, (item.availableQuantity / item.totalQuantity) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEquipmentForDetail(item)}
                      className="p-2.5 rounded-xl border border-gray-200 hover:bg-orange-50 hover:text-orange-600 text-gray-600 transition cursor-pointer"
                      title="ดูรายละเอียดอุปกรณ์"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSelectedEquipmentForBooking(item)}
                      disabled={!isAvailable}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs ${
                        isAvailable
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-98 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <CalendarPlus className="w-4 h-4" />
                      <span>{isAvailable ? 'ส่งคำขอยืม' : 'ไม่ว่างให้ยืม'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EquipmentDetailModal
        equipment={selectedEquipmentForDetail}
        isOpen={Boolean(selectedEquipmentForDetail)}
        onClose={() => setSelectedEquipmentForDetail(null)}
        onOpenBooking={(item) => setSelectedEquipmentForBooking(item)}
      />

      <BookingModal
        equipment={selectedEquipmentForBooking}
        isOpen={Boolean(selectedEquipmentForBooking)}
        onClose={() => setSelectedEquipmentForBooking(null)}
        onOpenProfile={onOpenProfile}
        onSuccess={(bookingId) => {
          setJustBookedId(bookingId);
          setTimeout(() => setJustBookedId(null), 8000);
        }}
      />
    </div>
  );
};
