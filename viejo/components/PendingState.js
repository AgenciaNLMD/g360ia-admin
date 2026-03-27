export default function PendingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117] text-white">
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="Gestion 360 IA" className="h-12" />
        </div>
        <div className="mb-4">
          <span className="inline-block px-4 py-1 text-sm rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Cuenta pendiente
          </span>
        </div>
        <h1 className="text-xl font-semibold mb-2">
          Estamos revisando tu solicitud
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Tu cuenta fue creada correctamente. Un administrador debe aprobar el acceso antes de ingresar.
        </p>
        <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 text-sm text-gray-400">
          Te avisaremos por email cuando tu cuenta esté habilitada.
        </div>
      </div>
    </div>
  );
}
