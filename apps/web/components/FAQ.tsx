'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

type FaqCategory = 'orders' | 'shipping' | 'returns';

type FaqItem = {
  category: FaqCategory;
  question: string;
  answer: string;
};

const categories: { key: FaqCategory; label: string }[] = [
  { key: 'orders', label: 'Orders' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'returns', label: 'Returns' },
];

const faqs: FaqItem[] = [
  {
    category: 'orders',
    question: 'Can I cancel my order?',
    answer: 'You can cancel your order before dispatch. Contact support quickly and we will stop shipment.',
  },
  {
    category: 'orders',
    question: 'Can I change the shipping address on my order?',
    answer: 'Yes, if your order is not dispatched yet. Share your updated address with support.',
  },
  {
    category: 'orders',
    question: 'Can I add or remove an item from my order?',
    answer: 'Yes, before dispatch. Support can update your order and send the revised total.',
  },
  {
    category: 'shipping',
    question: 'When will my order be shipped?',
    answer: 'Orders are usually dispatched in 1-2 working days. Weekend and holiday orders ship next business day.',
  },
  {
    category: 'returns',
    question: 'Can I return my items?',
    answer: 'Return window is 2 days (48 hours) from delivery. After that, returns are not eligible.',
  },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('orders');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

  const handleCategoryChange = (category: FaqCategory) => {
    setActiveCategory(category);
    setOpenIndex(null);
  };

  return (
    <section className="py-20 max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-black uppercase tracking-tighter text-center mb-12">
        Frequently Asked Questions
      </h2>

      <div className="flex justify-center gap-8 mb-12 text-xs font-bold uppercase tracking-widest">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => handleCategoryChange(category.key)}
            className={
              activeCategory === category.key
                ? 'bg-black text-white px-6 py-2'
                : 'text-gray-400 hover:text-black transition-colors'
            }
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredFaqs.map((faq, idx) => (
          <div key={`${faq.category}-${idx}`} className="border-b border-gray-200">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex justify-between items-center py-4 text-left hover:bg-gray-50 transition px-2"
            >
              <span className="font-bold text-sm uppercase tracking-wide">{faq.question}</span>
              {openIndex === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="p-4 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
