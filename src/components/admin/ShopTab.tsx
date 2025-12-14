/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

export default function ShopTab() {
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [activeSubTab, setActiveSubTab] = useState<'products' | 'orders'>('products');
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // New Product Form
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Merchandise',
        image_url: '',
        stock: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchOrders(); // Fetch orders initially too
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/shop/products?admin=true');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
        setLoading(false);
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/shop/orders?admin=true');
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        }
    };

    const handleAddProduct = async () => {
        try {
            const res = await fetch('/api/shop/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewProduct({ name: '', description: '', price: '', category: 'Merchandise', image_url: '', stock: '' });
                fetchProducts();
            }
        } catch (error) {
            console.error('Failed to add product', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Sub Tabs */}
            <div className="flex space-x-4 border-b pb-2">
                <button
                    onClick={() => setActiveSubTab('products')}
                    className={`pb-2 px-1 ${activeSubTab === 'products' ? 'border-b-2 border-slate-900 font-bold' : 'text-slate-500'}`}
                >
                    Products
                </button>
                <button
                    onClick={() => setActiveSubTab('orders')}
                    className={`pb-2 px-1 ${activeSubTab === 'orders' ? 'border-b-2 border-slate-900 font-bold' : 'text-slate-500'}`}
                >
                    Orders
                </button>
            </div>

            {/* Products View */}
            {activeSubTab === 'products' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Shop Inventory</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
                        >
                            + Add Product
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">Loading products...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col">
                                    <div className="h-40 bg-gray-100 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400">No Image</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                                    <p className="text-sm text-gray-600 mb-4 flex-grow">{product.description}</p>
                                    <div className="flex justify-between items-center mt-auto">
                                        <span className="font-bold text-lg">₹{product.price}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            Stock: {product.stock}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Orders View */}
            {activeSubTab === 'orders' && (
                <div>
                    <h2 className="text-xl font-bold mb-6">Order History</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchise ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">#{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{order.franchise_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">₹{order.total_amount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Add New Product</h3>
                        <div className="space-y-4">
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="Product Name"
                                value={newProduct.name}
                                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                            <textarea
                                className="w-full p-2 border rounded"
                                placeholder="Description"
                                rows={3}
                                value={newProduct.description}
                                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    placeholder="Price (₹)"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                />
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    placeholder="Stock"
                                    value={newProduct.stock}
                                    onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                />
                            </div>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="Image URL (Optional)"
                                value={newProduct.image_url}
                                onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })}
                            />
                            <select
                                className="w-full p-2 border rounded"
                                value={newProduct.category}
                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                            >
                                <option value="Merchandise">Merchandise</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Marketing">Marketing Material</option>
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddProduct}
                                className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
                            >
                                Save Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
