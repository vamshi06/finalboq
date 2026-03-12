export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-gray-300">
            Comprehensive interior design and estimation solutions for your home
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Service 1 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">BOQ Generation</h3>
            <p className="text-gray-600">
              Automated Bill of Quantities generation using AI-powered analysis and
              our master rate card database.
            </p>
          </div>

          {/* Service 2 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Cost Estimation</h3>
            <p className="text-gray-600">
              Accurate cost estimates for your interior design projects with location-based
              pricing and market rates.
            </p>
          </div>

          {/* Service 3 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Material Tracking</h3>
            <p className="text-gray-600">
              Complete tracking of materials, quantities, and costs across different
              categories and projects.
            </p>
          </div>

          {/* Service 4 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Custom Modifications</h3>
            <p className="text-gray-600">
              Edit and modify BOQs after generation to match your specific requirements
              and preferences.
            </p>
          </div>

          {/* Service 5 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-format Export</h3>
            <p className="text-gray-600">
              Export your BOQs in multiple formats including PDF and Excel for easy
              sharing and further processing.
            </p>
          </div>

          {/* Service 6 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Chatbot</h3>
            <p className="text-gray-600">
              Intelligent chatbot assistance for queries about materials, costs,
              and design recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
