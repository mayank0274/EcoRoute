import { Route, Map } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const activePath = location.pathname;

  const navItems = [
    { id: 'routes', label: 'ROUTES', icon: Route, route: "/" },
    { id: 'share-location', label: 'Share/Track Location', icon: Map, route: "/share-location" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-max">
      <div className="bg-surface-container-lowest md:rounded-2xl md:ambient-shadow md:border md:border-border/50 flex items-center justify-around md:justify-center gap-1.5 md:gap-2 p-2 md:p-1.5 px-4 md:px-2 rounded-t-[2rem] w-full">
        {navItems.map((item) => {
          const isActive = activePath === item.route;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.route}
              className={`
                flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-xl transition-all duration-300
                ${isActive
                  ? 'bg-primary text-primary-foreground ambient-shadow scale-[1.02]'
                  : 'text-secondary hover:bg-muted/50'
                }
              `}
            >
              <div className={`
                p-1 rounded-full
                ${isActive ? 'bg-primary-foreground/20' : ''}
              `}>
                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`
                text-[9px] md:text-[11px] font-extrabold tracking-wider
                ${isActive ? 'opacity-100' : 'opacity-70'}
              `}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
