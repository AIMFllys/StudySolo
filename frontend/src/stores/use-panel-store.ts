'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarPanel =
  | 'workflows'
  | 'ai-chat'
  | 'node-store'
  | 'workflow-examples'
  | 'dashboard'
  | 'wallet'
  | 'plugins';

/** Min/max constraints for resizable panels */
const LEFT_PANEL_MIN = 200;
const LEFT_PANEL_MAX = 480;
const LEFT_PANEL_DEFAULT = 240;
const RIGHT_PANEL_MIN = 240;
const RIGHT_PANEL_MAX = 520;
const RIGHT_PANEL_DEFAULT = 320;

interface PanelState {
  /** Which sidebar panel is active (null = sidebar collapsed) */
  activeSidebarPanel: SidebarPanel | null;
  /** Resizable left panel width */
  leftPanelWidth: number;
  /** Resizable right panel width */
  rightPanelWidth: number;
  /** Right panel collapsed state */
  rightPanelCollapsed: boolean;
  /** Right panel section collapsed states */
  collapsedSections: Record<string, boolean>;

  /** Toggle a sidebar panel — if already active, collapse; if different, switch */
  toggleSidebarPanel: (panel: SidebarPanel) => void;
  setActiveSidebarPanel: (panel: SidebarPanel | null) => void;

  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;

  toggleRightPanel: () => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  toggleSection: (sectionId: string) => void;
  isSectionCollapsed: (sectionId: string) => boolean;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set, get) => ({
      activeSidebarPanel: 'workflows' as SidebarPanel | null,
      leftPanelWidth: LEFT_PANEL_DEFAULT,
      rightPanelWidth: RIGHT_PANEL_DEFAULT,
      rightPanelCollapsed: false,
      collapsedSections: {},

      toggleSidebarPanel: (panel) =>
        set((state) => ({
          activeSidebarPanel: state.activeSidebarPanel === panel ? null : panel,
        })),

      setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel }),

      setLeftPanelWidth: (width) =>
        set({ leftPanelWidth: Math.min(LEFT_PANEL_MAX, Math.max(LEFT_PANEL_MIN, width)) }),

      setRightPanelWidth: (width) =>
        set({ rightPanelWidth: Math.min(RIGHT_PANEL_MAX, Math.max(RIGHT_PANEL_MIN, width)) }),

      toggleRightPanel: () => set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),
      setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),

      toggleSection: (sectionId) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [sectionId]: !state.collapsedSections[sectionId],
          },
        })),

      isSectionCollapsed: (sectionId) => !!get().collapsedSections[sectionId],
    }),
    {
      name: 'studysolo-panel-layout',
      partialize: (state) => ({
        activeSidebarPanel: state.activeSidebarPanel,
        leftPanelWidth: state.leftPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
        rightPanelCollapsed: state.rightPanelCollapsed,
        collapsedSections: state.collapsedSections,
      }),
    }
  )
);

export { LEFT_PANEL_MIN, LEFT_PANEL_MAX, RIGHT_PANEL_MIN, RIGHT_PANEL_MAX };
