import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Barcode, Paperclip, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/product';
import { ProjectSelector } from '../../components/warehouse/ProjectSelector';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';

interface ExpenseItem {
  product: Product;
  quantity: number;
}

export const NewExpense: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState('000003');
  const [selectedProject, setSelectedProject] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Проверяем наличие предварительно выбранного проекта
    const state = location.state as { selectedProject?: string };
    if (state?.selectedProject) {
      setSelectedProject(state.selectedProject);
    }
  }, [location.state]);

  useEffect(() => {
    const state = location.state as { addedProduct?: ExpenseItem };
    if (state?.addedProduct) {
      setItems(prev => [...prev, state.addedProduct]);
      // Очищаем состояние, чтобы избежать дублирования при навигации
      navigate('.', { replace: true });
    }
  }, [location.state, navigate]);
  const handleAddProducts = () => {
    navigate('/warehouse/products', { state: 'expense' });
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      showErrorNotification('Выберите проект');
      return;
    }

    if (items.length === 0) {
      showErrorNotification('Добавьте товары');
      return;
    }

    setLoading(true);
    try {
      // Получаем информацию о проекте
      const projectDoc = await getDoc(doc(db, 'categories', selectedProject));
      if (!projectDoc.exists()) {
        throw new Error('Проект не найден');
      }
      const projectData = projectDoc.data();

      // Создаем транзакции для каждого товара
      for (const item of items) {
        // Списание со склада
        await addDoc(collection(db, 'transactions'), {
          categoryId: selectedProject,
          fromUser: 'Склад',
          toUser: projectData.title,
          amount: -(item.quantity * (item.product.averagePurchasePrice || 0)),
          description: `Списание со склада: ${item.product.name} (${item.quantity} ${item.product.unit})`,
          type: 'expense',
          date: serverTimestamp(),
          isWarehouseOperation: true
        });

        // Обновляем количество товара на складе
        const productRef = doc(db, 'products', item.product.id);
        await updateDoc(productRef, {
          quantity: (item.product.quantity || 0) - item.quantity
        });
      }

      showSuccessNotification('Товары успешно списаны на проект');
      navigate('/warehouse');
    } catch (error) {
      console.error('Error submitting expense:', error);
      showErrorNotification('Ошибка при списании товаров');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const amount = items.reduce((sum, item) => sum + (item.quantity * (item.product.averagePurchasePrice || 0)), 0);
    const total = amount;
    return { quantity, amount, total };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/warehouse')} className="text-gray-600">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Расход новый</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-600">
                <Search className="w-6 h-6" />
              </button>
              <button className="text-gray-600">
                <Barcode className="w-6 h-6" />
              </button>
              <button className="text-gray-600">
                <span className="text-xl">⋮</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Форма */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 space-y-4">
            {/* Дата и номер документа */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата документа
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер документа
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Покупатель */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Проект
              </label>
              <ProjectSelector
                value={selectedProject}
                onChange={setSelectedProject}
              />
            </div>

            {/* Примечание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Примечание
              </label>
              <div className="relative">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
                <button className="absolute right-2 bottom-2 text-gray-400">
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Список товаров */}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-4xl text-gray-400">📦</div>
              </div>
              <p className="text-gray-500 text-lg">Добавьте товары</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.quantity} {item.product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {(item.quantity * (item.product.averagePurchasePrice || 0)).toLocaleString()} ₸
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.product.averagePurchasePrice?.toLocaleString()} ₸/{item.product.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>

        {/* Нижняя панель */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="grid grid-cols-3 gap-4 text-center flex-1">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totals.quantity}</div>
                  <div className="text-xs text-gray-500">Кол-во</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totals.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Сумма</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{totals.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Итого</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedProject || items.length === 0}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-300"
                >
                  {loading ? 'Отправка...' : 'Отправить на проект'}
                </button>
                <button 
                  onClick={handleAddProducts}
                  className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-600 transition-colors"
                >
                  <span className="text-2xl">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};