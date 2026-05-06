import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { Mail, MapPin, Phone } from 'lucide-react';
import ContactForm from '@/components/ContactForm';

export const metadata = buildMetadata({
  title: 'Contact',
  description: 'Contact Roorq support for drops, orders, and delivery questions.',
  path: '/contact',
  keywords: ['contact', 'support', 'orders'],
});

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-12 text-center">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold uppercase mb-4">Get in Touch</h3>
              <p className="text-gray-600 mb-6">Have a question about a drop? Need help with an order? We're here.</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail className="w-5 h-5" />
                  <span>support@roorq.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-5 h-5" />
                  <span>IIT Roorkee Campus, Uttarakhand</span>
                </div>
              </div>
            </div>
            
            <div className="bg-black text-white p-6">
              <h4 className="font-bold uppercase mb-2">Response Time</h4>
              <p className="text-sm text-gray-400">We typically reply within 2 hours during waking hours (8 AM - 10 PM).</p>
            </div>
          </div>

          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}

