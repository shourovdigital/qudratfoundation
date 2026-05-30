import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-sand-light pt-20 pb-10 border-t border-heritage-green/10 mt-24">
      <div className="container-page grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h2 className="font-display text-2xl md:text-3xl text-heritage-green leading-tight mb-5">
            Help us change the narrative<br />of tomorrow's Bangladesh.
          </h2>
          <div className="flex flex-wrap gap-8 mt-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Email</p>
              <p className="text-heritage-green font-semibold">hello@odhikar.org</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Location</p>
              <p className="text-heritage-green font-semibold">Gulshan-2, Dhaka</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-5 text-sm">Organization</h4>
          <ul className="space-y-3 text-sm text-ink-soft">
            <li><Link to="/about" className="hover:text-heritage-red">About Us</Link></li>
            <li><Link to="/organogram" className="hover:text-heritage-red">Our Team</Link></li>
            <li><Link to="/projects" className="hover:text-heritage-red">Active Projects</Link></li>
            <li><Link to="/portfolio" className="hover:text-heritage-red">Portfolio</Link></li>
            <li><Link to="/volunteer" className="hover:text-heritage-red">Become a Volunteer</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-5 text-sm">Get Involved</h4>
          <ul className="space-y-3 text-sm text-ink-soft">
            <li><Link to="/donate" className="hover:text-heritage-red">Donate</Link></li>
            <li><Link to="/contact" className="hover:text-heritage-red">Contact Us</Link></li>
            <li><Link to="/login" className="hover:text-heritage-red">Member Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-page mt-16 pt-6 border-t border-heritage-green/10 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-ink-soft/70">
        <p>© {new Date().getFullYear()} Qudrat Foundation</p>
        <p>Crafting Hope for the Nation</p>
      </div>
    </footer>
  );
}
