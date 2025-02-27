import React, { useState, useEffect } from 'react';
import { useNavMenu } from '../../context/NavMenuContext';
import { useCategory } from '../../context/CategoryContext';

export function NavMenuManager() {
  const { menuItems, isLoading: menuLoading, error, fetchMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useNavMenu();
  const { categories, isLoading: categoriesLoading, fetchCategories } = useCategory();
  const [formData, setFormData] = useState({
    section: '',
    categories: [],
    featured: [],
    promoImage: 'default-image.jpg',
    promoTitle: '',
    promoDescription: '',
    promoButtonText: '',
    order: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, [fetchMenuItems, fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        categories: formData.categories
          .map(categoryId => {
            const category = categories.find(cat => cat._id === categoryId);
            if (!category) return null;
            return {
              id: parseInt(categoryId),
              name: category.category_name,
              image: category.image || 'default-category-image.jpg'
            };
          })
          .filter(Boolean),
        featured: formData.featured.map(item => ({
          name: item,
          image: 'default-featured-image.jpg'
        }))
      };

      if (editingId) {
        await updateMenuItem(editingId, formattedData);
      } else {
        await addMenuItem(formattedData);
      }
      
      setFormData({
        section: '',
        categories: [],
        featured: [],
        promoImage: 'default-image.jpg',
        promoTitle: '',
        promoDescription: '',
        promoButtonText: '',
        order: 0
      });
      setEditingId(null);
    } catch (err) {
      console.error('Error saving menu:', err);
    }
  };

  const handleEdit = (menuId) => {
    const menuItem = Object.entries(menuItems).find(([_, item]) => item.id === menuId);
    if (menuItem) {
      const [_, item] = menuItem;
      setFormData({
        section: item.section,
        categories: item.categories.map(cat => cat.id.toString()),
        featured: item.featured.map(f => f.name),
        promoImage: item.promoImage || 'default-image.jpg',
        promoTitle: item.promoTitle || '',
        promoDescription: item.promoDescription || '',
        promoButtonText: item.promoButtonText || '',
        order: item.order || 0
      });
      setEditingId(menuId);
    }
  };

  const handleDelete = async (menuId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteMenuItem(menuId);
      } catch (err) {
        console.error('Error deleting menu:', err);
      }
    }
  };

  const renderCategoryNames = (categoryIds) => {
    return categoryIds
      .map(catId => {
        const category = categories.find(c => c._id === catId);
        return category ? category.category_name : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const filteredCategories = categories.filter(category =>
    category.category_name.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  // Add debug logging to verify categories data
  console.log('Available categories:', categories);
  console.log('Selected categories:', formData.categories);

  if (menuLoading || categoriesLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Nav Menu Manager</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block mb-2">Section Name:</label>
          <input
            type="text"
            value={formData.section}
            onChange={(e) => setFormData({...formData, section: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 font-semibold">Categories:</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <div className="max-h-[200px] overflow-y-auto border rounded p-2">
              {filteredCategories.map(category => (
                <div key={category.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    checked={formData.categories.includes(category.id)}
                    onChange={(e) => {
                      const updatedCategories = e.target.checked
                        ? [...formData.categories, category.id]
                        : formData.categories.filter(id => id !== category.id);
                      setFormData({...formData, categories: updatedCategories});
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`category-${category.id}`} className="cursor-pointer">
                    {category.category_name}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Selected Categories:</span>{' '}
                {formData.categories.length > 0 
                  ? formData.categories.map(catId => {
                      const category = categories.find(c => c.id === catId);
                      return category ? category.category_name : '';
                    }).filter(Boolean).join(', ')
                  : 'No categories selected'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block mb-2">Featured Items (comma-separated):</label>
          <input
            type="text"
            value={formData.featured.join(',')}
            onChange={(e) => setFormData({
              ...formData, 
              featured: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
            })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Promo Image URL:</label>
          <input
            type="text"
            value={formData.promoImage}
            onChange={(e) => setFormData({...formData, promoImage: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Order:</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {editingId ? 'Update Menu' : 'Add Menu'}
        </button>
      </form>

      <div className="space-y-4">
        {Object.entries(menuItems).map(([section, item]) => (
          <div key={item.id} className="border p-4 rounded">
            <h3 className="font-bold">{section}</h3>
            <div className="text-sm text-gray-600 mt-1">
              <p><strong>Categories:</strong> {item.categories.map(cat => cat.name).join(', ')}</p>
              <p><strong>Featured:</strong> {item.featured.map(f => f.name).join(', ')}</p>
              <p><strong>Order:</strong> {item.order}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => handleEdit(item.id)}
                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(item.id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 