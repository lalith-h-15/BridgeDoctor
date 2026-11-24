import {
  AppWindow,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  CircleX,
  Landmark,
  LoaderCircle,
  Server,
  ShieldCheck,
  TriangleAlert,
  Usb,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentId } from '../types';

export const COMPONENT_ICON: Record<ComponentId, LucideIcon> = {
  portal: Landmark,
  browser: AppWindow,
  service: Server,
  tls: ShieldCheck,
  token: Usb,
};

export type VisualState = 'healthy' | 'warning' | 'failed' | 'not_verified' | 'pending' | 'running';

export const STATE_ICON: Record<VisualState, LucideIcon> = {
  healthy: CircleCheck,
  warning: TriangleAlert,
  failed: CircleX,
  not_verified: CircleHelp,
  pending: CircleDashed,
  running: LoaderCircle,
};

export const STATE_LABEL: Record<VisualState, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  failed: 'Failed',
  not_verified: 'Not verified',
  pending: 'Pending',
  running: 'Running',
};

/** Timeline wording for the same visual states. */
export const STAGE_STATE_LABEL: Record<VisualState, string> = {
  healthy: 'Passed',
  warning: 'Warning',
  failed: 'Failed',
  not_verified: 'Not verified',
  pending: 'Pending',
  running: 'Running',
};
