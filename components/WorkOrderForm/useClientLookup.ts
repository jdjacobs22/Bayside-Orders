"use client";

import React, { useEffect } from "react";
import { UseFormSetValue, UseFormGetValues } from "react-hook-form";
import { toast } from "sonner";
import {
  getClientApellidosByNombre,
  getUniqueNombresFromUsers,
  getClientDetails,
} from "@/app/actions/work-order";

interface UseClientLookupProps {
  nombreCliente: string;
  apellidoCliente: string;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export function useClientLookup({
  nombreCliente,
  apellidoCliente,
  setValue,
  getValues,
}: UseClientLookupProps) {
  const [apellidosList, setApellidosList] = React.useState<string[]>([]);
  const [nombresList, setNombresList] = React.useState<string[]>([]);
  const [discoveredCaptainId, setDiscoveredCaptainId] = React.useState<string | null>(null);

  useEffect(() => {
    async function fetchApellidos() {
      if (!nombreCliente || nombreCliente.trim().length === 0) {
        setApellidosList([]);
        return;
      }
      const res = await getClientApellidosByNombre(nombreCliente);
      if (res.success && res.data) {
        setApellidosList(res.data);
        if (res.data.length === 1 && !getValues("apellido")) {
          setValue("apellido", res.data[0]);
        }
      } else {
        setApellidosList([]);
      }
    }
    const timerId = setTimeout(fetchApellidos, 400);
    return () => clearTimeout(timerId);
  }, [nombreCliente, setValue, getValues]);

  useEffect(() => {
    async function fetchDetails() {
      if (!nombreCliente || !apellidoCliente) return;
      const res = await getClientDetails(nombreCliente, apellidoCliente);
      if (res.success) {
        if (res.data) {
          if (!getValues("email") && res.data.email) {
            setValue("email", res.data.email);
          }
          if (!getValues("cell") && res.data.cell) {
            setValue("cell", res.data.cell);
          }
          setDiscoveredCaptainId((res.data as any).id || null);
        } else {
          setDiscoveredCaptainId(null);
          if (nombreCliente.trim() && apellidoCliente.trim()) {
            toast.error("Error", {
              description: "Ese nombre no existe en nuestra base de datos.",
            });
          }
        }
      }
    }
    const timerId = setTimeout(fetchDetails, 500);
    return () => clearTimeout(timerId);
  }, [nombreCliente, apellidoCliente, setValue, getValues]);

  useEffect(() => {
    async function fetchNombres() {
      const res = await getUniqueNombresFromUsers();
      if (res.success && res.data) {
        setNombresList(res.data);
      }
    }
    fetchNombres();
  }, []);

  return { apellidosList, nombresList, discoveredCaptainId, setDiscoveredCaptainId };
}
