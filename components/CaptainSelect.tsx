/**
 * components/CaptainSelect.tsx
 * 
 * A specialized select component for picking a Captain from the system user list.
 * Fetches data asynchronously from the /api/users endpoint.
 */
"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type User = {
  id: string;
  nombre: string;
  apellido: string;
  role: string;
  cell: string | null;
};

interface CaptainSelectProps {
  /**
   * The currently selected captain's ID.
   * Can be a valid UUID string or "unassigned".
   */
  value?: string;
  /**
   * Callback function triggered when a captain is selected.
   * returning the selected captain's ID string.
   */
  onValueChange: (value: string) => void;
  /**
   * Optional boolean to disable the select input.
   * Useful during form submission or loading states.
   */
  disabled?: boolean;
  /**
   * Optional callback to return the full captain object.
   */
  onCaptainSelected?: (captain: User | null) => void;
}

/**
 * CaptainSelect Component
 * 
 * This component renders a dropdown menu (Select) that allows an administrator
 * to assign a specific Captain to a Work Order.
 * 
 * Purpose:
 * - Fetches a list of all users with the 'captain' role from the API.
 * - Displays these captains in a selectable list.
 * - Manages the loading state while fetching headers.
 * - Returns the selected captain's ID to the parent form via onValueChange.
 */
export function CaptainSelect({
  value,
  onValueChange,
  disabled,
  onCaptainSelected
}: CaptainSelectProps) {
  const [captains, setCaptains] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * useEffect Hook
   * 
   * Triggered on component mount.
   * Responsible for asynchronously fetching the list of captains from the backend.
   */
  useEffect(() => {
    /**
     * fetchCaptains Function
     * 
     * Asynchronous function to retrieve users with role='captain'.
     * 1. Calls the '/api/users?role=captain' endpoint.
     * 2. On success, updates the 'captains' state with the returned list.
     * 3. Handles errors by logging them to the console.
     * 4. Finally, sets 'loading' to false to reveal the UI.
     */
    async function fetchCaptains() {
      try {
        const res = await fetch("/api/users?role=captain");
        if (res.ok) {
          const data = await res.json();
          setCaptains(data.users || []);
        }
      } catch (error) {
        console.error("Failed to fetch captains", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCaptains();
  }, []);

  if (loading) {
    return <div>Cargando capitanes...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Label removed here as it is handled by FormLabel in the parent form */}
      <Select
        value={value}
        onValueChange={(val) => {
          onValueChange(val);
          if (onCaptainSelected) {
            const selected = captains.find(c => c.id === val);
            onCaptainSelected(selected || null);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar capitana" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
          {captains.map((captain) => (
            <SelectItem key={captain.id} value={captain.id}>
              {captain.nombre} {captain.apellido}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
