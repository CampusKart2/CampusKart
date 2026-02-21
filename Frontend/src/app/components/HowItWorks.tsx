import { Mail, ShoppingCart, Handshake } from 'lucide-react';

const steps = [
  {
    icon: Mail,
    title: 'Verify with .edu Email',
    description: 'Sign up with your university email address to join your campus community',
  },
  {
    icon: ShoppingCart,
    title: 'Buy or List Items',
    description: 'Browse listings or post your own items for sale with just a few clicks',
  },
  {
    icon: Handshake,
    title: 'Meet on Campus & Rate',
    description: 'Complete transactions safely on campus and build your seller reputation',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[#F9FAFB] py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-4xl font-semibold text-[#111827] mb-12 text-center">
          How CampusKart Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-24 h-24 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Icon className="w-12 h-12 text-[#1E3A8A]" />
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#6B7280] leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
