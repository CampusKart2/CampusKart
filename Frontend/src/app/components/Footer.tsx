import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const footerSections = [
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press', 'Blog'],
  },
  {
    title: 'Support',
    links: ['FAQ', 'Contact', 'Help Center', 'Safety Tips'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Community Guidelines', 'Cookie Policy'],
  },
];

const socialIcons = [
  { Icon: Facebook, label: 'Facebook' },
  { Icon: Twitter, label: 'Twitter' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Linkedin, label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#1E3A8A] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-4 gap-12 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-white mb-4 text-lg">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[#BFDBFE] hover:text-white transition-colors duration-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social section */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">Follow Us</h3>
            <div className="flex gap-3">
              {socialIcons.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-300"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-[#BFDBFE] text-center">© 2026 CampusKart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
