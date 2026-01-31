import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-black text-white p-4 flex flex-col sm:flex-row">
      <h2 className="text-xl font-bold">ISABELLA</h2>

      <div className="sm:ml-auto flex flex-col sm:flex-row">
        <Link className="p-2" to="/">Inicio</Link>
        <Link className="p-2" to="/servicios">Servicios</Link>
      </div>
    </nav>
  );
}

export default Navbar;
