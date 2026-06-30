/**
 * FishingCoordinate — Coordenadas de pesca de Costa Inteligente
 * Preparado para sistema de desbloqueo futuro (pagos/suscripciones)
 */
export interface FishingCoordinate {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  description: string;
  registeredAt: string;        // ISO date string
  // Future unlock system — currently all are unlocked (isLocked = false)
  isLocked: boolean;           // false = visible to all; true = requires subscription
  unlockPrice?: number;        // MXN price to unlock (future)
  unlockedByDefault: boolean;  // always true for now
  createdBy: 'admin' | string; // admin or userId
}
