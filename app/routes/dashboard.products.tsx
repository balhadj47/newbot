import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import MainLayout from "~/components/layout/MainLayout";
import { getCategories, getProducts } from "~/utils/db.server";

export const loader = async () => {
  const categories = getCategories();
  const products = getProducts();
  
  return json({ categories, products });
};

export default function ProductsPage() {
  const { categories, products } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  
  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter((product: any) => product.category_id === selectedCategory)
    : products;
    
  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };
  
  // Handle product form submission
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    if (currentProduct) {
      // Update existing product
      formData.append("action", "update");
      formData.append("target", "product");
      formData.append("id", currentProduct.id.toString());
    } else {
      // Create new product
      formData.append("action", "create");
      formData.append("target", "product");
    }
    
    fetcher.submit(formData, { 
      method: "post", 
      action: "/api/products" 
    });
    
    // Close modal after submission
    setShowAddProductModal(false);
    setShowEditProductModal(false);
    setCurrentProduct(null);
  };
  
  // Handle delete product
  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("target", "product");
      formData.append("id", productId.toString());
      
      fetcher.submit(formData, { 
        method: "post", 
        action: "/api/products" 
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Products</h1>
          <button
            onClick={() => {
              setCurrentProduct(null);
              setShowAddProductModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Add Product
          </button>
        </div>
        
        {/* Categories Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
            >
              All
            </button>
            {categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: any) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2.5 py-0.5 rounded">
                    {getCategoryName(product.category_id)}
                  </span>
                  <h3 className="text-xl font-semibold mt-2 text-gray-800 dark:text-white">{product.name}</h3>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{product.price.toLocaleString()} DA</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{product.description}</p>
              <div className="flex mt-4 space-x-2">
                <button
                  onClick={() => {
                    setCurrentProduct(product);
                    setShowEditProductModal(true);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No products found in this category.</p>
            </div>
          )}
        </div>
        
        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Add New Product</h2>
              
              <form onSubmit={handleProductSubmit}>
                <div className="mb-4">
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g. 1000 MB"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (DA)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g. 1000"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Product description..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Edit Product Modal */}
        {showEditProductModal && currentProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Edit Product</h2>
              
              <form onSubmit={handleProductSubmit}>
                <div className="mb-4">
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    defaultValue={currentProduct.category_id}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={currentProduct.name}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (DA)
                  </label>
                  <input
                    type="number"                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={currentProduct.price}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={currentProduct.description}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={currentProduct.is_active}
                      value="true"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditProductModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
