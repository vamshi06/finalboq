export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">About Elemantra</h1>
          <p className="text-xl text-gray-300">
            Revolutionizing interior design estimation with AI and technology
          </p>
        </div>
      </div>

      {/* About Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Mission Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Elemantra is dedicated to transforming the interior design industry by providing
            intelligent, efficient, and transparent solutions for project estimation. We believe
            that technology should simplify complex processes and empower professionals to make
            better decisions faster.
          </p>
        </div>

        {/* Vision Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            To become the go-to platform for interior designers, contractors, and homeowners
            for accurate, fast, and reliable project estimation and material planning across
            India and beyond.
          </p>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Us?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Accuracy</h3>
                <p className="text-gray-600">
                  Our AI-powered system ensures highly accurate BOQ generation with minimal
                  manual errors.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Speed</h3>
                <p className="text-gray-600">
                  Generate complete BOQs in minutes instead of hours, saving valuable time.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Cost Efficiency</h3>
                <p className="text-gray-600">
                  Real-time market rates and location-specific pricing for accurate cost
                  estimates.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔧</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Flexibility</h3>
                <p className="text-gray-600">
                  Full control to edit and customize BOQs according to your specific needs.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Comprehensive</h3>
                <p className="text-gray-600">
                  Complete material database covering all aspects of interior design projects.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤝</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Support</h3>
                <p className="text-gray-600">
                  Dedicated support team ready to help you with any queries or issues.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Team</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Elemantra is built by a talented team of engineers, designers, and industry
            experts who are passionate about revolutionizing the construction and interior
            design industry. With years of combined experience, we understand the challenges
            of the industry and have built solutions that truly matter.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-900">
              <strong>Join us in our mission</strong> to make interior design estimation
              faster, smarter, and more accessible to everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
