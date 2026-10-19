import { NavLink } from 'react-router-dom'

const link = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1 rounded ${isActive ? 'bg-white/25' : 'hover:bg-white/15'}`

export default function Header() {
  return (
    <header className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between gap-4">
      <div>
        <div className="text-xl font-semibold">Labeler Service</div>
        <div className="text-sm opacity-90">
          Единый шаблон. Печать PDF. Штрих-коды.
        </div>
      </div>
      <nav className="flex gap-2 text-sm">
        <NavLink to="/" end className={link} data-testid="nav-labels">Этикетки</NavLink>
        <NavLink to="/templates" className={link} data-testid="nav-templates">Шаблоны</NavLink>
      </nav>
    </header>
  );
}
