/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { EquipmentList } from './components/EquipmentList';
import { MyBookings } from './components/MyBookings';
import { AdminBackoffice } from './components/AdminBackoffice';
import { UserProfileModal } from './components/UserProfileModal';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SEED_EQUIPMENT } from './data/seedData';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  UserCheck, 
  BookOpen,
  Camera,
  Layers
} from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, isAdmin, needsProfileCompletion } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-bookings' | 'admin'>('catalog');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Auto-seed sample equipment on first launch if collection is empty and user is admin
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, 'equipments'), async (snap) => {
      if (snap.empty) {
        console.log('Seeding initial educational tech equipment catalog...');
        try {
          for (const item of SEED_EQUIPMENT) {
            await addDoc(collection(db, 'equipments'), {
              ...item,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Initial seeding error:', e);
        }
      }
    });

    return () => unsub();
  }, [isAdmin]);

  // Listen to pending bookings count for admin badge
  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    const q = query(collection(db, 'bookings'), where('status', '==', 'pending'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPendingCount(snap.size);
      },
      (err) => {
        console.warn('Pending count error:', err.message);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fffaf5] text-slate-800 font-sans selection:bg-orange-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        pendingCount={pendingCount}
      />

      {/* Profile Completion Reminder Banner */}
      {currentUser && needsProfileCompletion && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-100 flex-shrink-0" />
              <span>
                กรุณาระบุ <strong>เบอร์โทรศัพท์</strong> และ <strong>รหัสนักศึกษา/สังกัด</strong> ในโปรไฟล์ของคุณ เพื่อความสะดวกในการติดต่อรับอุปกรณ์
              </span>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-white text-orange-600 font-bold px-3 py-1 rounded-lg text-xs hover:bg-orange-50 transition shadow-xs cursor-pointer"
            >
              ระบุข้อมูลติดต่อตอนนี้
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'catalog' && (
          <EquipmentList
            onGoToBookings={() => setActiveTab('my-bookings')}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeTab === 'my-bookings' && (
          <MyBookings onGoToCatalog={() => setActiveTab('catalog')} />
        )}

        {activeTab === 'admin' && (
          <AdminBackoffice onExitBackoffice={() => setActiveTab('catalog')} />
        )}
      </main>

      {/* Public Footer (hide in admin backoffice for a clean application view) */}
      {activeTab !== 'admin' && (
        <footer className="bg-white border-t border-orange-100 mt-12 py-10 text-gray-600 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  ED
                </div>
                <span className="font-bold text-gray-900 text-sm">
                  ภาควิชาเทคโนโลยีการศึกษา
                </span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                คณะศึกษาศาสตร์ มหาวิทยาลัยศิลปากร (Silpakorn University)<br />
                ระบบให้บริการยืม-คืนอุปกรณ์ผลิตสื่อการเรียนรู้ นวัตกรรม และโสตทัศนูปกรณ์
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                สถานที่ติดต่อรับ-ส่งคืนอุปกรณ์
              </h4>
              <div className="space-y-1 text-gray-500">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span>ห้องปฏิบัติการเทคโนโลยีการศึกษา ชั้น 3 อาคารศึกษาศาสตร์ 1</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span>โทรศัพท์: 034-255-095 หรือ ติดต่อผ่านระบบออนไลน์</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span>วันและเวลาทำการ: วันจันทร์ - ศุกร์ เวลา 08.30 - 16.30 น.</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                ระเบียบการยืมอุปกรณ์
              </h4>
              <p className="text-gray-500 leading-relaxed">
                ผู้ขอยืมต้องเป็นนักศึกษาหรือบุคลากร มหาวิทยาลัยศิลปากร โปรดแสดงบัตรนักศึกษาหรือใบยืมอุปกรณ์ในระบบเมื่อมารับอุปกรณ์จริง ณ ห้องปฏิบัติการ
              </p>
              <p className="text-orange-600 font-medium text-[11px] pt-1">
                ฐานข้อมูล Cloud Firestore: edtech-borrowing
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-gray-400 text-[11px]">
            <p>© {new Date().getFullYear()} Educational Technology Department, Silpakorn University. All rights reserved.</p>
            <p>ระบบยืม-คืนอุปกรณ์สื่อดิจิทัลเพื่อการศึกษา</p>
          </div>
        </footer>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
