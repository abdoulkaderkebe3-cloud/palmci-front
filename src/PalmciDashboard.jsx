import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const API = "https://palmci-ndvi-api.onrender.com";

const SITES_MAP = [
  { id: 1, nom: "EHANIA",     lat: 5.282, lon: -3.013 },
  { id: 2, nom: "TOUMANGUIE", lat: 5.367, lon: -3.376 },
  { id: 3, nom: "IROBO",      lat: 5.338, lon: -4.787 },
  { id: 4, nom: "BOUBO",      lat: 5.650, lon: -5.302 },
  { id: 5, nom: "BLIDOUBA",   lat: 4.552, lon: -7.482 },
  { id: 6, nom: "IBOKE",      lat: 4.600, lon: -7.447 },
  { id: 7, nom: "GBAPET",     lat: 4.972, lon: -7.511 },
  { id: 8, nom: "NEKA",       lat: 4.565, lon: -7.512 },
];

function MapFlyTo({ siteActuel }) {
  const map = useMap();
  useEffect(() => {
    if (siteActuel) {
      const site = SITES_MAP.find(s => s.id === siteActuel);
      if (site) map.flyTo([site.lat, site.lon], 12, { duration: 1.5 });
    } else {
      map.flyTo([5.345, -5.0], 7, { duration: 1.5 });
    }
  }, [siteActuel, map]);
  return null;
}

const ZONES = {
  1: { label: "Stress sévère",    dose: "DOSE MAX",      color: "#e74c3c", glow: "#e74c3c55" },
  2: { label: "Stress modéré",    dose: "DOSE STANDARD", color: "#f39c12", glow: "#f39c1255" },
  3: { label: "Végétation saine", dose: "DOSE RÉDUITE",  color: "#27ae60", glow: "#27ae6055" },
};

const IMAGES_TYPES = [
  { key: "rgb",        label: "RGB",        icon: "🌍", desc: "Vue naturelle" },
  { key: "ndvi",       label: "NDVI",       icon: "🌿", desc: "Zones prescription" },
  { key: "infrarouge", label: "INFRAROUGE", icon: "🔴", desc: "Fausses couleurs" },
];

const ANNEES = ["2023", "2024", "2025"];

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:48, gap:16 }}>
      <div style={{
        width:44, height:44, border:"3px solid #1b5e20",
        borderTop:"3px solid #4caf50", borderRadius:"50%",
        animation:"spin 0.9s linear infinite"
      }}/>
      <div style={{ color:"#4caf50", fontSize:12, letterSpacing:3 }}>ANALYSE SATELLITAIRE...</div>
      <div style={{ color:"#2e7d32", fontSize:11 }}>Sentinel-2 · Google Earth Engine</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function NdviBar({ value }) {
  const pct = Math.max(0, Math.min(100, (value||0)*100));
  const c = !value ? "#333" : value < 0.35 ? "#e74c3c" : value < 0.55 ? "#f39c12" : "#27ae60";
  return (
    <div style={{ background:"#0a1a0a", borderRadius:4, height:8, overflow:"hidden", margin:"6px 0" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:4, transition:"width 1.4s cubic-bezier(.22,1,.36,1)", boxShadow:`0 0 8px ${c}88` }}/>
    </div>
  );
}

function CarteCoteIvoire({ siteActuel, onSelectSite }) {
  return (
    <div style={{ position:"relative", background:"#060e06", borderRadius:16, border:"1px solid #1b5e20", overflow:"hidden" }}>
      <div style={{ position:"relative", paddingBottom:"75%" }}>
        <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }}>
          <MapContainer center={[5.345, -5.0]} zoom={7} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer
              url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="&copy; Google Earth"
            />
            {SITES_MAP.map(site => (
              <CircleMarker 
                key={site.id} 
                center={[site.lat, site.lon]} 
                radius={siteActuel === site.id ? 10 : 6}
                color={siteActuel === site.id ? "#4caf50" : "#1b5e20"}
                fillColor={siteActuel === site.id ? "#4caf50" : "#0e5033"}
                fillOpacity={0.8}
                weight={2}
                eventHandlers={{ click: () => onSelectSite(site.id, site.nom) }}
              >
                <Popup>
                  <div style={{ color: "#333", fontWeight: "bold", fontSize: "12px", fontFamily:"'Courier New',monospace" }}>PALMCI {site.nom}</div>
                </Popup>
              </CircleMarker>
            ))}
            <MapFlyTo siteActuel={siteActuel} />
          </MapContainer>
        </div>
        
        <div style={{ position:"absolute", inset:0, background:"rgba(6,14,6,0.15)", pointerEvents:"none", zIndex: 400 }}/>

        <div style={{ position:"absolute", top:12, left:12, background:"rgba(0,0,0,.88)", border:"1px solid #2e7d32", borderRadius:8, padding:"8px 14px", zIndex:1000 }}>
          <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50" }}>GROUPE SIFCA</div>
          <div style={{ fontSize:14, fontWeight:900, color:"#fff" }}>PALMCI — 8 Sites UAI</div>
          <div style={{ fontSize:10, color:"#4caf50", marginTop:2 }}>↓ Cliquez un site pour analyser</div>
        </div>
      </div>
      <div style={{ padding:"10px 16px", borderTop:"1px solid #1b5e20", display:"flex", gap:14, flexWrap:"wrap" }}>
        {Object.entries(ZONES).map(([z,info]) => (
          <div key={z} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:info.color }}/>
            <span style={{ fontSize:10, color:"#aaa" }}>Zone {z} — {info.dose}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Rapport({ analyse, images, prescription, loading }) {
  const [imgActive, setImgActive] = useState("ndvi");

  if (loading) return <Spinner/>;
  if (!analyse) return null;

  const zone = analyse.zone ?? 2;
  const zoneInfo = ZONES[zone] || ZONES[2];
  const imgUrl = images?.images?.[imgActive];

  return (
    <div style={{ animation:"fadeIn .5s ease" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display:"flex", gap:16 }}>
        
        {/* Stats */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
          
          <div style={{ background:zoneInfo.color+"18", border:`1px solid ${zoneInfo.color}50`, borderLeft:`4px solid ${zoneInfo.color}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:9, letterSpacing:4, color:zoneInfo.color, marginBottom:3 }}>ZONE DOMINANTE</div>
            <div style={{ fontSize:17, fontWeight:900, color:"#fff" }}>Zone {zone} — {zoneInfo.label}</div>
            <div style={{ fontSize:13, color:zoneInfo.color, fontWeight:700, marginTop:3 }}>
              → {analyse.action || "Action recommandée"}
            </div>
          </div>

          <div style={{ background:"#0a150a", border:"1px solid #1b5e20", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50", marginBottom:8 }}>INDICE NDVI</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <span style={{ fontSize:34, fontWeight:900, color:zoneInfo.color, lineHeight:1 }}>
                {(analyse.ndvi_moyen ?? 0).toFixed(4)}
              </span>
              <div style={{ fontSize:10, color:"#555", textAlign:"right", lineHeight:2 }}>
                <div>min <span style={{ color:"#e74c3c" }}>{(analyse.ndvi_min??0).toFixed(4)}</span></div>
                <div>max <span style={{ color:"#27ae60" }}>{(analyse.ndvi_max??0).toFixed(4)}</span></div>
              </div>
            </div>
            <NdviBar value={analyse.ndvi_moyen}/>
          </div>

          <div style={{ background:"#0a150a", border:"1px solid #1b5e20", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50", marginBottom:10 }}>SURFACES PAR ZONE</div>
            {[
              { z:1, ha: analyse.zone1_ha ?? 0 },
              { z:2, ha: analyse.zone2_ha ?? 0 },
              { z:3, ha: analyse.zone3_ha ?? 0 },
            ].map(({ z, ha }) => {
              const total = ((analyse.zone1_ha??0)+(analyse.zone2_ha??0)+(analyse.zone3_ha??0)) || 1;
              const pct = ((ha/total)*100).toFixed(1);
              return (
                <div key={z} style={{ marginBottom:9 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:11, color:ZONES[z].color }}>Zone {z} — {ZONES[z].label}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:ZONES[z].color }}>{Number(ha).toFixed(0)} ha ({pct}%)</span>
                  </div>
                  <div style={{ background:"#0d1f0d", borderRadius:4, height:6 }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:ZONES[z].color, borderRadius:4, transition:"width 1.2s ease", boxShadow:`0 0 6px ${ZONES[z].glow}` }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {prescription && (
            <div style={{ background:"#0a150a", border:"1px solid #1b5e20", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50", marginBottom:8 }}>PRESCRIPTION ENGRAIS</div>
              {[
                { label:"Type engrais", value: prescription.prescription?.type_engrais },
                { label:"Dose",         value: prescription.prescription?.dose || analyse.dose },
                { label:"Age palmier",  value: prescription.prescription?.age_palmier ? `${prescription.prescription.age_palmier} ans` : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:11 }}>
                  <span style={{ color:"#555" }}>{label}</span>
                  <span style={{ color:"#a5d6a7", fontWeight:700 }}>{value||"—"}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ background:"#0a150a", border:"1px solid #1b5e20", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50", marginBottom:8 }}>INFORMATIONS</div>
            {[
              { label:"Images analysées", value:`${analyse.nb_images??"—"} images` },
              { label:"Résolution",       value:"10m × 10m" },
              { label:"Source",           value:"Sentinel-2 SR" },
              { label:"Période",          value:analyse.periode??"Nov → Fév" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:11 }}>
                <span style={{ color:"#555" }}>{label}</span>
                <span style={{ color:"#a5d6a7", fontWeight:700 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50" }}>IMAGES SATELLITES</div>
          <div style={{ display:"flex", gap:8 }}>
            {IMAGES_TYPES.map(img => (
              <button key={img.key} onClick={() => setImgActive(img.key)} style={{
                flex:1, background:imgActive===img.key?"#1b5e20":"#0a150a",
                border:`2px solid ${imgActive===img.key?"#4caf50":"#1b5e20"}`,
                borderRadius:10, padding:"10px 4px", cursor:"pointer",
                color:imgActive===img.key?"#a5d6a7":"#2e7d32", fontFamily:"monospace",
                transition:"all .2s", boxShadow:imgActive===img.key?"0 0 12px #4caf5033":"none"
              }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{img.icon}</div>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:1 }}>{img.label}</div>
                <div style={{ fontSize:9, color:imgActive===img.key?"#66bb6a":"#1b5e20", marginTop:2 }}>{img.desc}</div>
              </button>
            ))}
          </div>
          
          <div style={{ background:"#0a150a", border:"1px solid #1b5e20", borderRadius:12, overflow:"hidden", aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {imgUrl ? (
              <img src={imgUrl} alt={imgActive} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
            ) : (
              <div style={{ color:"#1b5e20", fontSize:12, textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🛰️</div>
                Image non disponible
              </div>
            )}
          </div>
          <div style={{ fontSize:10, color:"#2e7d32", textAlign:"center" }}>
            {IMAGES_TYPES.find(i=>i.key===imgActive)?.desc} · Sentinel-2 · 10m/pixel
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PalmciDashboard() {
  const [siteActuel,  setSiteActuel]  = useState(null);
  const [nomSite,     setNomSite]     = useState(null);
  const [anneeActive, setAnneeActive] = useState("2025");
  const [loading,     setLoading]     = useState(false);
  const [data,        setData]        = useState({});
  const [erreur,      setErreur]      = useState(null);
  const cache = useRef({});

  const chargerDonnees = async (siteId, nom, annee) => {
    setSiteActuel(siteId); 
    setNomSite(nom); 
    setErreur(null);
    
    // Clé de cache combinée : siteId + annee
    const cacheKey = `${siteId}-${annee}`;
    if (cache.current[cacheKey]) { 
      setData(cache.current[cacheKey]); 
      return; 
    }
    
    setLoading(true); 
    setData({});
    
    try {
      const [resAnalyse, resImages, resPrescription] = await Promise.all([
        fetch(`${API}/api/analyse/${siteId}?annee=${annee}`).then(r=>r.json()),
        fetch(`${API}/api/images/${siteId}?annee=${annee}`).then(r=>r.json()),
        fetch(`${API}/api/prescription/${siteId}?annee=${annee}&age_palmier=10`).then(r=>r.json()),
      ]);
      
      if (resAnalyse.erreur) throw new Error(resAnalyse.erreur);

      const result = { analyse: resAnalyse, images: resImages, prescription: resPrescription };
      cache.current[cacheKey] = result;
      setData(result);
    } catch (err) { 
      setErreur(err.message || "Impossible de contacter l'API."); 
    } finally { 
      setLoading(false); 
    }
  };

  // Recharger si l'année change
  useEffect(() => {
    if (siteActuel) {
      chargerDonnees(siteActuel, nomSite, anneeActive);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anneeActive]);

  return (
    <div style={{ fontFamily:"'Courier New',monospace", background:"#060e06", minHeight:"100vh", color:"#e8f5e9" }}>
      
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1b5e20 0%,#060e06 60%)", borderBottom:"1px solid #1b5e20", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:6, color:"#4caf50", marginBottom:2 }}>GROUPE SIFCA</div>
          <h1 style={{ margin:0, fontSize:21, fontWeight:900, color:"#fff", letterSpacing:1 }}>
            PALMCI — Analyse NDVI Satellitaire
          </h1>
          <div style={{ fontSize:11, color:"#4caf50", marginTop:3 }}>8 Sites UAI · Sentinel-2 SR</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {Object.entries(ZONES).map(([z,info]) => (
            <div key={z} style={{ display:"flex", alignItems:"center", gap:6, background:info.color+"18", border:`1px solid ${info.color}40`, borderRadius:20, padding:"5px 12px", fontSize:10, color:info.color }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:info.color }}/> Zone {z} 
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display:"flex", gap:20, padding:"20px 28px", alignItems:"flex-start" }}>
        
        {/* Carte */}
        <div style={{ width:"42%", flexShrink:0 }}>
          <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50", marginBottom:10 }}>CÔTE D'IVOIRE — SITES PALMCI</div>
          <CarteCoteIvoire siteActuel={siteActuel} onSelectSite={(id, nom) => chargerDonnees(id, nom, anneeActive)}/>
        </div>

        {/* Analyse */}
        <div style={{ flex:1, minWidth:0 }}>
          {!siteActuel ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#1b5e20" }}>
              <div style={{ fontSize:52, marginBottom:16, filter:"drop-shadow(0 0 20px #4caf5044)" }}>🌴</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#4caf50", marginBottom:8, letterSpacing:2 }}>SÉLECTIONNEZ UN SITE</div>
              <div style={{ fontSize:12 }}>Cliquez un marqueur sur la carte pour lancer l'analyse</div>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:9, letterSpacing:4, color:"#4caf50" }}>SITE ANALYSÉ</div>
                  <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:1 }}>PALMCI {nomSite}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {ANNEES.map(annee => {
                    const c = annee==="2023"?"#ef9a9a":annee==="2024"?"#fff59d":"#a5d6a7";
                    const actif = anneeActive===annee;
                    return (
                      <button key={annee} onClick={() => setAnneeActive(annee)} style={{
                        background:actif?"#1b5e20":"#0a150a", border:`2px solid ${actif?c:"#1b5e20"}`,
                        borderRadius:8, padding:"8px 20px", cursor:"pointer",
                        color:actif?c:"#2e7d32", fontFamily:"monospace", fontSize:14,
                        fontWeight:900, letterSpacing:1, transition:"all .2s",
                        boxShadow:actif?`0 0 16px ${c}44`:"none"
                      }}>{annee}</button>
                    );
                  })}
                </div>
              </div>

              {erreur && (
                <div style={{ background:"#2d0a0a", border:"1px solid #c62828", borderRadius:8, padding:14, marginBottom:16, color:"#ef5350", fontSize:12 }}>
                  {erreur}
                </div>
              )}

              <Rapport analyse={data.analyse} images={data.images} prescription={data.prescription} loading={loading}/>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
