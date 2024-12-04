import React, { useState } from 'react';
import { ArrowLeft, Search, Barcode, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const NewIncome: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState('000012');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const { categories, loading, error } = useCategories();

  // Фильтруем только категории сотрудников (row === 2)
  const employeeCategories = categories.filter(c => c.row === 2 && c.isVisible !== false);

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
              <h1 className="text-xl font-semibold text-gray-900">Приход новый</h1>
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

            {/* Поставщик */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сотрудник
              </label>
              <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Выберите сотрудника</option>
                {loading ? (
                  <option disabled>Загрузка...</option>
                ) : (
                  employeeCategories.map((category) => (
                    <option key={category.id} value={category.title}>
                      {category.title}
                    </option>
                  ))
                )}
              </select>
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
        <div className="mt-8 flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-sm">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <div className="text-4xl text-gray-400">📦</div>
          </div>
          <p className="text-gray-500 text-lg">Добавьте товары</p>
        </div>

        {/* Нижняя панель */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="grid grid-cols-3 gap-4 text-center flex-1">
                <div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-500">Кол-во</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-500">Сумма</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">0,00</div>
                  <div className="text-xs text-gray-500">Итого</div>
                </div>
              </div>
              <button className="ml-4 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};