"use client"

import { Link } from 'react-router-dom'
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavMenu } from '../../context/NavMenuContext'

export function NavMenu() {
  const [activeMenu, setActiveMenu] = useState(null)
  const { menuItems, isLoading, fetchMenuItems } = useNavMenu()

  useEffect(() => {
    fetchMenuItems()
  }, [fetchMenuItems])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!menuItems || Object.keys(menuItems).length === 0) {
    return <div>No menu items available</div>
  }

  return (
    <nav className="relative">
      {/* Mobile Menu Button */}
      <div className="lg:hidden py-2">
        <button 
          onClick={() => setActiveMenu(activeMenu ? null : 'menu')}
          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
        >
          Menu
        </button>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex justify-center gap-8 py-4">
        {Object.keys(menuItems).map((item) => (
          <div
            key={item}
            className="relative"
            onMouseEnter={() => setActiveMenu(item)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="text-gray-700 hover:text-[#101b2f] uppercase">
              {item}
            </button>

            <AnimatePresence>
              {activeMenu === item && menuItems[item] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 w-[90vw] max-w-7xl bg-white shadow-lg rounded-lg overflow-hidden"
                >
                  <div className="grid grid-cols-12 gap-8 p-8">
                    {/* Categories Section */}
                    <div className="col-span-4">
                      <h3 className="font-semibold text-[#101b2f] mb-4">Categories</h3>
                      <ul className="space-y-3">
                        {menuItems[item].categories?.map((category) => (
                          <li key={category.name} className="group">
                            <Link
                              to={category.link || `/${item}/${category.name.toLowerCase().replace(" ", "-")}`}
                              className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            >
                              <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-gray-600 group-hover:text-[#101b2f]">
                                {category.name}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Featured Section */}
                    <div className="col-span-4">
                      <h3 className="font-semibold text-[#101b2f] mb-4">Featured</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {menuItems[item].featured?.map((feature) => (
                          <Link
                            key={feature.name}
                            to={feature.link || '#'}
                            className="group"
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden">
                              <img
                                src={feature.image}
                                alt={feature.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              {feature.tag && (
                                <div className="absolute top-2 right-2 bg-[#101b2f] text-white text-xs px-2 py-1 rounded">
                                  {feature.tag}
                                </div>
                              )}
                            </div>
                            <h4 className="mt-2 text-sm font-medium text-gray-900">{feature.name}</h4>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Promo Section */}
                    <div className="col-span-4">
                      <div className="relative h-full rounded-lg overflow-hidden">
                        <img
                          src={menuItems[item].promoImage}
                          alt={`${item} promotion`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="text-lg font-semibold mb-2">{menuItems[item].promoTitle}</h3>
                          <p className="text-sm mb-3">{menuItems[item].promoDescription}</p>
                          <button className="bg-white text-[#101b2f] px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
                            {menuItems[item].promoButtonText}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {activeMenu === 'menu' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white shadow-lg"
          >
            {Object.keys(menuItems).map((item) => (
              <Link
                key={item}
                to={`/${item}`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 uppercase"
              >
                {item}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
} 