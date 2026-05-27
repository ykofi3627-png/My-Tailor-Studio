/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DesignProject, ProjectComment, Customer } from "../types";
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Tag, 
  RotateCw, 
  ShieldAlert, 
  User, 
  UserCheck, 
  Scissors, 
  Disc, 
  Flame,
  Check,
  ChevronRight,
  Sun
} from "lucide-react";

interface DesignCollaborationProps {
  project: DesignProject;
  customer: Customer;
  onAddComment: (comment: ProjectComment) => void;
  onModifyComment: (commentId: string, resolved: boolean) => void;
  onStatusChange: (status: "Pending" | "Approved" | "Change-Requested") => void;
}

export const DesignCollaboration: React.FC<DesignCollaborationProps> = ({
  project,
  customer,
  onAddComment,
  onModifyComment,
  onStatusChange,
}) => {
  // Comments history
  const commentsList = project.comments || [];
  
  // States
  const [commentText, setCommentText] = useState("");
  const [isAdjustment, setIsAdjustment] = useState(false);
  const [simulateAs, setSimulateAs] = useState<"Designer" | "Customer">("Customer");
  
  // 3D Visualizer variables
  const [rotationAngle, setRotationAngle] = useState(25); // orbit rotateY
  const [drapingDepth, setDrapingDepth] = useState(60); // 3D fabric thickness
  const [lightingMode, setLightingMode] = useState<"runway" | "studio" | "candle">("runway");

  const commentsCount = commentsList.length;
  const activeAdjustments = commentsList.filter(c => c.isAdjustmentRequest && !c.isResolved);
  const resolvedAdjustments = commentsList.filter(c => c.isAdjustmentRequest && c.isResolved);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: ProjectComment = {
      id: "comm-" + Date.now(),
      author: simulateAs,
      text: commentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdjustmentRequest: isAdjustment,
      isResolved: false
    };

    onAddComment(newComment);
    setCommentText("");
    setIsAdjustment(false);
    
    // Auto flag change requested if client logs an adjustment request
    if (isAdjustment && simulateAs === "Customer") {
      onStatusChange("Change-Requested");
    }
  };

  const getSilhouetteScale = () => {
    switch (project.styling.silhouette) {
      case "Ballgown":
        return { w: 1.4, h: 1.0, rx: 70, ry: 15 };
      case "A-Line":
        return { w: 1.2, h: 1.0, rx: 55, ry: 12 };
      case "Mermaid":
        return { w: 1.05, h: 1.05, rx: 34, ry: 10 };
      case "Pencil":
        return { w: 0.85, h: 0.95, rx: 24, ry: 7 };
      default:
        return { w: 1.0, h: 1.0, rx: 42, ry: 10 };
    }
  };

  const currentScale = getSilhouetteScale();

  return (
    <div id="collaborationPanel" className="w-full bg-[#fdfcfb] border border-black/10 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-xs">
      
      {/* 1. LEFT PANEL: INTERACTIVE 3D CAD DRAUGHT PREVIEW */}
      <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-black/10 bg-[#FAF8F5] flex flex-col justify-between text-left min-h-[460px]">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#b45309] font-bold">Interactive CAD Portal</span>
              <h3 className="font-serif italic font-bold text-[#1C1C1C] text-lg mt-0.5">3D Gown Spatial Drape Sandbox</h3>
            </div>
            {/* Quick stats tag */}
            <div className="flex bg-[#F2EFE9] border border-black/5 rounded-sm p-1 gap-1.5 text-[9px] font-mono">
              <span>Orbit: <strong className="text-black">{rotationAngle}°</strong></span>
              <span>•</span>
              <span className="uppercase text-stone-550 font-bold">{lightingMode} Lighting</span>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed font-serif italic mb-6">
            Rotate the customized patterns in 3D space to audit the silhouette fall, fabric grain skew, and seam joints. Set lights below to check how shadows pool on the {project.fabric.name} luster.
          </p>

          {/* Interactive 3D Orbit Sandbox Canvas Frame */}
          <div className="w-full h-80 bg-stone-900 rounded-xl relative overflow-hidden flex items-center justify-center p-4 border border-black/20 shadow-inner">
            
            {/* Ambient Background Glow matching the chosen fabric color */}
            <div 
              className="absolute inset-0 opacity-15 blur-3xl rounded-full scale-75 transition-all duration-500"
              style={{ backgroundColor: project.fabric.color }}
            />

            {/* Custom Lighting Atmosphere Shader Overlay */}
            {lightingMode === "runway" && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-stone-500/10 pointer-events-none" />
            )}
            {lightingMode === "studio" && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />
            )}
            {lightingMode === "candle" && (
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-black/70 pointer-events-none" />
            )}

            {/* Simulated 3D mannequin frame with perspective rotations */}
            <div 
              className="w-48 h-64 flex flex-col items-center justify-center relative transition-transform duration-300 select-none cursor-grab active:cursor-grabbing"
              style={{
                perspective: "600px",
                transform: `rotateY(${rotationAngle}deg)`,
                transformStyle: "preserve-3d"
              }}
            >
              {/* Stand Stem */}
              <div className="w-1.5 h-48 bg-[#a1a1aa] absolute bottom-2 rounded-full" style={{ transform: "translateZ(-10px)" }} />
              
              {/* Core Mannequin body pieces stacked in simulated 3D */}
              {/* Shoulder Bar */}
              <div 
                className="w-24 h-4 bg-stone-800 rounded-full border border-stone-700/60 flex items-center justify-between px-2 absolute top-12"
                style={{ transform: `translateZ(0px) scale(${1.0})` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-700 border border-amber-900" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-700 border border-amber-900" />
              </div>

              {/* Upper Chest (Dress Fabric layer) */}
              <div 
                className="h-16 rounded-b-[45px] rounded-t-[10px] border border-black/40 flex items-center justify-center absolute top-16 shadow-md transition-all duration-300"
                style={{ 
                  transform: `translateZ(10px) scale(${0.85})`,
                  backgroundColor: project.fabric.color,
                  width: `${80 * currentScale.w}px`,
                  opacity: 0.95
                }}
              >
                {/* 3D Sew Seam Line indicator */}
                <div className="w-1/2 h-full border-r border-dashed border-white/20" />
              </div>

              {/* Waist Section */}
              <div 
                className="h-10 rounded-[10px] border border-black/30 flex items-center justify-center absolute top-32 shadow-sm transition-all duration-300"
                style={{ 
                  transform: `translateZ(15px) scale(${0.72})`,
                  backgroundColor: project.fabric.color,
                  width: `${75 * currentScale.w}px`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)"
                }}
              >
                {/* Belt buckle element if active */}
                {project.styling.hasBelt && (
                  <div className="w-4 h-4 bg-amber-500 border border-amber-900 rounded-xs ring-1 ring-white/10" />
                )}
              </div>

              {/* Lower Skirt Silhouette (This grows based on silhouette Choice) */}
              <div 
                className="rounded-t-[12px] border-x border-b border-black/40 absolute top-40 shadow-lg transition-all duration-300"
                style={{ 
                  transform: `translateZ(8px)`,
                  backgroundColor: project.fabric.color,
                  height: project.styling.length === "Mini" ? "35px" : project.styling.length === "Midi" ? "65px" : "110px",
                  width: `${90 * currentScale.w}px`,
                  borderRadius: project.styling.silhouette === "Mermaid" ? "10px 10px 40px 40px" : "10px 10px 20px 20px",
                  opacity: 0.92
                }}
              >
                {/* Slit line representation */}
                {project.styling.hasSlit && (
                  <div className="h-full border-r-2 border-amber-500/80 absolute right-4 bottom-0 border-dashed" />
                )}
              </div>

              {/* Floating Spatial coordinates pins! */}
              <div className="absolute top-24 left-4 flex gap-1 items-center bg-stone-900/90 border border-amber-500/40 text-[8px] text-amber-500 font-mono py-0.5 px-1.5 rounded-full" style={{ transform: "translateZ(30px)" }}>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" /> Bust Frame
              </div>
              <div className="absolute top-36 right-0 flex gap-1 items-center bg-stone-900/90 border border-amber-500/40 text-[8px] text-amber-500 font-mono py-0.5 px-1.5 rounded-full" style={{ transform: "translateZ(35px)" }}>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" /> Waist Band
              </div>
            </div>

            {/* Drag instruction helper */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[#A1A1AA] text-[9px] font-mono">
              <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 text-amber-500 animate-spin" /> Use slider below to spin</span>
              <span className="bg-stone-800 p-1 px-2 rounded-xs border border-stone-700 font-bold tracking-wider uppercase text-[8px] text-white">3D Spatial Wireframe</span>
            </div>
          </div>

          {/* Interactive Rotation & Depth Sliders */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex justify-between text-[10px] uppercase font-bold text-stone-500 mb-1 font-mono">
                <span>Yaw Space Rotation</span>
                <span className="text-black font-semibold">{rotationAngle}°</span>
              </label>
              <input
                id="sliderRotationAngle"
                type="range"
                min="-180"
                max="180"
                value={rotationAngle}
                onChange={(e) => setRotationAngle(Number(e.target.value))}
                className="w-full accent-black bg-stone-200 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="flex justify-between text-[10px] uppercase font-bold text-stone-500 mb-1 font-mono">
                <span>Lighting Focus</span>
                <span className="text-black uppercase font-semibold">{lightingMode}</span>
              </label>
              <div className="flex bg-[#F2EFE9] border border-black/10 p-0.5 rounded-sm">
                {(["runway", "studio", "candle"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLightingMode(mode)}
                    className={`flex-1 text-[9px] uppercase font-bold py-1 rounded-xs transition-all ${lightingMode === mode ? "bg-black text-[#FDFCFB]" : "text-stone-500 hover:text-black"}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom markup markers checklist for designer */}
        <div className="mt-6 border-t border-black/10 pt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-mono font-bold uppercase text-stone-900 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#b45309]" />
              Dressmaker Adjustments Checklist
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
              {activeAdjustments.length} pending
            </span>
          </div>

          {activeAdjustments.length > 0 ? (
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {activeAdjustments.map((adj) => (
                <div 
                  key={adj.id} 
                  id={`adj-${adj.id}`}
                  className="flex items-start justify-between bg-white border border-dashed border-amber-500/30 p-2.5 rounded-lg gap-3"
                >
                  <div className="text-left">
                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-xs tracking-wider bg-rose-50 text-rose-800">
                      Markup {adj.author}
                    </span>
                    <p className="text-xs text-stone-900 mt-1 font-serif leading-tight">{adj.text}</p>
                  </div>
                  <button
                    onClick={() => {
                      onModifyComment(adj.id, true);
                    }}
                    className="flex shrink-0 items-center justify-center gap-1 p-1 bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-mono font-bold tracking-tight rounded-sm transition-colors border border-green-200"
                  >
                    <Check className="w-3 h-3" /> Resolve
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs italic text-stone-400 bg-stone-50 py-3 rounded-lg border border-black/5 text-center">
              All client markup requests have been successfully integrated. Sizing is ready for layout drafting blocks.
            </div>
          )}

          {/* Resolved log pill tags */}
          {resolvedAdjustments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-mono uppercase text-stone-400">Recently Resolved:</span>
              {resolvedAdjustments.map(adj => (
                <span key={adj.id} className="text-[9px] font-mono text-stone-600 bg-stone-100 border border-stone-200 rounded-sm px-2 py-0.5 line-through">
                  {adj.text.length > 25 ? adj.text.substring(0, 25) + "..." : adj.text}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 2. RIGHT PANEL: DISCUSSION FORUM THREAD */}
      <div className="lg:col-span-5 p-6 flex flex-col justify-between h-full bg-[#fcfbfa] min-h-[460px]">
        {/* Header Title */}
        <div className="text-left pb-3 border-b border-black/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-stone-700" />
              <h4 className="font-serif italic font-bold text-stone-900">Collaboration Feed</h4>
            </div>
            <span className="text-[10px] bg-stone-200 text-stone-700 px-2.5 py-1 rounded-sm font-mono uppercase font-bold">
              {commentsCount} comments
            </span>
          </div>
          <p className="text-[10px] mt-1 text-stone-500">
            Realtime workspace feed between customer and atelier master designer.
          </p>
        </div>

        {/* Simulated Actor choice switcher */}
        <div className="bg-[#FAF8F5] border border-black/10 p-2.5 rounded-lg flex items-center justify-between text-left my-4">
          <div>
            <span className="text-[8px] font-mono font-bold uppercase text-stone-400 block">SIMULATE ACTIVE SENDER PERSPECTIVE</span>
            <span className="text-xs text-stone-700 font-serif font-semibold">Post comments as: <strong className={simulateAs === "Designer" ? "text-[#b45309]" : "text-purple-800"}>{simulateAs}</strong></span>
          </div>
          <button
            id="btnToggleSimulationRole"
            onClick={() => setSimulateAs(simulateAs === "Customer" ? "Designer" : "Customer")}
            className="p-1 px-3 bg-black hover:bg-stone-800 text-white hover:text-white rounded-xs transition-all text-[9px] uppercase tracking-wider font-mono font-bold"
          >
            Switch Role
          </button>
        </div>

        {/* Message feed stream */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[250px] lg:max-h-[350px] scrollbar-thin text-left">
          {commentsList.map((comm) => {
            const isClient = comm.author === "Customer";
            return (
              <div 
                key={comm.id} 
                id={`comment-${comm.id}`}
                className={`flex gap-2.5 max-w-[85%] ${isClient ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                {/* Micro avatar */}
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold shadow-xs border ${
                  isClient 
                    ? "bg-purple-100 text-purple-800 border-purple-200" 
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}>
                  {comm.author.charAt(0)}
                </span>

                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold ${isClient ? "text-purple-950 font-serif italic" : "text-stone-850"}`}>
                      {isClient ? customer.name : "Atelier Tailor"}
                    </span>
                    <span className="text-[9px] text-stone-400 font-mono">
                      {comm.timestamp}
                    </span>

                    {comm.isAdjustmentRequest && (
                      <span className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded-xs flex items-center gap-0.5 tracking-tight ${
                        comm.isResolved 
                          ? "bg-green-100 text-green-700 border border-green-200" 
                          : "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                      }`}>
                        <Tag className="w-2 h-2" /> Adjustment
                      </span>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border leading-relaxed text-xs ${
                    isClient 
                      ? "bg-purple-50/40 text-purple-950 border-purple-100/60 rounded-tl-none font-serif italic" 
                      : "bg-white text-stone-900 border-black/5 rounded-tr-none"
                  }`}>
                    {comm.text}
                  </div>
                </div>
              </div>
            );
          })}

          {commentsList.length === 0 && (
            <div className="text-center py-12 text-stone-400 font-serif italic text-xs">
              No comments posted on this project yet. Use the block below to request styling modifications or layout adjustments.
            </div>
          )}
        </div>

        {/* Input box form to post messages */}
        <form onSubmit={handleSubmitComment} className="mt-4 border-t border-black/10 pt-4 text-left">
          <div className="flex flex-col gap-3">
            <textarea
              id="collabCommentInput"
              rows={2}
              placeholder={simulateAs === "Customer" 
                ? "Request a lower neckline, add pockets, adjust inseam..." 
                : "Enter tailoring confirmation details or reply to client adjustments..."
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-[#fdfcfb] border border-black/20 text-stone-900 text-xs p-2.5 rounded-md focus:border-stone-900 outline-none resize-none font-sans"
            />

            <div className="flex flex-wrap justify-between items-center gap-2">
              {/* Toggle to request custom sizing adjustment */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  id="chkIsAdjustmentRequest"
                  type="checkbox"
                  checked={isAdjustment}
                  onChange={(e) => setIsAdjustment(e.target.checked)}
                  className="rounded-xs accent-black border-black/20 h-3.5 w-3.5"
                />
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 hover:text-black transition-colors">
                  Flag as Specific Pattern Adjustment
                </span>
              </label>

              <button
                id="btnSubmitComment"
                type="submit"
                className="px-4 py-2 bg-black hover:bg-stone-850 text-white rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> Post Comment
              </button>
            </div>
          </div>
        </form>

      </div>

    </div>
  );
};
