"use client";

import { useState, useEffect } from "react";
import { createWorkOrder, getWorkOrder, updateWorkOrder, uploadReceipt } from "@/app/actions/work-order";
import { useRouter } from "next/navigation";

interface WorkOrderFormProps {
    mode?: 'admin-create' | 'admin-edit' | 'captain-edit';
    orderId?: number;
}

export default function WorkOrderForm({ mode = 'admin-create', orderId }: WorkOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
      nombre: "",
      fecha: new Date().toISOString().split('T')[0],
      horaSalida: "",
      destino: "",
      puntoEncuentro: "",
      pasajeros: 0,
      detallesNotas: "",
      combustibleCost: 0,
      hieloCost: 0,
      aguaBebidasCost: 0,
      gastoVariosCost: 0,
      pagoCapitana: 0,
      pagoMarinero: 0,
      deposito: 0,
  });

  // Load data for edit modes
  useEffect(() => {
    if (orderId && (mode === 'admin-edit' || mode === 'captain-edit')) {
        setLoading(true);
        getWorkOrder(orderId).then((res) => {
            if (res.success && res.data) {
                const data = res.data;
                setFormData({
                    nombre: data.nombre,
                    fecha: new Date(data.fecha).toISOString().split('T')[0],
                    horaSalida: data.horaSalida,
                    destino: data.destino,
                    puntoEncuentro: data.puntoEncuentro,
                    pasajeros: data.pasajeros,
                    detallesNotas: data.detallesNotas || "",
                    combustibleCost: data.combustible || 0,
                    hieloCost: data.hielo || 0,
                    aguaBebidasCost: data.aguaBebidas || 0,
                    gastoVariosCost: data.gastoVarios || 0,
                    pagoCapitana: data.pagoCapitana || 0,
                    pagoMarinero: data.pagoMarinero || 0,
                    deposito: data.deposito || 0,
                });
                if (data.receipts) setReceipts(data.receipts);
            } else {
                alert("Error loading order: " + res.error);
            }
            setLoading(false);
        });
    }
  }, [orderId, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const calculateTotal = () => {
       return (formData.combustibleCost || 0) + 
              (formData.hieloCost || 0) + 
              (formData.aguaBebidasCost || 0) + 
              (formData.gastoVariosCost || 0) + 
              (formData.pagoCapitana || 0) + 
              (formData.pagoMarinero || 0);
  };
  
  const calculateBalance = () => {
      const total = calculateTotal();
      return total - (formData.deposito || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const total = calculateTotal();
    const balance = calculateBalance();
    
    const submissionData = {
        ...formData,
        costoTotal: total,
        saldoCliente: balance
    };

    let result;
    if (mode === 'admin-create') {
        result = await createWorkOrder(submissionData);
    } else {
        if (!orderId) { alert("Missing Order ID"); return; }
        result = await updateWorkOrder(orderId, submissionData);
    }

    if (result.success) {
        alert(mode === 'admin-create' ? "Orden Creada!" : "Orden Actualizada!");
        if (mode === 'admin-create') {
             setFormData({
                nombre: "", fecha: "", horaSalida: "", destino: "", puntoEncuentro: "", pasajeros: 0, detallesNotas: "",
                combustibleCost: 0, hieloCost: 0, aguaBebidasCost: 0, gastoVariosCost: 0,
                pagoCapitana: 0, pagoMarinero: 0, deposito: 0
            } as any);
            router.push("/admin/list");
        } else if (mode === 'captain-edit') {
            // Captain typically stays or maybe closes app? "automatically close the app" 
            // In web context, maybe redirect to landing or just show success.
            // Requirement: "automatically close the app". In browser, window.close() often blocked.
            // We'll redirect to landing.
            router.push("/");
        } else {
            router.push("/admin/list");
        }
    } else {
        alert("Error: " + result.error);
    }
    setLoading(false);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && orderId) {
          setUploading(true);
          const formData = new FormData();
          formData.append("file", e.target.files[0]);
          formData.append("orderId", orderId.toString());
          
          const res = await uploadReceipt(formData);
          if (res.success) {
              setReceipts(prev => [...prev, res.data]);
              alert("Receipt Uploaded!");
          } else {
              alert("Upload failed: " + res.error);
          }
          setUploading(false);
      }
  };

  // Field Access Logic
  const isCaptain = mode === 'captain-edit';
  // Captain can ONLY edit: Details/Notas, Combustible, Hielo, Agua/Bebidas, Gasto Varios
  // Admin can edit ALL.
  const canEdit = (fieldName: string) => {
      if (!isCaptain) return true; // Admin creates/edits all
      const allowed = ['detallesNotas', 'combustibleCost', 'hieloCost', 'aguaBebidasCost', 'gastoVariosCost'];
      return allowed.includes(fieldName);
  };

  if (loading && !formData.nombre) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded shadow-sm max-w-lg mx-auto overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <h2 className="text-xl font-bold bg-blue-600 text-white -m-4 mb-4 p-4">
            {mode === 'admin-create' ? "Nueva Orden de Trabajo" : `Orden #${orderId || ''}`}
        </h2>
      
      {/* Basic Info Group */}
      <div className="space-y-3">
        <div>
            <label className="block text-sm font-bold text-gray-700">Nombre Cliente</label>
            <input name="nombre" value={formData.nombre} onChange={handleChange} disabled={!canEdit('nombre')} className="w-full border p-3 rounded bg-gray-50 text-lg disabled:bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-sm font-bold text-gray-700">Fecha</label>
                <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} disabled={!canEdit('fecha')} className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Hora</label>
                <input type="time" name="horaSalida" value={formData.horaSalida} onChange={handleChange} disabled={!canEdit('horaSalida')} className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200" />
            </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-700">Destino</label>
            <input name="destino" value={formData.destino} onChange={handleChange} disabled={!canEdit('destino')} className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200" />
        </div>
        <div>
            <label className="block text-sm font-bold text-gray-700">Punto Encuentro</label>
            <input name="puntoEncuentro" value={formData.puntoEncuentro} onChange={handleChange} disabled={!canEdit('puntoEncuentro')} className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200" />
        </div>
         <div>
            <label className="block text-sm font-bold text-gray-700">Pasajeros</label>
            <input type="number" name="pasajeros" value={formData.pasajeros} onChange={handleChange} disabled={!canEdit('pasajeros')} className="w-full border p-3 rounded bg-gray-50 disabled:bg-gray-200" />
        </div>
      </div>

      <hr className="my-4 border-t-2" />
        
      {/* Captain Editable Section - Expenses */}
      <div>
        <h3 className="font-bold text-lg mb-2 text-blue-800">Gastos / Expenses</h3>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-sm font-bold text-gray-700">Combustible</label>
                <input type="number" name="combustibleCost" value={formData.combustibleCost} onChange={handleChange} disabled={!canEdit('combustibleCost')} className="w-full border p-3 rounded font-mono text-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Hielo</label>
                <input type="number" name="hieloCost" value={formData.hieloCost} onChange={handleChange} disabled={!canEdit('hieloCost')} className="w-full border p-3 rounded font-mono text-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Agua/Bebidas</label>
                <input type="number" name="aguaBebidasCost" value={formData.aguaBebidasCost} onChange={handleChange} disabled={!canEdit('aguaBebidasCost')} className="w-full border p-3 rounded font-mono text-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Gasto Varios</label>
                <input type="number" name="gastoVariosCost" value={formData.gastoVariosCost} onChange={handleChange} disabled={!canEdit('gastoVariosCost')} className="w-full border p-3 rounded font-mono text-lg" />
            </div>
        </div>
      </div>

       <div className="mt-2">
            <label className="block text-sm font-bold text-gray-700">Detalles / Notas</label>
            <textarea name="detallesNotas" value={formData.detallesNotas} onChange={handleChange} disabled={!canEdit('detallesNotas')} rows={4} className="w-full border p-3 rounded" placeholder="Add notes here..." />
        </div>

      {/* Receipts Section */}
      {(mode === 'captain-edit' || mode === 'admin-edit') && (
          <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
               <h3 className="font-bold text-sm mb-2 uppercase text-gray-600">Comprobantes / Receipts</h3>
               
               <div className="mb-4 flex flex-wrap gap-2">
                   {receipts.map((r, i) => (
                       <a key={i} href={r.url} target="_blank" className="block w-20 h-20 bg-gray-300 rounded overflow-hidden relative border">
                           {/* Using img tag directly for simplicity here or could use Next Image */}
                           <img src={r.url} alt="Receipt" className="w-full h-full object-cover" />
                       </a>
                   ))}
               </div>

               <label className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold py-3 rounded cursor-pointer transition">
                   {uploading ? "Subiendo..." : "📷 Tomar Foto / Subir Recibo"}
                   <input 
                        type="file" 
                        accept="image/*;capture=camera" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        disabled={uploading}
                   />
               </label>
          </div>
      )}

      <hr className="my-4 border-t-2" />

      {/* Admin Payments Section */}
      <div className="opacity-90">
         <h3 className="font-bold text-lg mb-2 text-green-800">Pagos (Admin Only)</h3>
         <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-sm font-bold text-gray-700">Pago Capitana</label>
                <input type="number" name="pagoCapitana" value={formData.pagoCapitana} onChange={handleChange} disabled={!canEdit('pagoCapitana')} className="w-full border p-2 rounded bg-gray-50 disabled:bg-gray-200" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">Pago Marinero</label>
                <input type="number" name="pagoMarinero" value={formData.pagoMarinero} onChange={handleChange} disabled={!canEdit('pagoMarinero')} className="w-full border p-2 rounded bg-gray-50 disabled:bg-gray-200" />
            </div>
         </div>
      </div>

       <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
           <div className="flex justify-between font-bold text-lg">
               <span>Costo Total:</span>
               <span>${calculateTotal().toFixed(2)}</span>
           </div>
           
            <div className="mt-2">
                <label className="block text-sm font-medium">Deposito</label>
                <input type="number" name="deposito" value={formData.deposito} onChange={handleChange} disabled={!canEdit('deposito')} className="w-full border p-2 rounded bg-white disabled:bg-gray-200" />
            </div>

            <div className="flex justify-between font-bold mt-4 text-xl text-blue-900 border-t pt-2 border-blue-200">
               <span>Saldo Cliente a Pagar:</span>
               <span>${calculateBalance().toFixed(2)}</span>
           </div>
       </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-4 rounded-lg font-bold text-xl hover:bg-green-700 mt-6 shadow-lg mb-8 uppercase tracking-wide">
        {loading ? "Guardando..." : (mode === 'admin-create' ? "Crear Orden" : "Guardar & Cerrar")}
      </button>
      
      </form>
    </div>
  );
}
