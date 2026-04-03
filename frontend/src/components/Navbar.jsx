import { useState } from 'react';
// 1. Import Link and useLocation from react-router-dom
import { Link, useLocation } from 'react-router-dom'; 
import { Type, Upload, Link as LinkIcon, Menu, X } from 'lucide-react';

const navItems = [
  { id: 'text', label: 'Text', href: '/', Icon: Type },
  { id: 'file', label: 'File', href: '/file', Icon: Upload },
  { id: 'link', label: 'Link', href: '/link', Icon: LinkIcon },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();


  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-teal-500 bg-clip-text text-transparent">
              Aspect Based Analyzer
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navItems.map(({ id, href, Icon, label }) => (
                // 5. Use Link from react-router-dom
                <Link
                  key={id}
                  to={href}
                  // onClick is removed
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    // 4. Compare the link's href with the current pathname
                    location.pathname === href
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20'
                      : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-teal-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white rounded-lg shadow-lg mt-2 mb-4 ring-1 ring-black ring-opacity-5">
              {navItems.map(({ id, href, Icon, label }) => (
                <Link
                  key={id}
                  to={href}
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    location.pathname === href
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                      : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}