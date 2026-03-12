"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import BoqChat from "./ui/BoqChat";

export default function Home() {
  const { session, loading } = useAuth();
  const [hasGenerated, setHasGenerated] = useState(false);
  const [location, setLocation] = useState<string>("Wadala");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Main Chat Section */}
      <section className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasGenerated && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold shadow-sm mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                AI-Powered BOQ Generation
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                Interior Designing{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Playbook
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
                Generate professional BOQ instantly with AI. Get expert suggestions and export to PDF/Excel.
              </p>

              {/* Quick Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
                  <span className="text-xl">⚡</span>
                  <span className="text-sm font-medium text-slate-700">Instant Generation</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
                  <span className="text-xl">🤖</span>
                  <span className="text-sm font-medium text-slate-700">AI-Powered</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
                  <span className="text-xl">📊</span>
                  <span className="text-sm font-medium text-slate-700">Export Ready</span>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto">
            <BoqChat
              onFirstResult={() => setHasGenerated(true)}
              location={location}
              onLocationChange={setLocation}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Interior Playbook?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Professional interior design solutions powered by cutting-edge AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mb-6">💰</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cost Estimation</h3>
              <p className="text-slate-600 leading-relaxed">
                Get accurate cost estimates for your interior projects with real-time pricing and location-based rates.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mb-6">🎨</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Material Guidance</h3>
              <p className="text-slate-600 leading-relaxed">
                Expert recommendations on tiles, paint, fixtures, and more. Make informed decisions with AI assistance.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mb-6">📋</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Professional BOQ</h3>
              <p className="text-slate-600 leading-relaxed">
                Generate comprehensive Bill of Quantities with detailed breakdowns, ready to share with contractors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get your professional BOQ in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Tell Us Your Needs</h3>
                <p className="text-slate-600">
                  Share your project details, area size, and requirements through our AI chat interface.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Generates BOQ</h3>
                <p className="text-slate-600">
                  Our AI analyzes your requirements and creates a detailed, accurate BOQ with smart suggestions.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Download & Share</h3>
                <p className="text-slate-600">
                  Review, edit if needed, and export your BOQ as PDF or Excel to share with contractors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Space?</h2>
          <p className="text-xl mb-8 text-orange-100">
            Start your interior design journey today with AI-powered BOQ generation
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <Link
                href="/estimation"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-orange-600 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Go to Estimation
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-orange-600 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white text-white font-semibold text-lg hover:bg-white/20 transition-all duration-200"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-white text-xl">
                  I
                </div>
                <span className="text-xl font-bold text-white">Interior Playbook</span>
              </div>
              <p className="text-slate-400 mb-4">
                Professional interior design solutions powered by AI. Transform your space with accurate estimates and expert guidance.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/estimation" className="hover:text-orange-400 transition-colors">Estimation</Link></li>
                <li><Link href="/services" className="hover:text-orange-400 transition-colors">Services</Link></li>
                <li><Link href="/materials" className="hover:text-orange-400 transition-colors">Materials</Link></li>
                <li><Link href="/about" className="hover:text-orange-400 transition-colors">About</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-2 text-slate-400">
                <li>Email: info@elemantra.com</li>
                <li>Phone: +91 XXXXX XXXXX</li>
                <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact Form</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Elemantra. All rights reserved. Interior Designing | AI-powered BOQ Generation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
