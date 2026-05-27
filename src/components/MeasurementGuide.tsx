/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Customer, Measurements, UnitType } from "../types";
import { 
  User, 
  Search, 
  Plus, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Scale, 
  Mail, 
  Phone,
  HelpCircle
} from "lucide-react";

interface MeasurementGuideProps {
  customers: Customer[];
  activeCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (id: string, updated: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const MeasurementGuide: React.FC<MeasurementGuideProps> = ({
  customers,
  activeCustomerId,
  onSelectCustomer,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKey, setSelectedKey] = useState<keyof Omit<Measurements, "unit">>("chest");

  // Temporary state for creating new client profile
  const [isCreating, setIsCreating] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustUnit, setNewCustUnit] = useState<UnitType>("inches");
  const [newCustGender, setNewCustGender] = useState<"female" | "male">("female");
  
  // Custom baseline measurement ranges
  const [newCustChest, setNewCustChest] = useState(36);
  const [newCustWaist, setNewCustWaist] = useState(28);
  const [newCustHips, setNewCustHips] = useState(38);
  const [newCustInseam, setNewCustInseam] = useState(30);
  const [newCustHeight, setNewCustHeight] = useState(65);
  const [newCustShoulder, setNewCustShoulder] = useState(15);
  const [newCustSleeve, setNewCustSleeve] = useState(22);
  const [newCustNeck, setNewCustNeck] = useState(13.5);

  const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];

  // Search filter
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Map metadata for highlighted measurement properties
  const guideDetails: Record<keyof Omit<Measurements, "unit">, {
    label: string;
    instructions: string;
    proTip: string;
    anatomyY: number; // for SVG highlight
    anatomyX: number;
    anatomyWidth: number;
    svgElement: "ellipse" | "line" | "vertical" | "inseam";
  }> = {
    chest: {
      label: "Bust / Chest Circumference",
      instructions: "Keep the measuring tape parallel to the floor. Guide it straight across your back, beneath the underarms, and wrap over the fullest part of the bustline. Keep fingers flat behind the tape.",
      proTip: "Wear your typical undergarment or custom corset base to ensure the bust line curvature is sculpted accurately for the final patterns.",
      anatomyY: 105,
      anatomyX: 100,
      anatomyWidth: 50,
      svgElement: "ellipse",
    },
    waist: {
      label: "Natural Waist Circumference",
      instructions: "Wrap the tape horizontally around your natural waistline—this is the narrowest point of the torso, typically situated 1-2 inches above the navel. Breathe normally and do not suck in.",
      proTip: "If unsure of natural waistline location, bend sideways slightly; the crease that forms is your natural waist height marker.",
      anatomyY: 155,
      anatomyX: 105,
      anatomyWidth: 40,
      svgElement: "ellipse",
    },
    hips: {
      label: "Low Hips Circumference",
      instructions: "Stand with heels perfectly closed together. Loop the tape level and flat around the widest horizontal contour of your lower seat and pelvic bones.",
      proTip: "Check your side profile in a mirror to guarantee the tape lies flat at peak level depth across the glutes and pelvic crests.",
      anatomyY: 195,
      anatomyX: 98,
      anatomyWidth: 54,
      svgElement: "ellipse",
    },
    inseam: {
      label: "Inner Leg Inseam Length",
      instructions: "Measure from the uppermost crotch point flat down along the inner thigh wall down to the ankle bone level. Best performed barefoot while standing straight.",
      proTip: "If measuring yourself, trace along the inseam of a perfectly fitting pair of trousers laid flat on a cutting table instead.",
      anatomyY: 260,
      anatomyX: 116,
      anatomyWidth: 105,
      svgElement: "inseam",
    },
    height: {
      label: "Total Body Vertical Height",
      instructions: "Stand tall with bare feet flat, back resting flat against a clean door frame or wall. Measure from the highest crown of your head down to the base floor level.",
      proTip: "Keep chin tuck level and gaze forward. Placing a stiff book flat atop the crown helps project a perfect right angle coordinate to the wall.",
      anatomyY: 30,
      anatomyX: 150,
      anatomyWidth: 330,
      svgElement: "vertical",
    },
    shoulder: {
      label: "Shoulder-to-Shoulder Span",
      instructions: "Measure straight across the upper hump of your back, starting from the outermost tip bony crest of the left shoulder directly across to the right tip bone.",
      proTip: "Avoid stiff posture or squeezing shoulder blades back. A natural relaxed droop is required for comfortable movement ease in final sleeves.",
      anatomyY: 82,
      anatomyX: 74,
      anatomyWidth: 52,
      svgElement: "line",
    },
    sleeve: {
      label: "Full Sleeve Length",
      instructions: "Keep the arm slightly bent at a 30-degree posture. Trace from the outer shoulder tip crest bone, down over the point of the elbow, down to your protruding wrist bone flat.",
      proTip: "Measuring with a bent elbow guarantees that when the customer bends or reaches, their wrists do not pull up uncomfortably.",
      anatomyY: 120,
      anatomyX: 68,
      anatomyWidth: 100,
      svgElement: "line",
    },
    neck: {
      label: "Neck Base Circumference",
      instructions: "Wrap the fabric tape around the lowermost base of the neck where a shirt collar comfortably rests. Insert one finger flat behind the tape for breathability ease.",
      proTip: "For high-neck or Victorian style wedding gown collars, take this measurement firmly without adding extra default ease multipliers.",
      anatomyY: 65,
      anatomyX: 112,
      anatomyWidth: 16,
      svgElement: "ellipse",
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newProfile: Customer = {
      id: "cust-" + Date.now(),
      name: newCustName,
      email: newCustEmail || "client" + Date.now() + "@atelier.com",
      phone: newCustPhone || "+1 (555) 000-0000",
      gender: newCustGender,
      measurements: {
        unit: newCustUnit,
        chest: Number(newCustChest),
        waist: Number(newCustWaist),
        hips: Number(newCustHips),
        inseam: Number(newCustInseam),
        height: Number(newCustHeight),
        shoulder: Number(newCustShoulder),
        sleeve: Number(newCustSleeve),
        neck: Number(newCustNeck),
      }
    };

    onAddCustomer(newProfile);
    setIsCreating(false);
    
    // Reset states
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
  };

  const handleMeasurementEdit = (key: keyof Omit<Measurements, "unit">, val: number) => {
    if (!activeCustomer) return;
    const updated = {
      ...activeCustomer,
      measurements: {
        ...activeCustomer.measurements,
        [key]: val
      }
    };
    onUpdateCustomer(activeCustomer.id, updated);
  };

  const toggleUnit = () => {
    if (!activeCustomer) return;
    const currentUnit = activeCustomer.measurements.unit;
    const nextUnit: UnitType = currentUnit === "inches" ? "cm" : "inches";
    
    // Scale existing values dynamically for seamless UX
    const factor = nextUnit === "cm" ? 2.54 : 1 / 2.54;
    const roundVal = (v: number) => Math.round(v * factor * 10) / 10;

    const updated = {
      ...activeCustomer,
      measurements: {
        unit: nextUnit,
        chest: roundVal(activeCustomer.measurements.chest),
        waist: roundVal(activeCustomer.measurements.waist),
        hips: roundVal(activeCustomer.measurements.hips),
        inseam: roundVal(activeCustomer.measurements.inseam),
        height: roundVal(activeCustomer.measurements.height),
        shoulder: roundVal(activeCustomer.measurements.shoulder),
        sleeve: roundVal(activeCustomer.measurements.sleeve),
        neck: roundVal(activeCustomer.measurements.neck),
      }
    };
    onUpdateCustomer(activeCustomer.id, updated);
  };

  return (
    <div id="measurementGuideRoot" className="w-full bg-[#fdfcfb] min-h-[600px] border border-black/10 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
      
      {/* 1. LEFT COLUMN: CUSTOMERS DIRECTORY */}
      <div className="lg:col-span-4 bg-[#fbf9f6] border-r border-black/10 p-5 flex flex-col h-full min-h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-stone-700" />
            <h3 className="font-serif italic font-bold text-stone-900">Atelier Directory</h3>
          </div>
          <span className="text-[10px] uppercase bg-black text-[#fdfcfb] px-2 py-0.5 rounded-xs font-bold font-mono">
            {filteredCustomers.length} saved
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="guideClientSearch"
            type="text"
            placeholder="Search client index..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F2EFE9]/60 border border-black/10 rounded-md py-1.5 pl-8 pr-3 text-xs outline-none focus:border-black transition-all"
          />
        </div>

        {/* Directory List Or Action Forms */}
        {!isCreating ? (
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] lg:max-h-[520px] scrollbar-thin">
            {filteredCustomers.map((cust) => {
              const isActive = cust.id === activeCustomerId;
              return (
                <div
                  key={cust.id}
                  id={`cust-card-${cust.id}`}
                  onClick={() => onSelectCustomer(cust.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left ${
                    isActive 
                      ? "bg-white border-black shadow-xs ring-1 ring-black" 
                      : "bg-white/40 border-black/5 hover:bg-stone-50 hover:border-black/10"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-serif italic font-semibold text-stone-900 text-sm">{cust.name}</h4>
                      <p className="text-[10px] text-stone-500 font-mono mt-0.5 flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" /> {cust.email}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {cust.phone}
                      </p>
                    </div>

                    {/* Exclude deleting the first protected user */}
                    {cust.id !== "cust-1" && (
                      <button
                        title="Delete customer index"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to completely remove ${cust.name} profile from the database?`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="p-1 hover:text-red-600 text-stone-400 hover:bg-red-50 rounded-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-black/5 text-[9px] text-stone-600 font-mono">
                    <div>B: <span className="font-bold text-black">{cust.measurements.chest}</span></div>
                    <div>W: <span className="font-bold text-black">{cust.measurements.waist}</span></div>
                    <div>H: <span className="font-bold text-black">{cust.measurements.hips}</span></div>
                    <div>Inseam: <span className="font-bold text-[#b45309]">{cust.measurements.inseam || 30}</span></div>
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-xs italic">
                No matching customer profiles.
              </div>
            )}

            <button
              id="btnAddProfileInteractive"
              onClick={() => setIsCreating(true)}
              className="w-full py-3 border border-dashed border-black/20 hover:border-black rounded-lg text-xs font-semibold flex items-center justify-center gap-2 text-stone-700 hover:bg-[#F2EFE9] transition-all mt-4"
            >
              <Plus className="w-4 h-4" /> Add Bespoke Customer Index
            </button>
          </div>
        ) : (
          /* FORM TO ADD NEW CUSTOMER */
          <form onSubmit={handleCreateSubmit} className="space-y-3.5 bg-white p-4 rounded-xl border border-black/10 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">New Master Profile</h4>
            
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Full Name</label>
              <input
                id="createCustName"
                type="text"
                required
                placeholder="Elena Rostova"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="w-full bg-[#fbf9f6] border border-black/10 rounded-md p-1.5 text-xs outline-none focus:border-black font-serif"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Email</label>
                <input
                  id="createCustEmail"
                  type="email"
                  placeholder="elena@couture.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-[#fbf9f6] border border-black/10 rounded-md p-1.5 text-[11px] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Phone</label>
                <input
                  id="createCustPhone"
                  type="text"
                  placeholder="+1 (555) 300-2012"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-[#fbf9f6] border border-black/10 rounded-md p-1.5 text-[11px] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Unit Preference</label>
                <select
                  value={newCustUnit}
                  onChange={(e) => setNewCustUnit(e.target.value as UnitType)}
                  className="w-full bg-[#fbf9f6] border border-black/10 rounded-md p-1.5 text-xs outline-none"
                >
                  <option value="inches">Inches (Standard Imperial)</option>
                  <option value="cm">Centimeters (Standard Metric)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Gender Structure</label>
                <select
                  value={newCustGender}
                  onChange={(e) => setNewCustGender(e.target.value as "female" | "male")}
                  className="w-full bg-[#fbf9f6] border border-black/10 rounded-md p-1.5 text-xs outline-none focus:border-black font-semibold"
                >
                  <option value="female">Female Outline (Hourglass)</option>
                  <option value="male">Male Outline (Inverted Tri)</option>
                </select>
              </div>
            </div>

            {/* Quick base sizes layout */}
            <div className="grid grid-cols-3 gap-2 border-t border-black/5 pt-2">
              <div>
                <label className="block text-[9px] uppercase text-stone-500">Bust</label>
                <input
                  id="createCustChest"
                  type="number"
                  step="0.5"
                  value={newCustChest}
                  onChange={(e) => setNewCustChest(Number(e.target.value))}
                  className="w-full bg-[#fbf9f6] border border-black/5 p-1 text-xs rounded-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-stone-500">Waist</label>
                <input
                  id="createCustWaist"
                  type="number"
                  step="0.5"
                  value={newCustWaist}
                  onChange={(e) => setNewCustWaist(Number(e.target.value))}
                  className="w-full bg-[#fbf9f6] border border-black/5 p-1 text-xs rounded-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-stone-500">Hips</label>
                <input
                  id="createCustHips"
                  type="number"
                  step="0.5"
                  value={newCustHips}
                  onChange={(e) => setNewCustHips(Number(e.target.value))}
                  className="w-full bg-[#fbf9f6] border border-black/5 p-1 text-xs rounded-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] uppercase text-stone-500">Inseam</label>
                <input
                  id="createCustInseam"
                  type="number"
                  step="0.5"
                  value={newCustInseam}
                  onChange={(e) => setNewCustInseam(Number(e.target.value))}
                  className="w-full bg-[#fbf9f6] border border-black/5 p-1 text-xs rounded-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-stone-500">Height</label>
                <input
                  id="createCustHeight"
                  type="number"
                  step="0.5"
                  value={newCustHeight}
                  onChange={(e) => setNewCustHeight(Number(e.target.value))}
                  className="w-full bg-[#fbf9f6] border border-black/5 p-1 text-xs rounded-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-stone-500">Shoulder</label>
                <input
                  id="createCustShoulder"
                  type="number"
                  step="0.5"
                  value={newCustShoulder}
                  onChange={(e) => setNewCustShoulder(Number(e.target.value))}
                  className="w-full bg-[#fbf9f6] border border-black/5 p-1 text-xs rounded-sm font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-black text-white rounded-sm text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-colors"
              >
                Create Hub
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 p-1.5 rounded-sm text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. CENTER COLUMN: INTERACTIVE VISUAL MODEL */}
      <div className="lg:col-span-5 bg-white p-5 flex flex-col items-center justify-center border-r border-black/10">
        <span className="text-[10px] uppercase tracking-widest text-[#b45309] font-bold mb-1">Tailoring Pattern mapping</span>
        <h3 className="font-serif italic text-lg text-stone-900 mb-4 text-center">
          Interactive Anatomical Blueprint
        </h3>

        <div className="w-full max-w-[280px] border border-black/5 bg-[#fbfcfb] rounded-2xl relative p-4 shadow-inner flex items-center justify-center">
          
          {/* Anatomical SVG Mannequin Shape with floating measuring path overlays */}
          <svg viewBox="0 0 200 400" className="w-full h-auto drop-shadow-xs max-h-[350px]">
            {/* Guide Grid Gridlines */}
            <line x1="100" y1="20" x2="100" y2="380" stroke="#f1ece6" strokeWidth="1" />
            <line x1="20" y1="150" x2="180" y2="150" stroke="#f1ece6" strokeWidth="1" />
            <line x1="20" y1="250" x2="180" y2="250" stroke="#f1ece6" strokeWidth="1" />

            {/* Model Anatomy base outlines */}
            {!(activeCustomer?.gender === "male") ? (
              <g id="anatomicalBodyOutline" opacity="0.32" stroke="#1c1c1c" fill="none" strokeWidth="1.2" strokeLinecap="round">
                {/* Head crown and face contour */}
                <path d="M 100,56 C 92,56 86,50 86,40 C 86,30 92,24 100,24 C 108,24 114,30 114,40 C 114,50 108,56 100,56 Z" fill="#F2EFE9" />
                {/* Neck column */}
                <path d="M 96,56 L 96,68 L 104,68 L 104,56 Z" fill="#F2EFE9" />
                {/* Shoulders arch */}
                <path d="M 74,80 Q 100,74 126,80" />
                {/* Arm holes, arm lines to wrists */}
                <path d="M 74,80 L 68,140 L 63,200" /> {/* Left arm */}
                <path d="M 126,80 L 132,140 L 137,200" /> {/* Right arm */}
                
                {/* Core Torso (Upper Chest, waist, lower seat hip contour) */}
                <path d="M 74,80 L 78,110 Q 82,150 85,160 L 80,195 Q 74,230 73,260 L 84,380" /> {/* Left side body and leg */}
                <path d="M 126,80 L 122,110 Q 118,150 115,160 L 120,195 Q 126,230 127,260 L 116,380" /> {/* Right side body and leg */}
                
                {/* Outer feet bones */}
                <path d="M 78,380 Q 84,385 88,380" />
                <path d="M 122,380 Q 116,385 112,380" />
              </g>
            ) : (
              <g id="anatomicalBodyOutlineMale" opacity="0.32" stroke="#1c1c1c" fill="none" strokeWidth="1.2" strokeLinecap="round">
                {/* Head crown and broader jaw face contour */}
                <path d="M 100,54 C 91,54 85,48 85,38 C 85,28 91,22 100,22 C 109,22 115,28 115,38 C 115,48 109,54 100,54 Z" fill="#F2EFE9" />
                {/* Neck column - slightly thicker for male */}
                <path d="M 95,54 L 95,68 L 105,68 L 105,54 Z" fill="#F2EFE9" />
                {/* Shoulders arch - broader for male */}
                <path d="M 66,76 Q 100,71 134,76" />
                {/* Arm holes, arm lines to wrists - hanging outer */}
                <path d="M 66,76 L 59,138 L 54,200" /> {/* Left arm */}
                <path d="M 134,76 L 141,138 L 146,200" /> {/* Right arm */}
                
                {/* Core Torso (Broad chest, straight waist, standard hips) */}
                <path d="M 66,76 L 72,112 Q 78,152 79,162 L 77,195 Q 75,230 75,260 L 84,380" /> {/* Left side body and leg */}
                <path d="M 134,76 L 128,112 Q 122,152 121,162 L 123,195 Q 125,230 125,260 L 116,380" /> {/* Right side body and leg */}
                
                {/* Outer feet bones */}
                <path d="M 78,380 Q 84,385 88,380" />
                <path d="M 122,380 Q 116,385 112,380" />
              </g>
            )}

            {/* INTERACTIVE MEASURING PATH HIGHLIGHTERS */}
            {/* Height (vertical height beam on left) */}
            {selectedKey === "height" && (
              <g id="activeHighlighterHeight">
                <line x1="30" y1="24" x2="30" y2="380" stroke="#d97706" strokeWidth="2.5" />
                <line x1="25" y1="24" x2="35" y2="24" stroke="#d97706" strokeWidth="2.5" />
                <line x1="25" y1="380" x2="35" y2="380" stroke="#d97706" strokeWidth="2.5" />
                {/* Dynamic ticker annotations */}
                <circle cx="30" cy="202" r="6" fill="#d97706" />
                <path d="M 30,24 L 100,24" stroke="#b45309" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M 30,380 L 100,380" stroke="#b45309" strokeWidth="1" strokeDasharray="3 3" />
              </g>
            )}

            {/* Neck contour highlight */}
            {selectedKey === "neck" && (
              <ellipse 
                cx="100" 
                cy={guideDetails.neck.anatomyY} 
                rx="8" 
                ry="3" 
                fill="none" 
                stroke="#d97706" 
                strokeWidth="4" 
                className="animate-pulse"
              />
            )}

            {/* Shoulder to shoulder highlight */}
            {selectedKey === "shoulder" && (
              <line 
                x1={guideDetails.shoulder.anatomyX} 
                y1={guideDetails.shoulder.anatomyY} 
                x2={126} 
                y2={80} 
                stroke="#d97706" 
                strokeWidth="4" 
                className="animate-pulse"
              />
            )}

            {/* Chest contour highlight */}
            {selectedKey === "chest" && (
              <g>
                <ellipse cx="100" cy={guideDetails.chest.anatomyY} rx="23" ry="5.5" fill="none" stroke="#d97706" strokeWidth="4" className="animate-pulse" />
                <line x1="77" y1={guideDetails.chest.anatomyY} x2="123" y2={guideDetails.chest.anatomyY} stroke="#d97706" strokeWidth="2" />
              </g>
            )}

            {/* Waist contour highlight */}
            {selectedKey === "waist" && (
              <g>
                <ellipse cx="100" cy={guideDetails.waist.anatomyY} rx="16.5" ry="4.5" fill="none" stroke="#d97706" strokeWidth="4" className="animate-pulse" />
                <line x1="83.5" y1={guideDetails.waist.anatomyY} x2="116.5" y2={guideDetails.waist.anatomyY} stroke="#d97706" strokeWidth="2" />
              </g>
            )}

            {/* Hips contour highlight */}
            {selectedKey === "hips" && (
              <g>
                <ellipse cx="100" cy={guideDetails.hips.anatomyY} rx="23" ry="5.5" fill="none" stroke="#d97706" strokeWidth="4" className="animate-pulse" />
                <line x1="77" y1={guideDetails.hips.anatomyY} x2="123" y2={guideDetails.hips.anatomyY} stroke="#d97706" strokeWidth="2" />
               </g>
            )}

            {/* Inseam highlight */}
            {selectedKey === "inseam" && (
              <g>
                {/* Trace inner leg crotch to ankle bone */}
                <path d="M 98,240 Q 94,300 84,380" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                <circle cx="98" cy="240" r="4" fill="#b45309" />
                <circle cx="84" cy="380" r="4" fill="#b45309" />
                {/* Arrow indicator */}
                <path d="M 74,310 Q 94,310 94,310" stroke="#d97706" strokeWidth="1" strokeDasharray="2 2" />
              </g>
            )}

            {/* Sleeve length highlight */}
            {selectedKey === "sleeve" && (
              <path d="M 126,80 L 132,140 L 137,200" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
            )}
          </svg>

          {/* Prompt Click overlays on key regions relative coordinates */}
          <button onClick={() => setSelectedKey("height")} className="absolute top-[4%] left-[45%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">Ht</button>
          <button onClick={() => setSelectedKey("neck")} className="absolute top-[16%] left-[46%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">Nk</button>
          <button onClick={() => setSelectedKey("shoulder")} className="absolute top-[21%] left-[18%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">Sh</button>
          <button onClick={() => setSelectedKey("sleeve")} className="absolute top-[32%] left-[10%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">Sv</button>
          <button onClick={() => setSelectedKey("chest")} className="absolute top-[26%] left-[44%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">
            {activeCustomer?.gender === "male" ? "Chest" : "Bust"}
          </button>
          <button onClick={() => setSelectedKey("waist")} className="absolute top-[38%] left-[44%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">Waist</button>
          <button onClick={() => setSelectedKey("hips")} className="absolute top-[48%] left-[44%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">Hip</button>
          <button onClick={() => setSelectedKey("inseam")} className="absolute top-[68%] left-[34%] p-1.5 text-[8px] bg-stone-100 hover:bg-black hover:text-white rounded-full font-mono font-bold transition-all border border-stone-200">Inseam</button>
        </div>

        <p className="text-[10px] text-stone-400 mt-3 italic text-center max-w-[240px]">
          *Pro Tip: Tap direct label bubbles on the anatomy shape above to swap highlight focuses.
        </p>
      </div>

      {/* 3. RIGHT COLUMN: DETAIL FOCUS & ACTION CARD */}
      <div className="lg:col-span-3 bg-[#fdfcfb]">
        {activeCustomer ? (
          <div className="p-5 flex flex-col h-full justify-between">
            {/* Header Client Name */}
            <div>
              <div className="flex justify-between items-start gap-1 pb-2 border-b border-black/5 mb-4">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Selected Profile</span>
                  <h4 className="font-serif italic font-bold text-stone-950 text-base">{activeCustomer.name}</h4>
                  <span className="inline-block mt-1 text-[8px] font-mono font-bold uppercase tracking-wider text-stone-600 bg-stone-200/50 px-1.5 py-0.5 rounded-sm">
                    {activeCustomer.gender || "female"} contour
                  </span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button
                    id="btnToggleGuideUnit"
                    onClick={toggleUnit}
                    className="px-2 py-1 bg-[#F2EFE9] hover:bg-stone-200 border border-black/5 text-[9px] font-mono rounded-sm tracking-wide font-bold transition-colors"
                  >
                    Unit: {activeCustomer.measurements.unit}
                  </button>
                  <button
                    id="btnToggleGenderSelector"
                    type="button"
                    onClick={() => {
                      const nextG = (activeCustomer.gender || "female") === "female" ? "male" : "female";
                      onUpdateCustomer(activeCustomer.id, { ...activeCustomer, gender: nextG });
                    }}
                    className="px-2 py-0.5 bg-black hover:bg-stone-800 text-white border border-transparent text-[8px] font-mono rounded-xs tracking-wide transition-colors"
                  >
                    Swap Outline
                  </button>
                </div>
              </div>

              {/* Grid of editable measurement points */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {(Object.keys(guideDetails) as Array<keyof Omit<Measurements, "unit">>).map((k) => {
                  const isActiveField = k === selectedKey;
                  return (
                    <div
                      key={k}
                      onClick={() => setSelectedKey(k)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        isActiveField 
                          ? "bg-[#FDFCFB] border-amber-600 ring-1 ring-amber-500 shadow-xs" 
                          : "bg-[#F2EFE9]/40 border-black/5 hover:border-black/20"
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase block tracking-wide ${isActiveField ? "text-amber-800" : "text-stone-400"}`}>
                        {k === "chest" ? (activeCustomer?.gender === "male" ? "Chest" : "Bust") : k}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          id={`input-guide-${k}`}
                          type="number"
                          step="0.1"
                          value={activeCustomer.measurements[k] || 0}
                          onChange={(e) => handleMeasurementEdit(k, Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()} // avoid select loop
                          className="w-14 bg-white/80 border border-black/10 rounded-sm px-1.5 py-0.5 text-xs text-stone-950 font-bold font-mono outline-none focus:border-black"
                        />
                        <span className="text-[10px] text-stone-500 font-mono">
                          {activeCustomer.measurements.unit === "inches" ? "in" : "cm"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instructions Panel */}
              <div className="bg-[#fbf9f6] border border-black/10 rounded-xl p-4 text-left">
                <div className="flex items-start gap-1.5 text-stone-850 mb-2">
                  <BookOpen className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <h5 className="text-xs uppercase tracking-wide font-bold block text-[#b45309]">
                    {selectedKey === "chest" ? (activeCustomer?.gender === "male" ? "Chest Circumference" : "Bust / Chest Circumference") : guideDetails[selectedKey].label}
                  </h5>
                </div>
                <p className="text-stone-700 text-xs leading-relaxed font-serif italic mb-3">
                  {guideDetails[selectedKey].instructions}
                </p>
                <div className="border-t border-black/5 pt-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block">Atelier Pro Tip:</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5 font-mono">
                    {guideDetails[selectedKey].proTip}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-black/5 mt-4 text-left">
              <div className="flex items-center gap-2 text-stone-500 bg-[#F2EFE9]/50 p-2.5 rounded-lg border border-black/5">
                <HelpCircle className="w-3.5 h-3.5 text-black shrink-0" />
                <span className="text-[10px] leading-tight font-serif text-stone-700">
                  Save profiles! All edits are kept automatically in the local cookie store.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400 italic font-serif flex items-center justify-center h-full">
            Please pick or create a customer profile first from the left panel index.
          </div>
        )}
      </div>

    </div>
  );
};
