/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Measurements, StylingSelection, Fabric } from "../types";
import { Ruler, Scissors, Milestone, Layers } from "lucide-react";

interface PatternBlueprintProps {
  measurements: Measurements;
  styling: StylingSelection;
  fabric: Fabric;
  isAICalculated: boolean;
  aiFormulas?: {
    frontBodiceWidth: string;
    backBodiceWidth: string;
    armholeDepth: string;
    skirtPanelWidth: string;
    suggestedDartsCount: number;
    dartLength: string;
  };
}

export const PatternBlueprint: React.FC<PatternBlueprintProps> = ({
  measurements,
  styling,
  fabric,
  isAICalculated,
  aiFormulas,
}) => {
  const { chest, waist, hips, height, shoulder, sleeve, neck } = measurements;
  const unit = measurements.unit;

  // Let's compute measurements to display on the vector blueprint pieces
  // Base Formulas matching real tailoring patterns with seam additions
  const frontBodiceWidth = aiFormulas?.frontBodiceWidth || `${((chest / 4) + 1.25).toFixed(2)} ${unit}`;
  const backBodiceWidth = aiFormulas?.backBodiceWidth || `${((chest / 4) + 0.75).toFixed(2)} ${unit}`;
  const armholeDepth = aiFormulas?.armholeDepth || `${((chest / 8) + 2.75).toFixed(2)} ${unit}`;
  const skirtPanelWidth = aiFormulas?.skirtPanelWidth || `${((hips / 4) + 2.50).toFixed(2)} ${unit}`;
  const suggestedDarts = aiFormulas?.suggestedDartsCount || (waist < chest - 4 ? 4 : 2);
  const dartLength = aiFormulas?.dartLength || `${height > 60 ? "5.0" : "4.0"} ${unit}`;

  // Length calculations for dress elements
  const bodiceLength = (height * 0.25).toFixed(1);
  const skirtLengthVal = styling.length === "Mini" ? 18 : styling.length === "Midi" ? 28 : 42;
  const sleeveLengthVal = styling.sleeve === "Sleeveless" ? 0 : styling.sleeve === "Short Puff" || styling.sleeve === "Flutter" || styling.sleeve === "Cap" ? 8 : sleeve;

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-xl border border-stone-800 font-mono text-xs">
      {/* Blueprint header banner */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-stone-800 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">2D Flat Cutting Blueprint</h3>
            <p className="text-[10px] text-stone-400">Calculated yardage layout blocks in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-stone-800/80 px-2.5 py-1.5 rounded-md border border-stone-700/50">
          <span className={`w-2 h-2 rounded-full ${isAICalculated ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="text-[10px] text-stone-300 font-semibold">
            {isAICalculated ? "AI Fitted Blocks" : "Auto-Calculated Drafting Base"}
          </span>
        </div>
      </div>

      {/* Pattern Blocks grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Piece 1: Front Bodice */}
        <div className="bg-stone-950 rounded-xl p-4 border border-stone-800/80 hover:border-amber-500/40 transition-colors duration-200">
          <div className="flex justify-between items-center text-[10px] text-stone-400 border-b border-stone-800/60 pb-2 mb-3">
            <span className="font-bold text-amber-500">BLOCK A: FRONT BODICE</span>
            <span>Qty: 1 PC ON FOLD</span>
          </div>
          <div className="relative h-44 bg-stone-900/40 rounded-lg flex items-center justify-center border border-dashed border-stone-800">
            {/* SVG front pattern piece drawing */}
            <svg viewBox="0 0 160 140" className="w-[150px] h-auto text-stone-400 stroke-current fill-none">
              <path
                d="M 20,20 L 70,20 L 70,30 C 85,50 85,60 120,60 L 120,110 L 20,110 Z"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                className="text-amber-500"
              />
              <path d="M 20,20 L 20,110" strokeWidth="2" /> {/* Center Fold Indicator */}
              
              {/* Annotations */}
              <text x="25" y="65" fill="#f59e0b" fontSize="8" className="font-mono">FRONT FOLD</text>
              <text x="50" y="15" fill="#a8a29e" fontSize="7">Shoulder: {(shoulder/2).toFixed(1)} {unit}</text>
              <text x="75" y="105" fill="#67e8f9" fontSize="7">Bust Limit {frontBodiceWidth}</text>
              <text x="40" y="125" fill="#a8a29e" fontSize="7">Height: {bodiceLength} {unit}</text>

              {/* Darts indicators */}
              <circle cx="65" cy="110" r="1.5" fill="#ef4444" />
              <path d="M 65,110 L 65,85" stroke="#ef4444" strokeWidth="1" />
            </svg>
            <div className="absolute bottom-2 left-3 text-[9px] text-stone-500 flex items-center gap-1">
              <Scissors className="w-3 h-3" /> Cut along dashed lines
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between text-stone-400">
              <span>Primary Ease:</span>
              <span className="text-stone-300">1.25 {unit} added</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Seams addition:</span>
              <span className="text-stone-300">0.5 {unit} margins</span>
            </div>
          </div>
        </div>

        {/* Piece 2: Back Bodice */}
        <div className="bg-stone-950 rounded-xl p-4 border border-stone-800/80 hover:border-amber-500/40 transition-colors duration-200">
          <div className="flex justify-between items-center text-[10px] text-stone-400 border-b border-stone-800/60 pb-2 mb-3">
            <span className="font-bold text-amber-500">BLOCK B: BACK BODICE (PARTS)</span>
            <span>Qty: 2 PCS CUT LEFT/RIGHT</span>
          </div>
          <div className="relative h-44 bg-stone-900/40 rounded-lg flex items-center justify-center border border-dashed border-stone-800">
            <svg viewBox="0 0 160 140" className="w-[150px] h-auto text-stone-400 stroke-current fill-none">
              <path
                d="M 30,20 L 80,20 L 80,30 C 95,50 95,60 130,60 L 130,110 L 30,110 Z"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                className="text-amber-500"
              />
              <path d="M 30,20 L 30,110" strokeWidth="1.5" stroke="#10b981" /> {/* Zipper Line */}
              
              {/* Annotations */}
              <text x="35" y="65" fill="#10b981" fontSize="8" className="font-mono">+1" ZIPPER EXP.</text>
              <text x="50" y="15" fill="#a8a29e" fontSize="7">Back neck: {(neck/2).toFixed(1)} {unit}</text>
              <text x="80" y="105" fill="#67e8f9" fontSize="7">Sizing: {backBodiceWidth}</text>
              <text x="40" y="125" fill="#a8a29e" fontSize="7">Darts length: {dartLength}</text>

              {/* Back contour dart */}
              <circle cx="75" cy="110" r="1.5" fill="#ef4444" />
              <path d="M 75,110 L 75,70" stroke="#ef4444" strokeWidth="1" />
            </svg>
            <div className="absolute bottom-2 left-3 text-[9px] text-stone-500 flex items-center gap-1">
              <Ruler className="w-3 h-3" /> Grain allowance applied
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between text-stone-400">
              <span>Back Darts:</span>
              <span className="text-stone-300">Recommended quantity: {suggestedDarts}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Zipper room:</span>
              <span className="text-stone-300">1.0 {unit} overlap included</span>
            </div>
          </div>
        </div>

        {/* Piece 3: Sleeve Piece */}
        {styling.sleeve !== "Sleeveless" && (
          <div className="bg-stone-950 rounded-xl p-4 border border-stone-800/80 hover:border-amber-500/40 transition-colors duration-200">
            <div className="flex justify-between items-center text-[10px] text-stone-400 border-b border-stone-800/60 pb-2 mb-3">
              <span className="font-bold text-amber-500">BLOCK C: SLEEVE TEMPLATE</span>
              <span>Qty: 2 PCS CUT LEFT/RIGHT</span>
            </div>
            <div className="relative h-44 bg-stone-900/40 rounded-lg flex items-center justify-center border border-dashed border-stone-800">
              <svg viewBox="0 0 160 140" className="w-[150px] h-auto text-stone-400 stroke-current fill-none">
                <path
                  d="M 80,10 C 130,10 130,50 130,110 L 30,110 C 30,50 30,10 80,10 Z"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  className="text-amber-500"
                />
                
                {/* Annotations */}
                <text x="50" y="35" fill="#f59e0b" fontSize="8" className="font-mono">SLEEVE CAP</text>
                <text x="40" y="65" fill="#a8a29e" fontSize="7">Armhole cap: {armholeDepth}</text>
                <text x="45" y="125" fill="#a8a29e" fontSize="7">Sleeve height: {sleeveLengthVal} {unit}</text>
                {styling.sleeve === "Short Puff" && <text x="45" y="95" fill="#ec4899" fontSize="7">Puff allowance: +4" ease</text>}
              </svg>
            </div>
            <div className="mt-3 space-y-1.5 text-[10px]">
              <div className="flex justify-between text-stone-400">
                <span>Armhole Cap depth:</span>
                <span className="text-stone-300">{armholeDepth}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Selected style:</span>
                <span className="text-stone-300 font-semibold">{styling.sleeve}</span>
              </div>
            </div>
          </div>
        )}

        {/* Piece 4: Skirt / Gown Panel Layout */}
        <div className="bg-stone-950 rounded-xl p-4 border border-stone-800/80 hover:border-amber-500/40 transition-colors duration-200">
          <div className="flex justify-between items-center text-[10px] text-stone-400 border-b border-stone-800/60 pb-2 mb-3">
            <span className="font-bold text-amber-500">BLOCK D: SKIRT PANEL ({styling.silhouette})</span>
            <span>Qty: 2 PCS CUT ON FOLD</span>
          </div>
          <div className="relative h-44 bg-stone-900/40 rounded-lg flex items-center justify-center border border-dashed border-stone-800">
            <svg viewBox="0 0 160 140" className="w-[150px] h-auto text-stone-400 stroke-current fill-none">
              {/* Draw different template shapes depending on style */}
              {styling.silhouette === "Pencil" ? (
                <path d="M 40,20 L 120,20 L 115,110 L 45,110 Z" strokeWidth="1.2" strokeDasharray="2 2" className="text-amber-500" />
              ) : styling.silhouette === "Ballgown" ? (
                <path d="M 65,20 L 95,20 L 150,110 L 10,110 Z" strokeWidth="1.2" strokeDasharray="2 2" className="text-amber-500" />
              ) : ( // A-line default
                <path d="M 50,20 L 110,20 L 135,110 L 25,110 Z" strokeWidth="1.2" strokeDasharray="2 2" className="text-amber-500" />
              )}
              
              {/* Annotations */}
              <text x="55" y="45" fill="#f59e0b" fontSize="8" className="font-mono">WAIST: {(waist/4).toFixed(1)} {unit}</text>
              <text x="45" y="75" fill="#67e8f9" fontSize="7">Panel width: {skirtPanelWidth}</text>
              <text x="40" y="125" fill="#a8a29e" fontSize="7">Panel length: {skirtLengthVal} {unit}</text>
            </svg>
          </div>
          <div className="mt-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between text-stone-400">
              <span>Hips baseline sizing:</span>
              <span className="text-stone-300">Hips: {hips} + ease block</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Hem styling flow:</span>
              <span className="text-stone-300 font-semibold">{styling.silhouette} cut</span>
            </div>
          </div>
        </div>

      </div>

      {/* Fabric grain alert layout info box */}
      <div className="mt-5 bg-stone-900/60 p-4 rounded-xl border border-stone-800/80 flex gap-3">
        <Milestone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-stone-200 font-bold text-[11px] uppercase tracking-wide">Critical Material Saving Precautions</p>
          <ul className="list-disc list-inside text-stone-400 text-[10px] space-y-1">
            <li>For <strong>{fabric?.name || "General Fabric"}</strong> ({fabric?.type || "Standard"}), always lay pattern pieces in the direction of the fabric selvage grain (warp threads) to maintain appropriate stretch structure.</li>
            <li>Before drawing layouts with tailor chalk, double verify chest ({chest} {unit}), waist ({waist} {unit}) and hips ({hips} {unit}) to guarantee a drape ease margin.</li>
            <li>Using this 2D simulator reduces fabric layout wastage by an estimated 20%. Ensure details perfectly match the proof before executing the cutting block!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
