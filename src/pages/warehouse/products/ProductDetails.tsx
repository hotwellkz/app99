import React, { useState, useEffect } from 'react';
import { ArrowLeft, Barcode, Camera, Plus, Minus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product } from '../../../types/product';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';

export const ProductDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          setProduct(productData);
          setQuantity(productData.quantity || 0);
        } else {
          setError('Товар не найден');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Ошибка при загрузке товара');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleQuantityChange = async (newQuantity: number) => {
    if (!product || newQuantity < 0) return;
    
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        quantity: newQuantity
      });
      setQuantity(newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleDelete = async () => {
    if (!product?.id) return;
    
    try {
      await deleteDoc(doc(db, 'products', product.id));
      showSuccessNotification('Товар успешно удален');
      navigate('/warehouse/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      showErrorNotification('Ошибка при удалении товара');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Товар не найден</h2>
          <button
            onClick={() => navigate('/warehouse/products')}
            className="mt-4 text-emerald-600 hover:text-emerald-700"
          >
            Вернуться к списку товаров
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/warehouse/products')}>
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Редактирование товара</h1>
            </div>
            <div className="flex items-center gap-3">
              <button>
                <Barcode className="w-6 h-6 text-gray-600" />
              </button>
              <button>
                <Camera className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="px-4 py-2 bg-gray-50 border-t">
            <p className="text-sm text-gray-600">Основной склад</p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{product.category}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                В наличии
              </div>
            </div>
          </div>
        </div>

        {/* Штрих-код */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium mb-2">Штрих-код</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{product.id}</span>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Barcode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Количество */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Количество</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
                disabled={quantity <= 0}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-semibold">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <span className="text-gray-500">{product.unit}</span>
          </div>
        </div>

        {/* История операций */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-2">История операций</h3>
          <div className="text-center text-gray-500 py-4">
            История операций пуста
          </div>
          
          {/* Кнопка удаления */}
          <div className="mt-8 border-t pt-8">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Удалить товар
            </button>
          </div>
        </div>
      </div>
      
      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Удаление товара</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить товар "{product?.name}"? Это действие нельзя будет отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};