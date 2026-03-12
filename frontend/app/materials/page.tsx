export default function MaterialsPage() {
  const categories = [
    {
      name: "Civil Works",
      description: "Structural and civil materials",
      items: [
        "Bricks & Blocks",
        "Cement & Mortar",
        "Steel Bars",
        "Concrete Mix",
        "Flooring Tiles",
        "Wall Tiles",
      ],
    },
    {
      name: "Painting",
      description: "Interior and exterior paints",
      items: ["Emulsion Paint", "Enamel Paint", "Primer", "Distemper", "Wood Polish"],
    },
    {
      name: "POP Work",
      description: "Plaster of Paris and drywall",
      items: ["POP Powder", "Gypsum Board", "Joint Compound", "Putty"],
    },
    {
      name: "Plumbing",
      description: "Water and sanitation fixtures",
      items: [
        "PVC Pipes",
        "Faucets",
        "Wash Basin",
        "Water Closet",
        "Shower",
        "Pipe Fittings",
      ],
    },
    {
      name: "Electrical",
      description: "Electrical fixtures and wiring",
      items: ["Wires & Cables", "Switches", "Outlets", "Light Fixtures", "Breakers"],
    },
    {
      name: "Carpentry",
      description: "Wooden and furniture items",
      items: ["Doors", "Windows", "Wardrobes", "Cabinets", "Shelving", "Wooden Flooring"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Materials Catalog</h1>
          <p className="text-xl text-gray-300">
            Browse our comprehensive collection of interior design materials
          </p>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((category, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{category.name}</h3>
                <p className="text-orange-100 text-sm">{category.description}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {category.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Our Rate Card</h2>
          <p className="text-gray-600 mb-4">
            Our comprehensive master rate card includes pricing for materials across all major categories:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Updated rates based on current market conditions
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Location-specific pricing multipliers
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Vendor and Elemantra rate comparisons
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Detailed specifications and UOM for each item
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
