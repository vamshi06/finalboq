"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Plus, Minus, Edit2, Download, X } from "lucide-react";

interface RateCardItem {
  dept: string;
  itemName: string;
  category?: string;
  details?: string;
  uom?: string;
  elemantraRate: number;
  vendorRate?: number;
}

interface SelectedItem extends RateCardItem {
  qty: number;
  total: number;
}

interface EstimationData {
  bhk: string;
  location: string;
  totalHouseArea: number;
  kitchenArea: number;
  bedroomArea: number;
  washroomArea: number;
  livingRoomArea: number;
  diningArea: number;
  customRooms: { name: string; area: number }[];
  selectedMaterials: string[];
  selectedItems: SelectedItem[];
}

export default function EstimationForm() {
  const [step, setStep] = useState<"bhk" | "areas" | "materials" | "items" | "boq">("bhk");
  const [data, setData] = useState<EstimationData>({
    bhk: "",
    location: "Wadala",
    totalHouseArea: 900,
    kitchenArea: 100,
    bedroomArea: 150,
    washroomArea: 50,
    livingRoomArea: 200,
    diningArea: 120,
    customRooms: [],
    selectedMaterials: [],
    selectedItems: [],
  });

  const [availableItems, setAvailableItems] = useState<RateCardItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RateCardItem[]>([]);
  const [materialDepartments] = useState([
    "False Ceiling",
    "POP",
    "Demolition",
    "Civil",
    "Carpentry",
    "Electrical",
    "Paint",
    "PU",
    "Polish",
    "Duco",
    "Lamination",
    "Plumbing",
    "CLEANING",
    "DEBRIS REMOVAL",
    "MISCELLENIOUS",
  ]);

  const [editingItem, setEditingItem] = useState<SelectedItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [customLocation, setCustomLocation] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  const [selectedRooms, setSelectedRooms] = useState<string[]>(["Kitchen", "Bedroom", "Washroom"]);
  const [customRoomName, setCustomRoomName] = useState("");
  const [showCustomRoom, setShowCustomRoom] = useState(false);

  const allRoomTypes = ["Kitchen", "Bedroom", "Washroom", "Living Room", "Dining Room", "Hall", "Balcony", "Study"];

  const locations = [
    "BKC, Bandra",
    "Wadala",
    "Andheri",
    "Powai",
    "Dadar",
    "Navi Mumbai",
    "Pune",
  ];

  const bhkOptions = ["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "6BHK"];

  const detectUserLocation = async () => {
    setDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "Unknown";
            setData((prev) => ({ ...prev, location: city }));
            setDetectingLocation(false);
          } catch {
            setData((prev) => ({ ...prev, location: "Mumbai (Auto)" }));
            setDetectingLocation(false);
          }
        },
        () => {
          setDetectingLocation(false);
        }
      );
    }
  };

  // Fetch rate card items
  useEffect(() => {
    const fetchRateCard = async () => {
      try {
        const response = await fetch("/api/rate-card");
        if (response.ok) {
          const items = await response.json();
          setAvailableItems(items);
        }
      } catch (error) {
        console.error("Failed to fetch rate card:", error);
        alert("Failed to load materials. Please refresh the page.");
      }
    };

    fetchRateCard();
  }, []);

  // Filter items based on selected materials
  useEffect(() => {
    if (data.selectedMaterials.length > 0) {
      const filtered = availableItems.filter((item) =>
        data.selectedMaterials.includes(item.dept)
      );
      setFilteredItems(filtered);
    }
  }, [data.selectedMaterials, availableItems]);

  const handleAddItem = (item: RateCardItem) => {
    const newItem: SelectedItem = { ...item, qty: 1, total: item.elemantraRate };
    setData({
      ...data,
      selectedItems: [...data.selectedItems, newItem],
    });
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    const updated = [...data.selectedItems];
    updated[index].qty = Math.max(1, newQty);
    updated[index].total = updated[index].qty * updated[index].elemantraRate;
    setData({ ...data, selectedItems: updated });
  };

  const handleRemoveItem = (index: number) => {
    setData({
      ...data,
      selectedItems: data.selectedItems.filter((_, i) => i !== index),
    });
  };

  const toggleMaterial = (material: string) => {
    const newMaterials = data.selectedMaterials.includes(material)
      ? data.selectedMaterials.filter((m) => m !== material)
      : [...data.selectedMaterials, material];
    setData({ ...data, selectedMaterials: newMaterials });
  };

  const totalAmount = data.selectedItems.reduce((sum, item) => sum + item.total, 0);

  const handleGenerateBOQ = async () => {
    // Generate BOQ and move to final step
    setStep("boq");
  };

  const handleDownload = async (format: "pdf" | "excel") => {
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: data.selectedItems,
          bhk: data.bhk,
          location: data.location,
          areas: {
            kitchen: data.kitchenArea,
            bedroom: data.bedroomArea,
            washroom: data.washroomArea,
          },
          totalAmount,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BOQ_${data.bhk}_${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error(`Failed to download ${format}:`, error);
      alert(`Failed to download ${format}`);
    }
  };

  // Step 1: BHK Selection
  if (step === "bhk") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Estimation Form
          {/* Progress Bar
          <div className="mb-8 bg-white rounded-lg p-4 shadow">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center ${
                    num === 1 
                      ? "bg-orange-500 text-white" 
                      : "bg-gray-300 text-gray-600"
                  }`}>
                    {num}
                  </div>
                  {num < 5 && <div className="flex-1 h-1 bg-gray-300 mx-2"></div>}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 text-center">Step 1: BHK Selection</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 md:p-10">
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Design Your Space */}
              </h1>
              <p className="text-gray-600 mb-8">Step 1 of 5: Select your BHK & Location</p>
            {/* </div> */}

            {/* Location Detection Section */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📍 Select Your Location</h2>
              {/* <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">📍</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Your Location</h2>
                  <p className="text-sm text-gray-600">This helps us provide accurate rates</p>
                </div>
              </div> */}
              {!showLocationInput ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-600 mb-2">Popular Locations:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setData({ ...data, location: loc });
                          setShowLocationInput(false);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          data.location === loc
                            ? "bg-blue-600 text-white shadow-lg scale-105"
                            : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowLocationInput(true)}
                    className="px-4 py-3 rounded-lg text-sm font-medium bg-white text-gray-700 border-2 border-dashed border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    + Enter Custom Location
                  </button>
                  <button
                    onClick={detectUserLocation}
                    disabled={detectingLocation}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors shadow-md"
                  >
                    {detectingLocation ? "🔍 Detecting Location..." : "📍 Detect My Location"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Enter your city or area name..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (customLocation.trim()) {
                          setData({ ...data, location: customLocation });
                          setCustomLocation("");
                          setShowLocationInput(false);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setShowLocationInput(false);
                        setCustomLocation("");
                      }}
                      className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-blue-600">
                <p className="text-sm font-medium text-gray-700">Selected Location: <span className="text-blue-600 font-bold text-lg">{data.location}</span></p>
              </div>
            </div>

            {/* BHK Selection */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">🏠</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Select Your BHK</h2>
                  <p className="text-sm text-gray-600">Choose your property configuration</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {bhkOptions.slice(0, 6).map((bhk) => (
                  <button
                    key={bhk}
                    onClick={() => setData({ ...data, bhk })}
                    className={`p-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                      data.bhk === bhk
                        ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-xl scale-105 ring-2 ring-orange-300"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 shadow-md"
                    }`}
                  >
                    {bhk}
                  </button>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => setStep("areas")}
              disabled={!data.bhk}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
            >
              Next <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Area Input with Room Selection
  if (step === "areas") {
    const getRoomKey = (room: string) => {
      switch (room) {
        case "Kitchen": return "kitchenArea";
        case "Bedroom": return "bedroomArea";
        case "Washroom": return "washroomArea";
        case "Living Room": return "livingRoomArea";
        case "Dining Room": return "diningArea";
        default: return null;
      }
    };

    const handleRoomToggle = (room: string) => {
      if (selectedRooms.includes(room)) {
        setSelectedRooms(selectedRooms.filter((r) => r !== room));
      } else {
        setSelectedRooms([...selectedRooms, room]);
      }
    };

    const handleAddCustomRoom = () => {
      if (customRoomName.trim()) {
        const newCustomRoom = { name: customRoomName, area: 0 };
        setData((prev) => ({
          ...prev,
          customRooms: [...prev.customRooms, newCustomRoom],
        }));
        setSelectedRooms([...selectedRooms, customRoomName]);
        setCustomRoomName("");
        setShowCustomRoom(false);
      }
    };

    const handleRemoveCustomRoom = (roomName: string) => {
      setData((prev) => ({
        ...prev,
        customRooms: prev.customRooms.filter((r) => r.name !== roomName),
      }));
      setSelectedRooms(selectedRooms.filter((r) => r !== roomName));
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Area Details
            </h1>
            <p className="text-gray-600 mb-8">
              Step 2 of 5: Select rooms and enter areas (sq ft)
            </p>

            {/* Room Selection */}
            <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏠 Select Rooms to Include</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {allRoomTypes.map((room) => (
                  <button
                    key={room}
                    onClick={() => handleRoomToggle(room)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRooms.includes(room)
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    ✓ {room}
                  </button>
                ))}
              </div>

              {!showCustomRoom ? (
                <button
                  onClick={() => setShowCustomRoom(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-purple-600 border border-purple-300 hover:bg-purple-50 transition-all"
                >
                  + Add Custom Room
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddCustomRoom}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomRoom(false);
                      setCustomRoomName("");
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Total House Area */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📐 Total Area of the House (sq ft)
              </label>
              <input
                type="number"
                value={data.totalHouseArea}
                onChange={(e) =>
                  setData({
                    ...data,
                    totalHouseArea: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">This is the total built-up area of your house</p>
            </div>

            {/* Area Input Fields */}
            <div className="space-y-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900">📏 Enter Area for Each Room</h2>
              
              {selectedRooms.map((room) => {
                const roomKey = getRoomKey(room);
                const isCustom = !roomKey;
                let value: number = 0;
                
                if (isCustom) {
                  value = data.customRooms.find((r) => r.name === room)?.area || 0;
                } else if (roomKey) {
                  const dataValue = data[roomKey as keyof EstimationData];
                  value = typeof dataValue === "number" ? dataValue : 0;
                }

                return (
                  <div key={room} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        {room} Area (sq ft)
                      </label>
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveCustomRoom(room)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        const newValue = Number(e.target.value) || 0;
                        if (isCustom) {
                          setData((prev) => ({
                            ...prev,
                            customRooms: prev.customRooms.map((r) =>
                              r.name === room ? { ...r, area: newValue } : r
                            ),
                          }));
                        } else {
                          setData({
                            ...data,
                            [roomKey!]: newValue,
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("bhk")}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("materials")}
                disabled={selectedRooms.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Item Selection
  if (step === "materials") {
    const allSelected = materialDepartments.length > 0 && 
      materialDepartments.every(m => data.selectedMaterials.includes(m));

    const handleSelectAll = () => {
      if (allSelected) {
        setData({ ...data, selectedMaterials: [] });
      } else {
        setData({ ...data, selectedMaterials: [...materialDepartments] });
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Select Items
            </h1>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">Step 3 of 5: Choose items you need</p>
              
              {/* Select All Button */}
              <button
                onClick={handleSelectAll}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  allSelected
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-md"
                    : "bg-blue-500 hover:bg-blue-600 text-white shadow-md"
                }`}
              >
                {allSelected ? "✓ Deselect All" : "☑️ Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {materialDepartments.map((material) => {
                const displayText = material === "MISCELLENIOUS" 
                  ? `${material} (Other Items)` 
                  : material;

                return (
                  <button
                    key={material}
                    onClick={() => toggleMaterial(material)}
                    className={`p-4 rounded-lg font-semibold text-sm transition-all ${
                      data.selectedMaterials.includes(material)
                        ? "bg-orange-500 text-white shadow-lg ring-2 ring-orange-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {displayText}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("areas")}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("items")}
                disabled={data.selectedMaterials.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Item Selection
  if (step === "items") {
    const allMaterialsSelected = 
      materialDepartments.length > 0 && 
      materialDepartments.every(m => data.selectedMaterials.includes(m));

    const availableItemsForAddMore = allMaterialsSelected 
      ? availableItems 
      : filteredItems;

    const itemsNotSelected = availableItemsForAddMore.filter(
      (item) => !data.selectedItems.some((si) => si.itemName === item.itemName && si.dept === item.dept)
    );

    const handleSaveEdit = () => {
      if (editingItem && editingIndex !== null) {
        const updated = [...data.selectedItems];
        updated[editingIndex] = editingItem;
        setData({ ...data, selectedItems: updated });
        setEditingItem(null);
        setEditingIndex(null);
      }
    };

    const handleCancelEdit = () => {
      setEditingItem(null);
      setEditingIndex(null);
    };

    const handleAddItemFromList = (item: RateCardItem) => {
      const newItem: SelectedItem = { ...item, qty: 1, total: item.elemantraRate };
      setData({
        ...data,
        selectedItems: [...data.selectedItems, newItem],
      });
      setShowAddMore(false);
    };

    const getUniqueCategories = (item: RateCardItem): string[] => {
      // Get all items with same name and dept to find available categories
      const similar = availableItemsForAddMore.filter(
        (i) => i.itemName === item.itemName && i.dept === item.dept
      );
      const categorySet = new Set(similar.map(i => i.category || "Standard"));
      const categories = Array.from(categorySet);
      return categories;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configure Items
            </h1>
            <p className="text-gray-600 mb-8">
              Step 4 of 5: Add items and customize their specifications
            </p>

            {/* Selected Items List */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Selected Items ({data.selectedItems.length})
              </h2>

              {editingIndex !== null && editingItem ? (
                // Edit Mode
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Editing: {editingItem.itemName}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Category/Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type/Category
                      </label>
                      <select
                        value={editingItem.category || "Standard"}
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          // Find the item with this category
                          const matchingItem = availableItemsForAddMore.find(
                            (i) =>
                              i.itemName === editingItem.itemName &&
                              i.dept === editingItem.dept &&
                              (i.category || "Standard") === newCategory
                          );
                          if (matchingItem) {
                            setEditingItem({
                              ...editingItem,
                              ...matchingItem,
                              qty: editingItem.qty,
                              total: editingItem.qty * matchingItem.elemantraRate,
                            });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {getUniqueCategories(editingItem).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setEditingItem({
                              ...editingItem,
                              qty: Math.max(1, editingItem.qty - 1),
                              total:
                                Math.max(1, editingItem.qty - 1) *
                                editingItem.elemantraRate,
                            })
                          }
                          className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
                        >
                          <Minus size={18} />
                        </button>
                        <input
                          type="number"
                          value={editingItem.qty}
                          onChange={(e) => {
                            const qty = Math.max(1, Number(e.target.value) || 1);
                            setEditingItem({
                              ...editingItem,
                              qty,
                              total: qty * editingItem.elemantraRate,
                            });
                          }}
                          className="flex-1 px-4 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          onClick={() =>
                            setEditingItem({
                              ...editingItem,
                              qty: editingItem.qty + 1,
                              total:
                                (editingItem.qty + 1) *
                                editingItem.elemantraRate,
                            })
                          }
                          className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Rate Info */}
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">
                        Rate: ₹{editingItem.elemantraRate}/{editingItem.uom || "unit"}
                      </p>
                      <p className="text-lg font-semibold text-orange-600">
                        Total: ₹{editingItem.total.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="border border-gray-200 rounded-lg divide-y">
                  {data.selectedItems.length > 0 ? (
                    data.selectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {item.itemName}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {item.dept}
                              {item.category && ` • ${item.category}`}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              ₹{item.elemantraRate}/{item.uom || "unit"} × {item.qty}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">
                              ₹{item.total.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem({ ...item });
                              setEditingIndex(idx);
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <X size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-gray-500 text-center">No items selected yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Add More Items Section */}
            {editingIndex === null && (
              <div className="mb-8">
                <button
                  onClick={() => setShowAddMore(!showAddMore)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <Plus size={20} />
                  {showAddMore ? "Hide Available Items" : "Add More Items"}
                </button>

                {showAddMore && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Available Items to Add
                    </h3>
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                      {itemsNotSelected.length > 0 ? (
                        itemsNotSelected.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.itemName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.dept}
                                {item.category && ` • ${item.category}`}
                              </p>
                              <p className="text-sm text-orange-600 font-medium">
                                ₹{item.elemantraRate}/{item.uom || "unit"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddItemFromList(item)}
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors ml-2"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          All available items have been added
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Total Amount:
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep("materials")}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("boq")}
                disabled={data.selectedItems.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Generate BOQ <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: BOQ Review and Download
  if (step === "boq") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your BOQ - {data.bhk}
            </h1>
            <p className="text-gray-600 mb-8">Step 5 of 5: Review and download</p>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">BHK</p>
                <p className="text-2xl font-bold text-blue-600">{data.bhk}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Location</p>
                <p className="text-lg font-bold text-green-600">{data.location}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Items</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.selectedItems.length}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{totalAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* BOQ Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.selectedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.dept}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateQty(idx, item.qty - 1)}
                            className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              handleUpdateQty(idx, Number(e.target.value) || 1)
                            }
                            className="w-10 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
                          />
                          <button
                            onClick={() => handleUpdateQty(idx, item.qty + 1)}
                            className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        ₹{item.elemantraRate.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        ₹{item.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-orange-600">
                      ₹{totalAmount.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setStep("items")}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Edit Items
              </button>
              <button
                onClick={() => handleDownload("excel")}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Excel
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
