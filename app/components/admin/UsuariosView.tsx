'use client';
import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  UserPlusIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

export default function UsuariosView() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalEmpleado, setModalEmpleado] = useState(false);
  
  // Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('Cajero / Operador');
  const [mensaje, setMensaje] = useState('');

  // Cargar usuarios desde la base de datos al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEmpleados(data);
      }
    } catch (e) {
      console.error("Error al cargar usuarios:", e);
    } finally {
      setCargando(false);
    }
  };

  const registrarEmpleado = async (e: any) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;

    setMensaje("Guardando en la base de datos...");
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, rol, estado: 'Activo' })
      });

      if (res.ok) {
        setMensaje("¡Colaborador registrado permanentemente!");
        setModalEmpleado(false);
        setNombre(''); setEmail('');
        cargarUsuarios();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setMensaje("Error al registrar en el servidor.");
      }
    } catch (error) {
      setMensaje("Error de red con el backend.");
    }
  };

  const eliminarEmpleado = async (id: number, correoUser: string) => {
    // Validación extra en el frontend por seguridad
    if (correoUser === 'tu_correo_principal@gmail.com') {
       setMensaje("Denegado: No puedes eliminar la cuenta Root desde el sistema.");
       setTimeout(() => setMensaje(''), 4000);
       return;
    }

    if (confirm("¿Estás seguro de eliminar este usuario del sistema central?")) {
      try {
        const res = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' });
        
        if (res.ok) {
          setMensaje("Usuario eliminado correctamente.");
          cargarUsuarios();
        } else {
          // Si el trigger de la BD bloquea la acción, caerá aquí
          setMensaje("Error: No se pudo eliminar el usuario. (Posible cuenta protegida).");
        }
        setTimeout(() => setMensaje(''), 4000);

      } catch (e) {
        console.error("Error al eliminar:", e);
        setMensaje("Error de red al intentar eliminar.");
        setTimeout(() => setMensaje(''), 4000);
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black italic flex items-center gap-2">
            <ShieldCheckIcon className="w-7 h-7 text-[#E50914]" /> Gestión de Empleados y Permisos
          </h2>
          <p className="text-slate-400 text-xs mt-1">Control gerencial sincronizado directamente con la base de datos central.</p>
        </div>
        
        <button 
          onClick={() => setModalEmpleado(true)} 
          className="bg-[#E50914] hover:bg-[#b80710] text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Registrar Empleado
        </button>
      </div>

      {mensaje && (
        <div className={`mb-4 p-3 border text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
          mensaje.includes('Error') || mensaje.includes('Denegado') 
            ? 'bg-red-950/40 border-red-500/50 text-red-400' 
            : 'bg-[#1A1A1A] border-[#E50914]/40 text-[#E50914]'
        }`}>
          {mensaje.includes('Error') || mensaje.includes('Denegado') ? (
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircleIcon className="w-5 h-5 shrink-0" />
          )}
          <span>{mensaje}</span>
        </div>
      )}

      {/* Tabla de Empleados ERP */}
      <div className="bg-[#181818] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">Personal Autorizado en el Servidor</h3>
          <span className="text-xs bg-black px-3 py-1 rounded-full border border-white/10 text-slate-400 font-bold">{empleados.length} Registros</span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-slate-400 font-bold">Cargando personal autorizado...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-slate-400 uppercase font-black tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Correo Electrónico</th>
                  <th className="p-4">Rol / Permisos</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {empleados.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center font-black text-[#E50914]">
                        {emp.nombre ? emp.nombre.charAt(0) : 'U'}
                      </div>
                      {emp.nombre}
                    </td>
                    <td className="p-4 text-slate-300 font-mono">{emp.email}</td>
                    <td className="p-4">
                      <span className="bg-[#222] text-[#E50914] px-2.5 py-1 rounded-md font-black border border-white/5">
                        {emp.rol}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-green-950/50 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                        {emp.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {/* Opcional: Ocultar el botón si es tu propia cuenta principal */}
                      {emp.email !== 'tu_correo_principal@gmail.com' && (
                        <button 
                          onClick={() => eliminarEmpleado(emp.id, emp.email)} 
                          className="bg-red-950/30 hover:bg-red-900 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ml-auto"
                        >
                          <TrashIcon className="w-4 h-4" /> Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {empleados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay empleados registrados en el sistema.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Registrar Nuevo Empleado */}
      {modalEmpleado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setModalEmpleado(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-[#181818] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md z-50 text-white shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black italic text-[#E50914] mb-4 flex items-center gap-2">
              <UserPlusIcon className="w-6 h-6" /> Nuevo Colaborador
            </h3>
            <form onSubmit={registrarEmpleado} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                <input type="text" required placeholder="Ej: Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-3.5 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Correo Electrónico (Google Auth)</label>
                <input type="email" required placeholder="empleado@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Rol Asignado</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)} className="w-full p-3.5 bg-black rounded-xl border border-white/10 text-white font-bold outline-none focus:border-[#E50914]">
                  <option value="Cajero / Operador">Cajero / Operador (Registra pedidos)</option>
                  <option value="Supervisor de Inventario">Supervisor (Control de stock)</option>
                  <option value="Gerente / Propietario">Gerente (Acceso total gerencial)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalEmpleado(false)} className="flex-1 bg-black py-3 rounded-xl border border-white/10 font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] bg-[#E50914] py-3 rounded-xl font-black uppercase shadow-lg">Registrar en BD</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}