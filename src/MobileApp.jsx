import React from 'react';
import { Navigation, AlertCircle, FlaskConical, ChevronRight, CheckSquare, WifiOff, BatteryMedium } from 'lucide-react';

export default function MobileApp({ nomSite, onBack }) {
  return (
    <div style={{ 
      background: '#f1f5f9', 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      fontFamily: "'Inter', sans-serif" 
    }}>
      {/* Phone Wrapper */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        background: '#f8fafc', 
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{ background: '#115e59', color: 'white', padding: '20px 24px', paddingBottom: '32px' }}>
          {/* Status bar mock */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px', opacity: 0.8, fontWeight: 600 }}>
            <span>08:45</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <WifiOff size={14} />
              <BatteryMedium size={16} />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '0.5px' }}>KOFFI A.</h1>
              <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>Site : {nomSite || "Ehania V5"}</div>
            </div>
            <div style={{ background: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', background: '#fde047', borderRadius: '50%' }} />
              HORS-LIGNE PRÊT
            </div>
          </div>
        </div>

        {/* Map Banner */}
        <div style={{ 
          height: '60px', 
          background: 'url("https://images.unsplash.com/photo-1592982537447-6f2c6a0c2020?q=80&w=600&auto=format&fit=crop") center/cover',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
          <div style={{ 
            background: '#1e293b', color: 'white', padding: '6px 16px', borderRadius: '20px', 
            fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
            position: 'relative', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <Navigation size={14} color="#60a5fa" /> À 45 mètres
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '0 20px', marginTop: '-16px', position: 'relative', zIndex: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Main Action Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#fee2e2', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={24} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>ACTION REQUISE</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>Parcelle B12</div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#475569', fontWeight: 500, marginBottom: '8px' }}>Mettre par palmier :</div>
              <div style={{ 
                border: '2px solid #fde047', background: '#fefce8', borderRadius: '12px', 
                padding: '16px', display: 'inline-flex', alignItems: 'center', gap: '12px',
                color: '#713f12', marginBottom: '12px', minWidth: '180px', justifyContent: 'center'
              }}>
                <FlaskConical size={24} />
                <span style={{ fontSize: '32px', fontWeight: 900 }}>2.5 <span style={{ fontSize: '18px', fontWeight: 700 }}>kg</span></span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Engrais : NPK</div>
            </div>
          </div>

          {/* Next tasks */}
          <div style={{ marginBottom: '120px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#475569', marginBottom: '12px' }}>À faire ensuite (2)</h3>
            
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', background: '#facc15', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>Parcelle B14</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>1.5 kg / palmier</div>
                </div>
              </div>
              <ChevronRight size={18} color="#cbd5e1" />
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', background: '#f87171', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>Parcelle C02</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>3.0 kg / palmier</div>
                </div>
              </div>
              <ChevronRight size={18} color="#cbd5e1" />
            </div>
          </div>

        </div>

        {/* Bottom Sticky Button */}
        <div style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, 
          padding: '20px', background: 'linear-gradient(to top, white 80%, transparent)' 
        }}>
          <button 
            onClick={onBack}
            style={{
              width: '100%', background: '#16a34a', color: 'white', border: 'none',
              padding: '18px', borderRadius: '16px', fontSize: '18px', fontWeight: 900,
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
              cursor: 'pointer', boxShadow: '0 8px 16px rgba(22, 163, 74, 0.3)',
              letterSpacing: '0.5px'
            }}
          >
            <CheckSquare size={24} />
            C'EST FAIT
          </button>
        </div>

      </div>
    </div>
  );
}
