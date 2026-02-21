import { Shield, CheckCircle, MapPin, Users } from 'lucide-react';

const features = [
  { icon: CheckCircle, text: '.edu email verification' },
  { icon: Shield, text: 'User ratings & reviews' },
  { icon: Users, text: 'Scam-resistant closed community' },
  { icon: MapPin, text: 'Safe on-campus meetups' },
];

export function TrustSafety() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-xl hover:shadow-2xl p-12 relative overflow-hidden transition-shadow duration-300">
          {/* Decorative background accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#DBEAFE] to-transparent rounded-full blur-3xl opacity-30"></div>

          <div className="relative flex gap-16 items-center">
            {/* Shield icon */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-3xl flex items-center justify-center shadow-2xl">
                <Shield className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h2 className="text-4xl font-semibold text-[#111827] mb-6">
                Built for Students. Designed for Trust.
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
                      <div className="w-8 h-8 bg-[#D1FAE5] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <span className="text-[#111827] text-lg">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
