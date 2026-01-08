import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/Navbar";
import { Link } from "react-router-dom";
import { Menu, X, User } from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/chat",
  },
  {
    label: "History",
    href: "#history",
  },
  {
    label: "Templates",
    href: "#templates",
  },
  {
    label: "Settings",
    href: "#settings",
  },
];

function ChatNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            ArchiGen
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-1 items-center">
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.label}>
                    <Link to={item.href} className="group">
                      <NavigationMenuLink className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium">
                        {item.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                <User size={18} />
                <span>Profile</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 my-2 pt-2">
              <button className="flex w-full items-center gap-2 px-4 py-3 text-gray-700 hover:text-blue-600 font-medium">
                <User size={18} /> Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default ChatNavbar;
