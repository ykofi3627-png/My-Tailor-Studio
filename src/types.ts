/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UnitType = "inches" | "cm";

export interface Measurements {
  unit: UnitType;
  chest: number;
  waist: number;
  hips: number;
  height: number;
  shoulder: number;
  sleeve: number;
  neck: number;
  inseam: number;
}

export interface Fabric {
  id: string;
  name: string;
  type: string;
  color: string;
  pattern: "solid" | "floral" | "stripe" | "ankara" | "dots" | "custom";
  textureName: string;
  weightGsm: number;
  customPatternUrl?: string;
  customPatternScale?: number;
}

export type NecklineStyle = "V-Neck" | "Sweetheart" | "Round" | "Off-Shoulder" | "High-Neck";
export type SleeveStyle = "Sleeveless" | "Short Puff" | "Flutter" | "Long Fitted" | "Cap";
export type SkirtSilhouette = "Pencil" | "A-Line" | "Mermaid" | "Ballgown" | "Direct-Hem";
export type GarmentLength = "Mini" | "Midi" | "Floor-Maxi";

export interface StylingSelection {
  neckline: NecklineStyle;
  sleeve: SleeveStyle;
  silhouette: SkirtSilhouette;
  length: GarmentLength;
  hasBelt: boolean;
  hasSlit: boolean;
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender?: "female" | "male";
  measurements: Measurements;
}

export interface ProjectComment {
  id: string;
  author: "Designer" | "Customer";
  text: string;
  timestamp: string;
  isAdjustmentRequest?: boolean; // True if the comment is a specific markup requested
  isResolved?: boolean;
}

export interface DesignProject {
  id: string;
  customerId: string;
  designName: string;
  fabric: Fabric;
  styling: StylingSelection;
  lastCalculations?: {
    isAI: boolean;
    patternFormulas: {
      frontBodiceWidth: string;
      backBodiceWidth: string;
      armholeDepth: string;
      skirtPanelWidth: string;
      suggestedDartsCount: number;
      dartLength: string;
    };
    cuttingGuide: string[];
    estimatedYardsNeeded: number;
    sewingSteps: string[];
    tailoringTips: string[];
  };
  aiSketchUrl?: string;
  customerApprovalStatus: "Pending" | "Approved" | "Change-Requested";
  customerFeedback?: string;
  comments?: ProjectComment[];
  lastUpdated: string;
}
