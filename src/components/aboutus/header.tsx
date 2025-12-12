'use client';

import React from 'react';

export default function Header() {
  return (
   <div className="bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-7xl font-bold mb-6 text-white tracking-tight">
              About <span className="text-red-200">Us</span>
            </h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto leading-relaxed">
              Discover the legacy, leadership, and values that define Theta Tau's Xi Chapter
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-red-50 to-transparent"></div>
      </div>
      </div>
  );
}