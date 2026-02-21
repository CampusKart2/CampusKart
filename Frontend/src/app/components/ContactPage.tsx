import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, Send, FileWarning } from 'lucide-react';

export function ContactPage() {
  const [reportText, setReportText] = useState('');

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      toast.error('Please describe the issue.');
      return;
    }
    toast.success('Report received. We will get back to you shortly.');
    setReportText('');
    console.log('Report submitted:', reportText);
  };

  const handleBack = () => {
    window.location.hash = '';
  };

  return (
    <div className="bg-[#F9FAFB] dark:bg-gray-900 min-h-screen py-12">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-[#6B7280] dark:text-gray-400 hover:text-[#1E3A8A] dark:hover:text-blue-400 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to home
        </button>

        <h1 className="text-4xl font-bold text-[#111827] dark:text-white mb-2">Contact Us</h1>
        <p className="text-[#6B7280] dark:text-gray-400 mb-10">
          Get in touch with the CampusKart team. We&apos;re here to help.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#1E3A8A] dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-[#111827] dark:text-white">Email</h2>
            </div>
            <p className="text-[#6B7280] dark:text-gray-400 mb-1">General support</p>
            <a
              href="mailto:support@campuskart.com"
              className="text-[#1E3A8A] dark:text-blue-400 font-medium hover:underline"
            >
              support@campuskart.com
            </a>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="w-6 h-6 text-[#059669] dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-[#111827] dark:text-white">Campus Safety</h2>
            </div>
            <p className="text-[#6B7280] dark:text-gray-400 mb-1">Emergency & safety line</p>
            <a
              href="tel:+15551234567"
              className="text-[#1E3A8A] dark:text-blue-400 font-medium hover:underline"
            >
              (555) 000-0000
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileWarning className="w-6 h-6 text-[#1E3A8A] dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-[#111827] dark:text-white">Report an Issue</h2>
          </div>
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Describe the issue or concern..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-gray-900 text-[#111827] dark:text-gray-100 placeholder:text-[#6B7280] dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              Submit Report
            </button>
          </form>
        </div>

        <a
          href="#faq"
          className="inline-flex items-center gap-2 text-[#1E3A8A] dark:text-blue-400 font-medium hover:underline"
        >
          View FAQ →
        </a>
      </div>
    </div>
  );
}
