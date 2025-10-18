import Link from "next/link";
import { Camera, QrCode, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="gradient-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Split Bills
              <br />
              <span className="text-blue-200">Instantly</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              No IOUs. No awkward reminders. Just instant settlement with ADA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create-bills"
                className="btn-primary text-white px-8 py-4 rounded-xl text-lg font-semibold inline-block"
              >
                Create New Bill
              </Link>
              <Link
                href="/dashboard"
                className="bg-white/20  backdrop-blur text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/30 transition-all inline-block"
              >
                View My Bills
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Snap & Split</h3>
            <p className="text-gray-600">
              Photo your receipt, we&apos;ll handle the math (coming soon)
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Share & Pay</h3>
            <p className="text-gray-600">Links make splitting effortless.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Done & Settled</h3>
            <p className="text-gray-600">
              Instant settlement via smart contracts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
