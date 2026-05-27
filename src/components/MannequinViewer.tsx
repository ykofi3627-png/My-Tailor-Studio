/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Measurements, Fabric, StylingSelection } from "../types";

interface MannequinViewerProps {
  measurements: Measurements;
  fabric: Fabric;
  styling: StylingSelection;
  gender?: "female" | "male";
}

export const MannequinViewer: React.FC<MannequinViewerProps> = ({
  measurements,
  fabric,
  styling,
  gender = "female",
}) => {
  const { chest, waist, hips, height, shoulder, sleeve } = measurements;
  const [viewMode, setViewMode] = useState<"front" | "back">("front");

  const isMale = gender === "male";

  // Derive normalized proportions for drawing coordinate paths
  const hScale = Math.max(0.6, Math.min(1.4, height / 64)); // 64" baseline
  const cScale = Math.max(0.5, Math.min(1.5, chest / 36));   // 36" baseline
  const wScale = Math.max(0.5, Math.min(1.5, waist / 28));   // 28" baseline
  const hpScale = Math.max(0.5, Math.min(1.5, hips / 38));    // 38" baseline
  const sScale = Math.max(0.6, Math.min(1.4, shoulder / 15)); // 15" baseline

  // Center coordinates of mannequin
  const cx = 150;
  const neckY = 70;
  const bustY = 110;
  const waistY = bustY + (60 * hScale);
  const hipY = waistY + (50 * hScale);
  const kneeY = hipY + (80 * hScale);
  const hemY = styling.length === "Mini" 
    ? hipY + (40 * hScale) 
    : styling.length === "Midi" 
    ? kneeY 
    : kneeY + (90 * hScale);

  // Width offsets from centerline with ease (adapted for male structure)
  const wShoulder = isMale ? 46 * sScale : 35 * sScale;
  const wUpperChest = isMale ? 42 * cScale : 30 * cScale;
  const wWaist = isMale ? 32 * wScale : 20 * wScale;
  const wHips = isMale ? 34 * hpScale : 32 * hpScale;

  // Fabric coloring & pattern selection mapping
  const getFabricFill = () => {
    switch (fabric.pattern) {
      case "custom":
        return "url(#customPattern)";
      case "stripe":
        return "url(#stripePattern)";
      case "dots":
        return "url(#dotsPattern)";
      case "ankara":
        return "url(#ankaraPattern)";
      case "floral":
        return "url(#floralPattern)";
      default:
        return fabric.color;
    }
  };

  // Construct dynamic paths
  // Body boundary coordinates
  const leftShoulder = { x: cx - wShoulder, y: neckY + 12 };
  const rightShoulder = { x: cx + wShoulder, y: neckY + 12 };
  const leftBust = { x: cx - wUpperChest, y: bustY };
  const rightBust = { x: cx + wUpperChest, y: bustY };
  const leftWaist = { x: cx - wWaist, y: waistY };
  const rightWaist = { x: cx + wWaist, y: waistY };
  const leftHip = { x: cx - wHips, y: hipY };
  const rightHip = { x: cx + wHips, y: hipY };

  const getMaleBodyPath = () => {
    const { leftHem, rightHem } = getHemWidths();
    const crotchY = hipY + 15 * hScale;
    const legGap = 5;

    let neckPath = "";
    if (styling.neckline === "High-Neck") {
      neckPath = `M ${cx - 12},${neckY} L ${cx + 12},${neckY} L ${rightShoulder.x},${rightShoulder.y}`;
    } else if (styling.neckline === "Sweetheart") {
      // Structured notch lapel
      neckPath = `M ${leftShoulder.x},${leftShoulder.y} L ${cx - 15},${neckY + 20} L ${cx},${neckY + 40} L ${cx + 15},${neckY + 20} L ${rightShoulder.x},${rightShoulder.y}`;
    } else if (styling.neckline === "Off-Shoulder") {
      // Shawl collar
      neckPath = `M ${leftShoulder.x},${leftShoulder.y} C ${cx - 20},${neckY + 25} ${cx + 20},${neckY + 25} ${rightShoulder.x},${rightShoulder.y}`;
    } else {
      // V-Neck or Round
      let dip = styling.neckline === "V-Neck" ? 38 : 22;
      neckPath = `M ${leftShoulder.x},${leftShoulder.y} Q ${cx},${neckY + dip} ${rightShoulder.x},${rightShoulder.y}`;
    }

    return `${neckPath}
            L ${rightBust.x},${rightBust.y}
            L ${rightWaist.x},${rightWaist.y}
            L ${rightHip.x},${rightHip.y}
            L ${rightHem},${styling.length === "Mini" ? hipY + 36 * hScale : hemY}
            L ${cx + legGap},${styling.length === "Mini" ? hipY + 36 * hScale : hemY}
            L ${cx},${crotchY}
            L ${cx - legGap},${styling.length === "Mini" ? hipY + 36 * hScale : hemY}
            L ${leftHem},${styling.length === "Mini" ? hipY + 36 * hScale : hemY}
            L ${leftHip.x},${leftHip.y}
            L ${leftWaist.x},${leftWaist.y}
            L ${leftBust.x},${leftBust.y}
            Z`;
  };

  // Skirt hemline expansion based on style
  const getHemWidths = () => {
    let multiplier = 1;
    if (isMale) {
      switch (styling.silhouette) {
        case "A-Line":
          multiplier = 1.0;
          break;
        case "Ballgown":
          multiplier = 1.25;
          break;
        case "Mermaid":
          multiplier = 0.8;
          break;
        case "Pencil":
          multiplier = 0.75;
          break;
        default:
          multiplier = 0.9;
      }
    } else {
      switch (styling.silhouette) {
        case "A-Line":
          multiplier = 2.2;
          break;
        case "Ballgown":
          multiplier = 3.5;
          break;
        case "Mermaid":
          multiplier = styling.length === "Floor-Maxi" ? 2.5 : 1.6;
          break;
        case "Pencil":
          multiplier = 0.9;
          break;
        default:
          multiplier = 1.3;
      }
    }
    const hemBase = wHips * multiplier;
    return {
      leftHem: cx - hemBase,
      rightHem: cx + hemBase,
    };
  };

  const { leftHem, rightHem } = getHemWidths();

  // Create front/back bodice and dress garment SVG string path
  const getBodyPath = () => {
    if (isMale) {
      return getMaleBodyPath();
    }
    if (viewMode === "back") {
      // Specialized back view drape cut boundaries
      if (styling.neckline === "Off-Shoulder") {
        return `M ${leftShoulder.x + 8},${leftShoulder.y + 11} 
                C ${cx},${neckY + 25} ${cx},${neckY + 25} ${rightShoulder.x - 8},${rightShoulder.y + 11}
                L ${rightBust.x},${rightBust.y}
                Q ${rightWaist.x + 3},${rightWaist.y - 10} ${rightWaist.x},${rightWaist.y}
                L ${rightHip.x},${rightHip.y}
                L ${rightHem},${hemY}
                L ${leftHem},${hemY}
                L ${leftHip.x},${leftHip.y}
                L ${leftWaist.x},${leftWaist.y}
                Q ${leftWaist.x - 3},${leftWaist.y - 10} ${leftBust.x},${leftBust.y}
                Z`;
      }

      if (styling.neckline === "Sweetheart") {
        // Low elegant scoop back matching front bust corset
        return `M ${leftShoulder.x},${neckY + 18}
                C ${leftShoulder.x + 10},${neckY + 26} ${cx - 20},${neckY + 41} ${cx},${neckY + 41}
                C ${cx + 20},${neckY + 41} ${rightShoulder.x - 10},${neckY + 26} ${rightShoulder.x},${neckY + 18}
                L ${rightBust.x},${rightBust.y}
                L ${rightWaist.x},${rightWaist.y}
                L ${rightHip.x},${rightHip.y}
                L ${rightHem},${hemY}
                L ${leftHem},${hemY}
                L ${leftHip.x},${leftHip.y}
                L ${leftWaist.x},${leftWaist.y}
                L ${leftBust.x},${leftBust.y}
                Z`;
      }

      if (styling.neckline === "High-Neck") {
        return `M ${cx - 12},${neckY}
                L ${cx + 12},${neckY}
                L ${rightShoulder.x},${rightShoulder.y}
                L ${rightBust.x},${rightBust.y}
                L ${rightWaist.x},${rightWaist.y}
                L ${rightHip.x},${rightHip.y}
                L ${rightHem},${hemY}
                L ${leftHem},${hemY}
                L ${leftHip.x},${leftHip.y}
                L ${leftWaist.x},${leftWaist.y}
                L ${leftBust.x},${leftBust.y}
                L ${leftShoulder.x},${leftShoulder.y}
                Z`;
      }

      // Default back design plunge
      let backDip = styling.neckline === "V-Neck" ? 36 : 22;
      return `M ${leftShoulder.x},${leftShoulder.y}
              Q ${cx},${neckY + backDip} ${rightShoulder.x},${rightShoulder.y}
              L ${rightBust.x},${rightBust.y}
              L ${rightWaist.x},${rightWaist.y}
              L ${rightHip.x},${rightHip.y}
              L ${rightHem},${hemY}
              L ${leftHem},${hemY}
              L ${leftHip.x},${leftHip.y}
              L ${leftWaist.x},${leftWaist.y}
              L ${leftBust.x},${leftBust.y}
              Z`;
    }

    // ================== FRONT VIEW PATHS ==================
    if (styling.neckline === "Off-Shoulder") {
      return `M ${leftShoulder.x + 8},${leftShoulder.y + 10} 
              C ${cx},${neckY + 30} ${cx},${neckY + 30} ${rightShoulder.x - 8},${rightShoulder.y + 10}
              L ${rightBust.x},${rightBust.y}
              Q ${rightWaist.x + 4},${rightWaist.y - 10} ${rightWaist.x},${rightWaist.y}
              L ${rightHip.x},${rightHip.y}
              L ${rightHem},${hemY}
              L ${leftHem},${hemY}
              L ${leftHip.x},${leftHip.y}
              L ${leftWaist.x},${leftWaist.y}
              Q ${leftWaist.x - 4},${leftWaist.y - 10} ${leftBust.x},${leftBust.y}
              Z`;
    }

    if (styling.neckline === "Sweetheart") {
      return `M ${cx - 10},${neckY + 15}
              C ${cx - 20},${neckY + 5} ${leftShoulder.x + 5},${neckY + 12} ${leftShoulder.x},${neckY + 18}
              L ${leftBust.x},${leftBust.y}
              L ${leftWaist.x},${leftWaist.y}
              L ${leftHip.x},${leftHip.y}
              L ${leftHem},${hemY}
              L ${rightHem},${hemY}
              L ${rightHip.x},${rightHip.y}
              L ${rightWaist.x},${rightWaist.y}
              L ${rightBust.x},${rightBust.y}
              L ${rightShoulder.x},${neckY + 18}
              C ${rightShoulder.x - 5},${neckY + 12} ${cx + 20},${neckY + 5} ${cx + 10},${neckY + 15}
              Q ${cx},${neckY + 28} ${cx - 10},${neckY + 15} Z`;
    }

    if (styling.neckline === "High-Neck") {
      return `M ${cx - 12},${neckY}
              L ${cx + 12},${neckY}
              L ${rightShoulder.x},${rightShoulder.y}
              L ${rightBust.x},${rightBust.y}
              L ${rightWaist.x},${rightWaist.y}
              L ${rightHip.x},${rightHip.y}
              L ${rightHem},${hemY}
              L ${leftHem},${hemY}
              L ${leftHip.x},${leftHip.y}
              L ${leftWaist.x},${leftWaist.y}
              L ${leftBust.x},${leftBust.y}
              L ${leftShoulder.x},${leftShoulder.y}
              Z`;
    }

    // Default V-Neck / Round General
    let dip = styling.neckline === "V-Neck" ? 40 : 25;
    return `M ${leftShoulder.x},${leftShoulder.y}
            Q ${cx},${neckY + dip} ${rightShoulder.x},${rightShoulder.y}
            L ${rightBust.x},${rightBust.y}
            L ${rightWaist.x},${rightWaist.y}
            L ${rightHip.x},${rightHip.y}
            L ${rightHem},${hemY}
            L ${leftHem},${hemY}
            L ${leftHip.x},${leftHip.y}
            L ${leftWaist.x},${leftWaist.y}
            L ${leftBust.x},${leftBust.y}
            Z`;
  };

  // Get path for Mermaid design styling (extra flare at knees)
  const getMermaidSkirtCurve = () => {
    if (styling.silhouette !== "Mermaid" || styling.length === "Mini") return null;

    // Redraw skirt with fitted knees and wide bottom flare
    return `M ${leftWaist.x},${leftWaist.y}
            L ${leftHip.x},${leftHip.y}
            C ${cx - wHips * 0.7},${kneeY} ${cx - wHips * 0.6},${kneeY} ${cx - wHips * 0.6},${kneeY + 15}
            C ${cx - wHips * 0.5},${kneeY + 40} ${leftHem},${hemY - 30} ${leftHem},${hemY}
            L ${rightHem},${hemY}
            C ${rightHem},${hemY - 30} ${cx + wHips * 0.5},${kneeY + 40} ${cx + wHips * 0.6},${kneeY + 15}
            C ${cx + wHips * 0.6},${kneeY} ${cx + wHips * 0.7},${kneeY} ${rightHip.x},${rightHip.y}
            L ${rightWaist.x},${rightWaist.y} Z`;
  };

  const finalDressPath = getMermaidSkirtCurve() || getBodyPath();

  // Draw sleeve vectors
  const renderSleeves = () => {
    if (styling.sleeve === "Sleeveless") return null;

    const fill = getFabricFill();
    const lS = leftShoulder;
    const rS = rightShoulder;

    if (isMale) {
      if (styling.sleeve === "Long Fitted") {
        const slLen = sleeve * 1.5;
        return (
          <g id="maleSuitSleeves">
            {/* Left Suit Sleeve */}
            <path
              d={`M ${lS.x},${lS.y} 
                  L ${lS.x - 14},${bustY + 40}
                  L ${lS.x - 15},${bustY + slLen}
                  L ${lS.x - 3},${bustY + slLen}
                  L ${cx - wUpperChest},${bustY + 12} Z`}
              fill={fill}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="1.1"
            />
            <line x1={lS.x - 15} y1={bustY + slLen - 4} x2={lS.x - 3} y2={bustY + slLen - 4} stroke="rgba(255,255,255,0.25)" />
            {/* Right Suit Sleeve */}
            <path
              d={`M ${rS.x},${rS.y} 
                  L ${rS.x + 14},${bustY + 40}
                  L ${rS.x + 15},${bustY + slLen}
                  L ${rS.x + 3},${bustY + slLen}
                  L ${cx + wUpperChest},${bustY + 12} Z`}
              fill={fill}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="1.1"
            />
            <line x1={rS.x + 15} y1={bustY + slLen - 4} x2={rS.x + 3} y2={bustY + slLen - 4} stroke="rgba(255,255,255,0.25)" />
          </g>
        );
      } else {
        // Short/sporty t-shirt/polo sleeves
        return (
          <g id="malePoloSleeves">
            {/* Left polo sleeve */}
            <path
              d={`M ${lS.x},${lS.y} 
                  L ${lS.x - 13},${lS.y + 36} 
                  L ${lS.x - 1},${lS.y + 38} 
                  L ${cx - wUpperChest + 1},${bustY + 8} Z`}
              fill={fill}
              stroke="rgba(0,0,0,0.24)"
              strokeWidth="0.9"
            />
            {/* Right polo sleeve */}
            <path
              d={`M ${rS.x},${rS.y} 
                  L ${rS.x + 13},${rS.y + 36} 
                  L ${rS.x + 1},${rS.y + 38} 
                  L ${cx + wUpperChest - 1},${bustY + 8} Z`}
              fill={fill}
              stroke="rgba(0,0,0,0.24)"
              strokeWidth="0.9"
            />
          </g>
        );
      }
    }

    if (styling.sleeve === "Short Puff") {
      return (
        <g id="puffSleeves">
          {/* Left Puff */}
          <path
            d={`M ${lS.x},${lS.y} 
                C ${lS.x - 30},${lS.y - 12} ${lS.x - 35},${lS.y + 25} ${cx - wUpperChest - 2},${bustY + 10}
                Q ${lS.x - 10},${bustY + 15} ${cx - wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.8"
          />
          {/* Right Puff */}
          <path
            d={`M ${rS.x},${rS.y} 
                C ${rS.x + 30},${rS.y - 12} ${rS.x + 35},${rS.y + 25} ${cx + wUpperChest + 2},${bustY + 10}
                Q ${rS.x + 10},${bustY + 15} ${cx + wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.8"
          />
        </g>
      );
    }

    if (styling.sleeve === "Flutter") {
      return (
        <g id="flutterSleeves">
          {/* Left Flutter */}
          <path
            d={`M ${lS.x},${lS.y} 
                Q ${lS.x - 38},${lS.y + 5} ${lS.x - 45},${lS.y + 35}
                Q ${lS.x - 20},${lS.y + 32} ${cx - wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.8"
          />
          {/* Right Flutter */}
          <path
            d={`M ${rS.x},${rS.y} 
                Q ${rS.x + 38},${rS.y + 5} ${rS.x + 45},${rS.y + 35}
                Q ${rS.x + 20},${rS.y + 32} ${cx + wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.8"
          />
        </g>
      );
    }

    if (styling.sleeve === "Long Fitted") {
      const slLen = sleeve * 1.5; // sleeve scaling
      return (
        <g id="longSleeves">
          {/* Left Long */}
          <path
            d={`M ${lS.x},${lS.y} 
                L ${lS.x - 22},${bustY + 30}
                L ${lS.x - 26},${bustY + slLen}
                L ${lS.x - 14},${bustY + slLen}
                L ${cx - wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.7"
          />
          {/* Right Long */}
          <path
            d={`M ${rS.x},${rS.y} 
                L ${rS.x + 22},${bustY + 30}
                L ${rS.x + 26},${bustY + slLen}
                L ${rS.x + 14},${bustY + slLen}
                L ${cx + wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.7"
          />
        </g>
      );
    }

    if (styling.sleeve === "Cap") {
      return (
        <g id="capSleeves">
          {/* Left Cap */}
          <path
            d={`M ${lS.x},${lS.y} 
                Q ${lS.x - 12},${lS.y + 5} ${lS.x - 15},${lS.y + 14}
                L ${cx - wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.8"
          />
          {/* Right Cap */}
          <path
            d={`M ${rS.x},${rS.y} 
                Q ${rS.x + 12},${rS.y + 5} ${rS.x + 15},${rS.y + 14}
                L ${cx + wUpperChest},${bustY} Z`}
            fill={fill}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.8"
          />
        </g>
      );
    }

    return null;
  };

  const renderMaleJacketDetails = () => {
    if (!isMale || viewMode !== "front") return null;

    return (
      <g id="maleJacketDetails" opacity="0.85">
        {/* Center line seam representing shirt/jacket opening */}
        <line x1={cx} y1={neckY + (styling.neckline === "High-Neck" ? 12 : 30)} x2={cx} y2={waistY + 10} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
        
        {/* Lapel design details for jacket contours */}
        {styling.neckline === "Sweetheart" && ( // Notch Lapel
          <>
            <path d={`M ${leftShoulder.x + 8},${leftShoulder.y} L ${cx - 15},${neckY + 22} L ${cx},${neckY + 40}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" />
            <path d={`M ${rightShoulder.x - 8},${rightShoulder.y} L ${cx + 15},${neckY + 22} L ${cx},${neckY + 40}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" />
            {/* Notch cuts */}
            <path d={`M ${cx - 15},${neckY + 22} L ${cx - 24},${neckY + 18} L ${cx - 18},${neckY + 14}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
            <path d={`M ${cx + 15},${neckY + 22} L ${cx + 24},${neckY + 18} L ${cx + 18},${neckY + 14}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          </>
        )}

        {/* Shawl Collar Lapel */}
        {styling.neckline === "Off-Shoulder" && (
          <>
            <path d={`M ${leftShoulder.x + 6},${leftShoulder.y} Q ${cx - 18},${neckY + 24} ${cx},${neckY + 38}`} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.2" />
            <path d={`M ${rightShoulder.x - 6},${rightShoulder.y} Q ${cx + 18},${neckY + 24} ${cx},${neckY + 38}`} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.2" />
          </>
        )}

        {/* Buttons on the jacket body */}
        <circle cx={cx - 5} cy={waistY - 12} r="2.5" fill="#3b2d24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        <circle cx={cx - 5} cy={waistY + 4} r="2.5" fill="#3b2d24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        {styling.neckline === "Sweetheart" && ( // Double breasted layout
          <>
            <circle cx={cx + 5} cy={waistY - 12} r="2.5" fill="#3b2d24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <circle cx={cx + 5} cy={waistY + 4} r="2.5" fill="#3b2d24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          </>
        )}

        {/* Chest pocket square outline */}
        <path d={`M ${cx - 24},${bustY - 14} L ${cx - 10},${bustY - 12} L ${cx - 10},${bustY - 6} L ${cx - 24},${bustY - 8} Z`} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
        <path d={`M ${cx - 22},${bustY - 13} L ${cx - 16},${bustY - 19} L ${cx - 12},${bustY - 12} Z`} fill="#f87171" opacity="0.9" />
      </g>
    );
  };

  return (
    <div className="w-full relative flex flex-col items-center justify-center bg-[#fdfcfb] rounded-2xl border border-black/10 p-4 shadow-sm overflow-hidden min-h-[460px]">
      
      {/* Front / Back View Switch Toggles with editorial look */}
      <div className="absolute top-3 left-4 flex bg-[#F2EFE9] border border-black/10 rounded-sm p-0.5 z-10 shadow-xs">
        <button
          id="btnToggleFrontView"
          onClick={() => setViewMode("front")}
          className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-xs transition-all ${viewMode === "front" ? "bg-black text-[#FDFCFB]" : "text-black/50 hover:text-black"}`}
        >
          Front
        </button>
        <button
          id="btnToggleBackView"
          onClick={() => setViewMode("back")}
          className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-xs transition-all ${viewMode === "back" ? "bg-black text-[#FDFCFB]" : "text-black/50 hover:text-black"}`}
        >
          Back View
        </button>
      </div>

      <div className="absolute right-4 top-3 flex flex-col gap-0.5 items-end text-[9px] font-mono text-stone-500 text-right">
        <div>Total H: <span className="text-black font-semibold">{height}"</span></div>
        <div>Chest: <span className="text-black font-semibold">{chest}"</span></div>
        <div>Waist: <span className="text-black font-semibold">{waist}"</span></div>
        <div>Hips: <span className="text-black font-semibold">{hips}"</span></div>
      </div>

      <svg
        id="mannequinSvg"
        viewBox="0 0 300 420"
        className="w-full max-w-[270px] drop-shadow-md h-auto transition-all duration-300 mt-4"
      >
        <defs>
          {/* Wooden texture gradients */}
          <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8c583c" />
            <stop offset="50%" stopColor="#5c341a" />
            <stop offset="100%" stopColor="#3d1f0d" />
          </linearGradient>

          {/* Core Body Form Gradients */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f3eae1" />
            <stop offset="30%" stopColor="#eae0d5" />
            <stop offset="50%" stopColor="#dfd3c3" />
            <stop offset="70%" stopColor="#eae0d5" />
            <stop offset="100%" stopColor="#d3c5b5" />
          </linearGradient>

          {/* Repeating SVG texture patterns for materials */}
          <pattern id="stripePattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="20" height="20" fill={fabric.color} />
            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
            <line x1="10" y1="0" x2="10" y2="20" stroke="rgba(0,0,0,0.15)" strokeWidth="2.5" />
          </pattern>

          <pattern id="dotsPattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill={fabric.color} />
            <circle cx="8" cy="8" r="3.2" fill="white" fillOpacity="0.8" />
            <circle cx="0" cy="0" r="1.6" fill="currentColor" fillOpacity="0.3" className="text-stone-800" />
            <circle cx="16" cy="16" r="1.6" fill="currentColor" fillOpacity="0.3" className="text-stone-800" />
          </pattern>

          <pattern id="ankaraPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill={fabric.color} />
            <path d="M 20,4 C 11,4 4,11 4,20 C 4,29 11,36 20,36 C 29,36 36,29 36,20 C 36,11 29,4 20,4 Z" fill="none" stroke="#eab308" strokeWidth="1.5" />
            <path d="M 20,0 L 20,40 M 0,20 L 40,20" stroke="#f97316" strokeWidth="1" />
            <polygon points="20,10 13,20 20,30 27,20" fill="#a855f7" className="opacity-70" />
            <circle cx="20" cy="20" r="5" fill="#eab308" />
            <circle cx="5" cy="5" r="2" fill="#1e3a8a" />
          </pattern>

          <pattern id="floralPattern" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill={fabric.color} />
            <circle cx="10" cy="10" r="4.5" fill="#ec4899" />
            <circle cx="12" cy="7" r="3" fill="#f43f5e" />
            <circle cx="7" cy="12" r="3" fill="#ec4899" />
            <circle cx="13" cy="13" r="3.5" fill="#fda4af" />
            <path d="M 12,15 Q 16,18 14,22" fill="none" stroke="#22c55e" strokeWidth="1" />
          </pattern>

          {fabric.pattern === "custom" && fabric.customPatternUrl && (
            <pattern id="customPattern" width={fabric.customPatternScale || 40} height={fabric.customPatternScale || 40} patternUnits="userSpaceOnUse">
              <image href={fabric.customPatternUrl} x="0" y="0" width={fabric.customPatternScale || 40} height={fabric.customPatternScale || 40} preserveAspectRatio="xMidYMid slice" />
            </pattern>
          )}
        </defs>

        {/* 1. Wood Stand: Base & Long Pole under dressform */}
        <line x1="150" x2="150" y1="210" y2="390" stroke="url(#woodGrad)" strokeWidth="5" strokeLinecap="round" />
        <path d="M 110,390 L 190,390 C 180,390 170,394 150,408 C 130,394 120,390 110,390 Z" fill="url(#woodGrad)" />
        <ellipse cx="150" cy="390" rx="35" ry="3.5" fill="rgba(0,0,0,0.15)" />
        <ellipse cx="150" cy="62" rx="14" ry="4" fill="url(#woodGrad)" />
        <circle cx="150" cy="52" r="4.5" fill="url(#woodGrad)" />

        {/* 2. Inner Tailor Mannequin Body Form */}
        <g id="underBodyMannequin" opacity="0.8">
          <path d="M 143,62 L 157,62 L 155,75 L 145,75 Z" fill="url(#bodyGrad)" />
          <path
            d={isMale ? (
              `M ${cx - wShoulder},${neckY + 10}
              C ${cx - wShoulder * 0.4},${neckY + 16} ${cx + wShoulder * 0.4},${neckY + 16} ${cx + wShoulder},${neckY + 10}
              L ${cx + wUpperChest},${bustY + 5}
              Q ${cx + wShoulder - 6},${bustY + 30} ${cx + wWaist},${waistY}
              L ${cx + wHips},${hipY}
              C ${cx + wHips - 4},${hipY + 25} ${cx - wHips + 4},${hipY + 25} ${cx - wHips},${hipY}
              L ${cx - wWaist},${waistY}
              Q ${cx - wShoulder + 6},${bustY + 30} ${cx - wUpperChest},${bustY + 5} Z`
            ) : (
              `M ${cx - wShoulder},${neckY + 12}
              C ${cx - wShoulder * 0.4},${neckY + 20} ${cx + wShoulder * 0.4},${neckY + 20} ${cx + wShoulder},${neckY + 12}
              L ${cx + wUpperChest},${bustY}
              Q ${cx + wShoulder + 2},${bustY + 30} ${cx + wWaist},${waistY}
              L ${cx + wHips},${hipY}
              C ${cx + wHips},${hipY + 35} ${cx - wHips},${hipY + 35} ${cx - wHips},${hipY}
              L ${cx - wWaist},${waistY}
              Q ${cx - wShoulder - 2},${bustY + 30} ${cx - wUpperChest},${bustY} Z`
            )}
            fill="url(#bodyGrad)"
            stroke="#c8bfae"
            strokeWidth="1.2"
          />
          {/* Arm cap joints */}
          <ellipse cx={cx - wShoulder} cy={neckY + 14} rx="2.5" ry="4" fill="#bcaaa4" />
          <ellipse cx={cx + wShoulder} cy={neckY + 14} rx="2.5" ry="4" fill="#bcaaa4" />
          
          {/* Front view chest overlays vs back view shoulders */}
          {viewMode === "front" ? (
            isMale ? (
              <>
                <path d={`M ${cx - wUpperChest * 0.65},${bustY - 4} Q ${cx},${bustY + 4} ${cx + wUpperChest * 0.65},${bustY - 4}`} fill="none" stroke="#b0a293" strokeWidth="1" />
                <path d={`M ${cx - wUpperChest * 0.55},${bustY + 15} L ${cx - wWaist * 0.45},${waistY - 12}`} fill="none" stroke="#b0a293" strokeWidth="0.8" strokeDasharray="2 2" />
                <path d={`M ${cx + wUpperChest * 0.55},${bustY + 15} L ${cx + wWaist * 0.45},${waistY - 12}`} fill="none" stroke="#b0a293" strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1={cx} y1={neckY + 15} x2={cx} y2={waistY + 15} stroke="#c1b6a7" strokeWidth="0.8" />
              </>
            ) : (
              <>
                <path d={`M ${cx - wWaist},${waistY} Q ${cx},${waistY + 3} ${cx + wWaist},${waistY}`} fill="none" stroke="#b0a293" strokeWidth="1" />
                <path d={`M ${cx - wUpperChest},${bustY} Q ${cx},${bustY + 4} ${cx + wUpperChest},${bustY}`} fill="none" stroke="#b0a293" strokeWidth="1" />
              </>
            )
          ) : (
            <>
              {/* Back Shoulder blades and vertebrae lines */}
              <path d={`M ${cx - wUpperChest * 0.5},${bustY - 15} Q ${cx - 10},${bustY - 10} ${cx - 5},${bustY + 5}`} fill="none" stroke="#b0a293" strokeWidth="0.8" strokeDasharray="2 2" />
              <path d={`M ${cx + wUpperChest * 0.5},${bustY - 15} Q ${cx + 10},${bustY - 10} ${cx + 5},${bustY + 5}`} fill="none" stroke="#b0a293" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1={cx} y1={neckY + 15} x2={cx} y2={waistY} stroke="#c1b6a7" strokeWidth="0.8" strokeDasharray="4 4" />
            </>
          )}
        </g>

        {/* 3. The Custom Seaming Dress */}
        <g id="sewnGarmentOverlay">
          {renderSleeves()}

          {/* Main Fitted Dress Tailored Outer Piece */}
          <path
            d={finalDressPath}
            fill={getFabricFill()}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1.2"
            fillOpacity="0.96"
          />

          {renderMaleJacketDetails()}

          {/* SPECIFIC BACK VIEW SEAMS: Zipper tracks + closures */}
          {viewMode === "back" && (
            <g id="backZipperSystem">
              {/* Vertical center back seam or zipper tracking */}
              {(() => {
                let startY = neckY + 20;
                if (styling.neckline === "Sweetheart") startY = neckY + 41;
                else if (styling.neckline === "Off-Shoulder") startY = neckY + 25;
                else if (styling.neckline === "V-Neck") startY = neckY + 36;
                else if (styling.neckline === "High-Neck") startY = neckY;

                return (
                  <>
                    <line
                      x1={cx}
                      y1={startY}
                      x2={cx}
                      y2={hipY + 25}
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={cx}
                      y1={startY}
                      x2={cx}
                      y2={hipY + 25}
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    {/* Metal brass slide slider head */}
                    {!isMale && (
                      <>
                        <rect
                          x={cx - 2}
                          y={startY + 4}
                          width="4"
                          height="6"
                          fill="#b45309"
                          stroke="#451a03"
                          strokeWidth="0.5"
                          rx="0.5"
                        />
                        <circle cx={cx} cy={startY + 12} r="1.5" fill="#d97706" />
                      </>
                    )}
                  </>
                );
              })()}
              
              {/* Back contour darts */}
              <path d={`M ${cx - wWaist * 0.45},${waistY + 25} Q ${cx - wWaist * 0.5},${waistY} ${cx - wWaist * 0.4},${waistY - 25}`} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" />
              <path d={`M ${cx + wWaist * 0.45},${waistY + 25} Q ${cx + wWaist * 0.5},${waistY} ${cx + wWaist * 0.4},${waistY - 25}`} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" />
            </g>
          )}

          {/* Belt Wrap Accent */}
          {styling.hasBelt && (
            <g id="beltAccent">
              <path
                d={`M ${cx - wWaist - 1.2},${waistY - 3} 
                    Q ${cx},${waistY} 
                    ${cx + wWaist + 1.2},${waistY - 3}
                    L ${cx + wWaist + 1},${waistY + 4}
                    Q ${cx},${waistY + 7}
                    ${cx - wWaist - 1},${waistY + 4} Z`}
                fill="#241e1a"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.8"
              />
              {/* Only render buckle detailing on the front view! */}
              {viewMode === "front" ? (
                <rect x={cx - 5} y={waistY - 4} width="10" height="11" fill="none" stroke="#fbbf24" strokeWidth="1.5" rx="1" />
              ) : (
                // Clean tie seam back buckle strap overlay
                <line x1={cx - 2} y1={waistY} x2={cx + 2} y2={waistY + 2} stroke="#3b2d24" strokeWidth="2.5" />
              )}
            </g>
          )}

          {/* Front view Slit Guide */}
          {styling.hasSlit && styling.length !== "Mini" && viewMode === "front" && (
            <path
              d={`M ${cx + wHips * 0.3},${hipY + 10} 
                  Q ${cx + wHips * 0.25},${(hipY + hemY) / 2} ${cx + wHips * 0.65},${hemY}`}
              fill="none"
              stroke="#FDFCFB"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.85"
            />
          )}

          {/* Construction Blueprint overlay marks (staggered seams) */}
          <path
            d={finalDressPath}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.4"
          />
        </g>

        {/* 4. Interaction Indicator Nodes for visual measuring guidelines */}
        <g id="measuringAnnotation" opacity="0.2" className="hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <ellipse cx={cx} cy={waistY} rx={wWaist} ry="3.5" fill="none" stroke="#d97706" strokeWidth="1" />
          <ellipse cx={cx} cy={hipY} rx={wHips} ry="4" fill="none" stroke="#d97706" strokeWidth="1" />
        </g>
      </svg>

      <div className="w-full mt-3 text-center text-[10px] text-black/50 font-sans border-t border-black/5 pt-2 flex items-center justify-center gap-x-2.5">
        <span className="font-bold text-black uppercase tracking-wider">{viewMode === "front" ? "Front Facing View" : "Bespoke Back Outlines"}</span>
        <span>•</span>
        <span className="italic">{styling.neckline}</span>
        <span>•</span>
        <span className="italic">{styling.silhouette}</span>
      </div>
    </div>
  );
};
