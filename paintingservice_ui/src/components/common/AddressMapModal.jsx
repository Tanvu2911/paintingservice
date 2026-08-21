import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapPin,
  Search,
  Crosshair,
  X,
  Check,
  Building,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  HANOI_CENTER_LNG_LAT,
  HANOI_DISTRICTS,
  MAPBOX_PUBLIC_TOKEN,
  getDistrictLngLat,
  reverseGeocodeMapbox,
  searchHanoiMapbox,
  formatHanoiAddress,
} from "../../data/hanoiLocations";

// Gán token cho Mapbox GL
mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

// Các style chuẩn của Mapbox
const MAPBOX_STYLES = [
  { id: "mapbox://styles/mapbox/streets-v12", label: "Đường phố", icon: "🏙️" },
  { id: "mapbox://styles/mapbox/satellite-streets-v12", label: "Vệ tinh 3D", icon: "🛰️" },
  { id: "mapbox://styles/mapbox/light-v11", label: "Hiện đại", icon: "✨" },
];

export default function AddressMapModal({
  isOpen,
  onClose,
  onConfirm,
  initialDistrict = "",
  initialWard = "",
  initialStreet = "",
  initialAddress = "",
  title = "Chọn vị trí trên bản đồ",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [mapStyleId, setMapStyleId] = useState("mapbox://styles/mapbox/streets-v12");
  const [loadingMap, setLoadingMap] = useState(true);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Selected location details: [lng, lat]
  const [selectedLngLat, setSelectedLngLat] = useState(HANOI_CENTER_LNG_LAT);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [selectedWard, setSelectedWard] = useState(initialWard);
  const [streetAddress, setStreetAddress] = useState(initialStreet);
  const [displayName, setDisplayName] = useState("");

  const searchTimeoutRef = useRef(null);

  // Sync state with props when modal opens
  useEffect(() => {
    if (isOpen) {
      const lngLat = getDistrictLngLat(initialDistrict);
      setSelectedLngLat(lngLat);
      setSelectedDistrict(initialDistrict);
      setSelectedWard(initialWard);
      setStreetAddress(initialStreet);
      setGpsError("");
      setSearchResults([]);
      setSearchQuery(initialAddress || initialStreet || "");
    }
  }, [isOpen, initialDistrict, initialWard, initialStreet, initialAddress]);

  // Update address from coordinates via reverse geocoding
  const handleCoordsChange = useCallback(
    async (lng, lat, shouldUpdateStreet = true) => {
      setResolvingAddress(true);
      setGpsError("");
      try {
        const result = await reverseGeocodeMapbox(lng, lat);
        setSelectedLngLat([lng, lat]);
        if (result.district) setSelectedDistrict(result.district);
        if (result.ward) setSelectedWard(result.ward);
        if (shouldUpdateStreet && result.street) {
          setStreetAddress(result.street);
        }
        setDisplayName(result.displayName || result.fullFormatted);
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      } finally {
        setResolvingAddress(false);
      }
    },
    []
  );

  // Initialize or update Mapbox GL Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;
    setLoadingMap(true);

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialCenter = selectedLngLat || HANOI_CENTER_LNG_LAT;
      const initialZoom = initialDistrict ? 14.5 : 12.5;

      try {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyleId,
          center: initialCenter,
          zoom: initialZoom,
          pitch: 35, // 3D perspective angle
          bearing: -10,
          attributionControl: false,
        });

        // Controls
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

        // Custom Pin Element
        const markerEl = document.createElement("div");
        markerEl.className = "custom-mapbox-marker";
        markerEl.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <span style="position: absolute; width: 34px; height: 34px; background-color: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="width: 34px; height: 34px; background: linear-gradient(135deg, #059669, #0d9488); border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; z-index: 2;">
              📍
            </div>
            <div style="position: absolute; bottom: -5px; width: 8px; height: 8px; background-color: #059669; transform: rotate(45deg); border-right: 2px solid white; border-bottom: 2px solid white; z-index: 1;"></div>
          </div>
        `;

        const marker = new mapboxgl.Marker({
          element: markerEl,
          draggable: true,
        })
          .setLngLat(initialCenter)
          .addTo(map);

        // Events
        marker.on("dragend", () => {
          const { lng, lat } = marker.getLngLat();
          handleCoordsChange(lng, lat);
        });

        map.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          marker.setLngLat([lng, lat]);
          handleCoordsChange(lng, lat);
        });

        map.on("load", () => {
          if (!isMounted) return;
          setLoadingMap(false);

          // Thêm 3D Buildings Layer
          try {
            const layers = map.getStyle().layers || [];
            const labelLayerId = layers.find(
              (layer) => layer.type === "symbol" && layer.layout && layer.layout["text-field"]
            )?.id;

            if (!map.getLayer("3d-buildings") && map.getSource("composite")) {
              map.addLayer(
                {
                  id: "3d-buildings",
                  source: "composite",
                  "source-layer": "building",
                  filter: ["==", "extrude", "true"],
                  type: "fill-extrusion",
                  minzoom: 14,
                  paint: {
                    "fill-extrusion-color": "#cbd5e1",
                    "fill-extrusion-height": ["get", "height"],
                    "fill-extrusion-base": ["get", "min_height"],
                    "fill-extrusion-opacity": 0.5,
                  },
                },
                labelLayerId
              );
            }
          } catch (e) {}
        });

        map.on("error", () => {
          if (isMounted) setLoadingMap(false);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.resize();
          }
        }, 200);

        if (!initialStreet) {
          handleCoordsChange(initialCenter[0], initialCenter[1]);
        }
      } catch (err) {
        console.error("Mapbox init error:", err);
        if (isMounted) setLoadingMap(false);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, mapStyleId]);

  // Bay mượt mà tới toạ độ [lng, lat]
  const flyToCoords = (lng, lat, zoom = 15.5) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo({
        center: [lng, lat],
        zoom,
        pitch: 35,
        essential: true,
        duration: 1300,
      });
      markerRef.current.setLngLat([lng, lat]);
    }
  };

  // Search input handler with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchHanoiMapbox(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);
  };

  // Select a search result
  const handleSelectSearchResult = (item) => {
    flyToCoords(item.lng, item.lat, 16);
    setSelectedLngLat([item.lng, item.lat]);
    if (item.district) setSelectedDistrict(item.district);
    if (item.ward) setSelectedWard(item.ward);
    if (item.street) setStreetAddress(item.street);
    setDisplayName(item.displayName || item.fullFormatted);
    setSearchResults([]);
    setSearchQuery(item.name || item.fullFormatted);
  };

  // Quick District select pill
  const handleSelectQuickDistrict = (districtName) => {
    const lngLat = getDistrictLngLat(districtName);
    setSelectedDistrict(districtName);
    setSelectedWard("");
    flyToCoords(lngLat[0], lngLat[1], 14.5);
    handleCoordsChange(lngLat[0], lngLat[1], false);
  };

  // Get current user GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setLocatingUser(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        flyToCoords(longitude, latitude, 16);
        handleCoordsChange(longitude, latitude);
        setLocatingUser(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsError("Không thể lấy vị trí GPS. Vui lòng cấp quyền truy cập vị trí trên trình duyệt!");
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Confirm selection and pass formatted address to parent
  const handleConfirmLocation = () => {
    const fullAddress = selectedDistrict
      ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
      : streetAddress || displayName || "Hà Nội";

    onConfirm?.({
      district: selectedDistrict,
      ward: selectedWard,
      street: streetAddress,
      fullAddress,
      lat: selectedLngLat[1],
      lng: selectedLngLat[0],
    });
    onClose?.();
  };

  if (!isOpen) return null;

  const currentFullAddress = selectedDistrict
    ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
    : streetAddress || displayName || "Đang tải vị trí...";

  const districtObj = HANOI_DISTRICTS.find((d) => d.name === selectedDistrict);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header (Gọn gàng, sạch sẽ) */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[10.5px] text-slate-500">
                Tìm kiếm, kéo ghim hoặc click trên bản đồ để chọn địa chỉ tại Hà Nội
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Bar & Controls */}
        <div className="p-2.5 sm:p-3 border-b border-slate-100 bg-white space-y-2">
          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Tìm toà nhà, ngõ phố tại Hà Nội (VD: Keangnam, Vincom...)"
                  className="w-full pl-8 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition"
                />
                {isSearching ? (
                  <div className="absolute right-2.5 flex items-center gap-1 text-[10px] text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>Tìm...</span>
                  </div>
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full p-2.5 text-left hover:bg-emerald-50/60 transition flex items-start gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                          {item.fullFormatted || item.displayName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mapbox Style Switcher (Gọn nhẹ) */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl shrink-0">
              {MAPBOX_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setMapStyleId(st.id)}
                  className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    mapStyleId === st.id
                      ? "bg-white text-emerald-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{st.icon}</span>
                  <span className="hidden sm:inline">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick District Navigation Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[10.5px]">
            <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1 mr-0.5">
              <Building className="w-3 h-3" />
              <span>Quận:</span>
            </span>
            {HANOI_DISTRICTS.map((d) => {
              const isSelected = selectedDistrict === d.name;
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => handleSelectQuickDistrict(d.name)}
                  className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {d.name.replace(/^(Quận|Huyện)\s+/gi, "")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Container (Chiều cao chuẩn vừa vặn) */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[300px] bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[260px] sm:min-h-[300px]" />

          {/* Loading Map Overlay */}
          {loadingMap && (
            <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-600">Đang tải bản đồ Mapbox 3D...</span>
            </div>
          )}

          {/* Floating Map Actions */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
            {/* GPS Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={locatingUser}
              className="bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-700 px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer backdrop-blur-xs active:scale-95 disabled:opacity-50"
              title="Lấy vị trí GPS hiện tại của bạn"
            >
              {locatingUser ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
              ) : (
                <Crosshair className="w-3 h-3 text-emerald-600" />
              )}
              <span>{locatingUser ? "Đang định vị..." : "Vị trí của tôi"}</span>
            </button>
          </div>

          {/* Address Resolving Pill */}
          {resolvingAddress && (
            <div className="absolute top-2.5 right-12 z-20 bg-slate-900/80 text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-xs animate-pulse">
              <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-400" />
              <span>Nhận diện địa chỉ...</span>
            </div>
          )}

          {/* GPS Error Alert */}
          {gpsError && (
            <div className="absolute bottom-2 left-2 right-2 z-20 bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-xl text-[11px] flex items-center gap-1.5 shadow-md">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="flex-1 font-medium truncate">{gpsError}</span>
              <button
                type="button"
                onClick={() => setGpsError("")}
                className="text-rose-400 hover:text-rose-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Details Card & Confirmation Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 space-y-2.5">
          {/* Editable Fields Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Quận / Huyện
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  const dist = e.target.value;
                  setSelectedDistrict(dist);
                  setSelectedWard("");
                  const lngLat = getDistrictLngLat(dist);
                  flyToCoords(lngLat[0], lngLat[1], 14.5);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-[11px] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="">-- Chọn Quận/Huyện --</option>
                {HANOI_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Phường / Xã
              </label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                disabled={!selectedDistrict}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-[11px] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-50"
              >
                <option value="">-- Chọn Phường/Xã --</option>
                {districtObj?.wards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
                {selectedWard && !districtObj?.wards?.includes(selectedWard) && (
                  <option value={selectedWard}>{selectedWard}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Số nhà / Tên đường
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="VD: Số 29 ngõ 45 Trần Thái Tông"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-[11px] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Full Address Preview & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Địa chỉ ghi nhận:</span>
                <span className="bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono text-[9px]">
                  {selectedLngLat[1]?.toFixed(4)}, {selectedLngLat[0]?.toFixed(4)}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {currentFullAddress}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 active:scale-98 transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Xác nhận vị trí</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
