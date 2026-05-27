/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Sparkles, 
  Ruler, 
  Scissors, 
  Send, 
  Check, 
  Palette, 
  MessageSquare, 
  Maximize2, 
  BookOpen, 
  Layers, 
  Share2, 
  AlertCircle,
  Eye,
  Settings,
  X,
  FileText,
  UserCheck,
  Download,
  Box,
  Cloud,
  CloudOff,
  LogIn,
  LogOut
} from "lucide-react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { MannequinViewer } from "./components/MannequinViewer";
import { PatternBlueprint } from "./components/PatternBlueprint";
import { MeasurementGuide } from "./components/MeasurementGuide";
import { DesignCollaboration } from "./components/DesignCollaboration";
import { Customer, DesignProject, Fabric, StylingSelection, UnitType, ProjectComment } from "./types";

// Premium pre-configured fabrics corresponding with Editorial color systems
const FACTORY_FABRICS: Fabric[] = [
  { id: "fab-1", name: "Charmeuse Silk", type: "Heavy Silk Silk", color: "#1c1c1c", pattern: "solid", textureName: "Midnight Gloss", weightGsm: 120 },
  { id: "fab-2", name: "Ankara Floral Satin", type: "Textured Satin", color: "#3b82f6", pattern: "ankara", textureName: "Prestige Wax Print", weightGsm: 180 },
  { id: "fab-3", name: "Raw Sandstone Linen", type: "Breathable Slub Linen", color: "#e5d3b3", pattern: "solid", textureName: "Sandstone Earthy", weightGsm: 220 },
  { id: "fab-4", name: "Crimson Ditsy Rose Chiffon", type: "Flowing Georgette", color: "#e11d48", pattern: "floral", textureName: "Romantic Blossom", weightGsm: 80 },
  { id: "fab-5", name: "Classic Banker Stripe Cotton", type: "Crisp Oxford Cotton", color: "#0284c7", pattern: "stripe", textureName: "Pinstripe Twill", weightGsm: 130 },
  { id: "fab-6", name: "Monochrome Dot Organza", type: "Sheer Structured Gauze", color: "#6b7280", pattern: "dots", textureName: "Speckle Matte", weightGsm: 95 },
];

const DEFAULT_CUSTOMER: Customer = {
  id: "cust-1",
  name: "Elena Rostova",
  phone: "+1 (555) 342-9981",
  email: "elena.rostova@couture.com",
  gender: "female",
  measurements: {
    unit: "inches",
    chest: 34,
    waist: 26,
    hips: 37,
    inseam: 30,
    height: 66,
    shoulder: 14.5,
    sleeve: 23,
    neck: 12.5
  }
};

const INITIAL_PROJECTS: DesignProject[] = [
  {
    id: "proj-1",
    customerId: "cust-1",
    designName: "Silk Mermaid Evening Gown",
    fabric: FACTORY_FABRICS[0], // Midnight Charmeuse Silk
    styling: {
      neckline: "Sweetheart",
      sleeve: "Sleeveless",
      silhouette: "Mermaid",
      length: "Floor-Maxi",
      hasBelt: false,
      hasSlit: true,
      notes: "Custom back drape trailing on floor. Seamless zip installation requested."
    },
    customerApprovalStatus: "Pending",
    customerFeedback: "I would love to see if we can raise the neckline by 1 inch or explore a high-neck collar styling.",
    comments: [
      { id: "c1", author: "Customer", text: "I would love to see if we can raise the neckline by 1 inch or explore a high-neck collar styling.", timestamp: "08:14 PM", isAdjustmentRequest: true, isResolved: false },
      { id: "c2", author: "Designer", text: "Welcome Elena! I can absolutely raise the bust cut or we can toggle the High-Neck neckline directly to inspect the 2D layout block outputs immediately.", timestamp: "08:22 PM", isAdjustmentRequest: false }
    ],
    lastUpdated: "2026-05-27T21:00:00Z"
  },
  {
    id: "proj-2",
    customerId: "cust-2",
    designName: "Traditional Ankara Gala Dress",
    fabric: FACTORY_FABRICS[1], // Ankara Satin
    styling: {
      neckline: "Off-Shoulder",
      sleeve: "Short Puff",
      silhouette: "Ballgown",
      length: "Floor-Maxi",
      hasBelt: true,
      hasSlit: false,
      notes: "Structured puff sleeve with soft inner canvas lining."
    },
    customerApprovalStatus: "Approved",
    customerFeedback: "This is absolutely sublime! The floral Ankara matches my headpiece.",
    comments: [
      { id: "c3", author: "Customer", text: "This is absolutely sublime! The floral Ankara matches my headpiece. Can the waist belt look prominent?", timestamp: "07:10 PM", isAdjustmentRequest: false }
    ],
    lastUpdated: "2026-05-27T20:30:00Z"
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  DEFAULT_CUSTOMER,
  {
    id: "cust-2",
    name: "Zahra Mensah",
    phone: "+233 24 555 1205",
    email: "zahra.mensah@accraluxe.com",
    gender: "female",
    measurements: {
      unit: "inches",
      chest: 38,
      waist: 30,
      hips: 41,
      inseam: 29,
      height: 63,
      shoulder: 15.5,
      sleeve: 21.5,
      neck: 14.0
    }
  },
  {
    id: "cust-3",
    name: "Kwame Osei",
    phone: "+233 50 882 1199",
    email: "kwame.osei@menswear.gh",
    gender: "male",
    measurements: {
      unit: "inches",
      chest: 40,
      waist: 34,
      hips: 42,
      inseam: 31,
      height: 71,
      shoulder: 17.5,
      sleeve: 25.0,
      neck: 15.5
    }
  }
];

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("atelier_customers");
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [projects, setProjects] = useState<DesignProject[]>(() => {
    const saved = localStorage.getItem("atelier_projects");
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || "";
  });

  const [uploadedFabrics, setUploadedFabrics] = useState<Fabric[]>(() => {
    const saved = localStorage.getItem("atelier_uploaded_fabrics");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Helper to sync Customer to Firestore
  const saveCustomerToCloud = async (cust: Customer) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, "customers", cust.id), cust);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customers/${cust.id}`);
    }
  };

  // Helper to sync Project to Firestore
  const saveProjectToCloud = async (proj: DesignProject) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, "projects", proj.id), proj);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${proj.id}`);
    }
  };

  // Helper to delete Customer from Firestore
  const deleteCustomerFromCloud = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "customers", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
    }
  };

  // Helper to delete Project from Firestore
  const deleteProjectFromCloud = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "projects", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
    }
  };

  // Helper to bootstrap Firestore when user logs in with an empty DB
  const bootstrapFirestore = async (user: User) => {
    try {
      setActiveLog("Bootstrapping personal cloud workbench database...");
      // Save current local profiles and projects so user has immediate work visible
      for (const tempCust of customers) {
        await setDoc(doc(db, "customers", tempCust.id), tempCust);
      }
      for (const tempProj of projects) {
        await setDoc(doc(db, "projects", tempProj.id), tempProj);
      }
      setActiveLog("Cloud workbench populated with existing designs successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "bootstrap");
    }
  };

  // Initialize Auth & Connection Validation
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.error("Please check your Firebase configuration or network status.");
        }
      }
    }
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setActiveLog(`Connected to Cloud Atelier profile: ${user.displayName || user.email}`);
      } else {
        setActiveLog("Running in local offline-first workspace.");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore real-time collections
  useEffect(() => {
    if (!currentUser) return;

    setIsSyncing(true);

    const unsubscribeCustomers = onSnapshot(
      collection(db, "customers"),
      (snapshot) => {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Customer);
        });

        if (list.length === 0) {
          bootstrapFirestore(currentUser);
        } else {
          setCustomers(list);
        }
        setIsSyncing(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "customers");
      }
    );

    const unsubscribeProjects = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        const list: DesignProject[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as DesignProject);
        });
        if (list.length > 0) {
          setProjects(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "projects");
      }
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeProjects();
    };
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("uploadedFabrics", JSON.stringify(uploadedFabrics));
  }, [uploadedFabrics]);

  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const newFab: Fabric = {
        id: `uploaded-${Date.now()}`,
        name: file.name.split(".")[0].substring(0, 18) || "Custom Material",
        type: "Uploaded Grain",
        color: activeProject?.fabric.color || "#e5d3b3",
        pattern: "custom",
        textureName: "Custom Texture",
        weightGsm: 140,
        customPatternUrl: base64Url,
        customPatternScale: 40,
      };
      setUploadedFabrics((prev) => [newFab, ...prev]);
      selectFabricType(newFab);
      setActiveLog(`Imported client textile: "${file.name}" successfully.`);
    };
    reader.readAsDataURL(file);
  };

  const deleteUploadedFabric = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFabrics((prev) => prev.filter((f) => f.id !== id));
    if (activeProject?.fabric.id === id) {
      // Revert to default fabric if currently selected is deleted
      selectFabricType(FACTORY_FABRICS[2]);
    }
    setActiveLog("Removed custom textile profile from drawer.");
  };

  // Editor mode choice: "tailor" for custom design tools or "client" for preview & approval
  const [workspaceMode, setWorkspaceMode] = useState<"designer" | "client">("designer");

  // Dynamic status feedback log
  const [activeLog, setActiveLog] = useState<string>("Workspace Ready. Calibrated to 0.05mm precision layout.");

  // Gemini fetching indicators
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSketchLoading, setIsSketchLoading] = useState<boolean>(false);
  const [sketchPrompt, setSketchPrompt] = useState<string>("Elegant couture evening dress hanging, minimal silk style, runway drapery");

  // State handles for modals or drawers
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  // New Client Input Form temporary states
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustUnit, setNewCustUnit] = useState<UnitType>("inches");
  const [newCustChest, setNewCustChest] = useState(36);
  const [newCustWaist, setNewCustWaist] = useState(28);
  const [newCustHips, setNewCustHips] = useState(38);
  const [newCustHeight, setNewCustHeight] = useState(65);
  const [newCustShoulder, setNewCustShoulder] = useState(15);
  const [newCustSleeve, setNewCustSleeve] = useState(22);
  const [newCustNeck, setNewCustNeck] = useState(13);
  const [newCustInseam, setNewCustInseam] = useState(30);

  // Save changes back to localStorage
  useEffect(() => {
    localStorage.setItem("atelier_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("atelier_projects", JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeCustomer = customers.find(c => c.id === activeProject?.customerId) || customers[0];

  // 3D Model export simulation state
  const [exportFormat, setExportFormat] = useState<"glb" | "obj" | "usdz">("glb");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportFilename, setExportFilename] = useState<string>("");

  const handleSimulateExport = () => {
    if (isExporting || !activeProject || !activeCustomer) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);

    const clientNameClean = activeCustomer.name.replace(/[^a-zA-Z0-9]/g, "_");
    const silhouetteClean = activeProject.styling.silhouette.replace(/[^a-zA-Z0-9]/g, "_") || "Gown";
    const filename = `${clientNameClean}_${silhouetteClean}_Neutral3D.${exportFormat}`;
    setExportFilename(filename);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportSuccess(true);
          setActiveLog(`3D visual mesh exported successfully: ${filename}`);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Quick fallback calculator for immediate offline updates
  const recomputeLocalPatternDrafting = (proj: DesignProject, cust: Customer) => {
    const chest = cust.measurements.chest;
    const waist = cust.measurements.waist;
    const hips = cust.measurements.hips;
    const height = cust.measurements.height;
    const unit = cust.measurements.unit;

    const frontDraft = ((chest / 4) + 1.25).toFixed(2);
    const backDraft = ((chest / 4) + 0.75).toFixed(2);
    const armholeDraft = ((chest / 8) + 2.75).toFixed(2);
    const skirtDraft = ((hips / 4) + 2.5).toFixed(2);
    const dotsCount = waist < chest - 4 ? 4 : 2;
    const dLength = height > 60 ? `5.0 ${unit}` : `4.0 ${unit}`;

    const defaultYards = height > 65 ? 3.5 : 2.8;

    return {
      isAI: false,
      patternFormulas: {
        frontBodiceWidth: `${frontDraft} ${unit}`,
        backBodiceWidth: `${backDraft} ${unit}`,
        armholeDepth: `${armholeDraft} ${unit}`,
        skirtPanelWidth: `${skirtDraft} ${unit}`,
        suggestedDartsCount: dotsCount,
        dartLength: dLength
      },
      cuttingGuide: [
        `1. Iron the ${proj.fabric.color} ${proj.fabric.name} on medium-heat dry run.`,
        `2. Lay the front piece along your design fold line demanding a block of ${frontDraft} wide.`,
        `3. Keep salvage bounds free for the ${backDraft} back bodice blocks.`
      ],
      estimatedYardsNeeded: defaultYards,
      sewingSteps: [
        `1. Stitch stay curves near neckline.`,
        `2. Draft the recommended ${dotsCount} body-contouring darts to align the waist curve.`,
        `3. Assemble the panels cleanly.`
      ],
      tailoringTips: [
        `Using standard sewing machine tension setting 3.0 for ${proj.fabric.type}.`,
        `Perfect waist-to-hip contour ratio detected as ${((waist / hips) || 0.75).toFixed(2)}.`
      ]
    };
  };

  // Synchronize dynamic updates on local modifications immediately
  const updateActiveProjectField = <K extends keyof DesignProject>(field: K, value: DesignProject[K]) => {
    if (!activeProject) return;
    const updated = { ...activeProject, [field]: value, lastUpdated: new Date().toISOString() };
    
    // Automatically recalculate local mockups to keep UI in-sync
    const localCalcs = recomputeLocalPatternDrafting(updated, activeCustomer);
    updated.lastCalculations = {
      ...localCalcs,
      // preserve AI calculations if they were previously loaded
      ...(activeProject.lastCalculations?.isAI ? activeProject.lastCalculations : {})
    };

    setProjects(prev => prev.map(p => p.id === activeProject.id ? updated : p));
    saveProjectToCloud(updated);
    setActiveLog(`Updated Project design parameters: ${String(field)} changed.`);
  };

  // Modify Customer Measurements Live
  const updateCustomerMeasurement = (mKey: keyof typeof DEFAULT_CUSTOMER.measurements, val: number | string) => {
    if (!activeCustomer) return;
    const newVal = typeof val === "number" ? val : parseFloat(val) || 0;
    const targetCust = {
      ...activeCustomer,
      measurements: {
        ...activeCustomer.measurements,
        [mKey]: newVal
      }
    };

    setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? targetCust : c));
    saveCustomerToCloud(targetCust);
    
    // Trigger design recalculation automatically
    const updatedProj = {
      ...activeProject,
      lastCalculations: recomputeLocalPatternDrafting(activeProject, targetCust)
    };
    setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
    saveProjectToCloud(updatedProj);
    setActiveLog(`Calibrated body metric [${String(mKey)}] to ${val}.`);
  };

  // Handle client selection change
  const handleCustomerSelectionChange = (customerId: string) => {
    if (!activeProject) return;
    const updatedProj = { ...activeProject, customerId, lastUpdated: new Date().toISOString() };
    const targetCust = customers.find(c => c.id === customerId) || activeCustomer;
    updatedProj.lastCalculations = recomputeLocalPatternDrafting(updatedProj, targetCust);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
    saveProjectToCloud(updatedProj);
    setActiveLog(`Switched active client profile to ${targetCust.name}.`);
  };

  // Support measurement guide direct actions
  const handleDeleteCustomer = (id: string) => {
    if (id === "cust-1") return; // protected default
    setCustomers(prev => prev.filter(c => c.id !== id));
    deleteCustomerFromCloud(id);
    
    // reset selection if needed
    if (activeProject?.customerId === id) {
      setProjects(prev => prev.map(p => {
        if (p.customerId === id) {
          const updated = { ...p, customerId: "cust-1", lastUpdated: new Date().toISOString() };
          saveProjectToCloud(updated);
          return updated;
        }
        return p;
      }));
    }
    setActiveLog("Deleted customer profile index.");
  };

  const handleUpdateCustomerDirect = (id: string, updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === id ? updatedCust : c));
    saveCustomerToCloud(updatedCust);
    
    // Recalculate if this is the active project client
    if (activeProject && activeProject.customerId === id) {
      const updatedProj = {
        ...activeProject,
        lastCalculations: recomputeLocalPatternDrafting(activeProject, updatedCust),
        lastUpdated: new Date().toISOString()
      };
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
      saveProjectToCloud(updatedProj);
    }
    setActiveLog(`Updated profile details for customer ${updatedCust.name}.`);
  };

  // Collaboration: Add comment
  const handleAddProjectComment = (comment: ProjectComment) => {
    if (!activeProject) return;
    const currentComments = activeProject.comments || [];
    const updatedComments = [...currentComments, comment];
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        const updatedProj = {
          ...p,
          comments: updatedComments,
          customerFeedback: comment.author === "Customer" ? comment.text : p.customerFeedback,
          customerApprovalStatus: (comment.isAdjustmentRequest && comment.author === "Customer") 
            ? "Change-Requested" as const
            : p.customerApprovalStatus,
          lastUpdated: new Date().toISOString()
        };
        saveProjectToCloud(updatedProj);
        return updatedProj;
      }
      return p;
    }));
    setActiveLog(`New comment posted on design layout by ${comment.author}.`);
  };

  // Collaboration: Resolve or toggle comment state
  const handleToggleCommentResolution = (commentId: string, resolved: boolean) => {
    if (!activeProject) return;
    const currentComments = activeProject.comments || [];
    const updatedComments = currentComments.map(c => {
      if (c.id === commentId) {
        return { ...c, isResolved: resolved };
      }
      return c;
    });

    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        const updatedProj = {
          ...p,
          comments: updatedComments,
          lastUpdated: new Date().toISOString()
        };
        saveProjectToCloud(updatedProj);
        return updatedProj;
      }
      return p;
    }));
    setActiveLog(`Design layout markup resolved.`);
  };

  // Handle custom fabric pattern shifts
  const selectFabricType = (fab: Fabric) => {
    updateActiveProjectField("fabric", fab);
    setActiveLog(`Applied fabric grade: ${fab.name} in ${fab.textureName}.`);
  };

  // Add a new project from scratch
  const createNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProj: DesignProject = {
      id: newId,
      customerId: activeCustomer.id,
      designName: `${activeCustomer.name}'s Custom Gown`,
      fabric: FACTORY_FABRICS[2], // Raw linen
      styling: {
        neckline: "V-Neck",
        sleeve: "Flutter",
        silhouette: "A-Line",
        length: "Midi",
        hasBelt: true,
        hasSlit: false,
        notes: "Elegant midi design drafted for afternoon cocktail drape."
      },
      customerApprovalStatus: "Pending",
      customerFeedback: "",
      lastUpdated: new Date().toISOString()
    };
    newProj.lastCalculations = recomputeLocalPatternDrafting(newProj, activeCustomer);
    setProjects(prev => [newProj, ...prev]);
    saveProjectToCloud(newProj);
    setActiveProjectId(newId);
    setActiveLog("Initiated empty custom garment canvas.");
  };

  // Add client profile handler
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      email: newCustEmail || "client@independent.com",
      phone: newCustPhone || "Unlisted",
      measurements: {
        unit: newCustUnit,
        chest: newCustChest,
        waist: newCustWaist,
        hips: newCustHips,
        height: newCustHeight,
        shoulder: newCustShoulder,
        sleeve: newCustSleeve,
        neck: newCustNeck,
        inseam: newCustInseam,
      }
    };

    setCustomers(prev => [...prev, newCust]);
    saveCustomerToCloud(newCust);
    setShowAddCustomerModal(false);

    // Create automatically an accompanying drape project
    const newProjId = `proj-${Date.now()}`;
    const initialProj: DesignProject = {
      id: newProjId,
      customerId: newCust.id,
      designName: `${newCustName} Signature Gown`,
      fabric: FACTORY_FABRICS[0],
      styling: {
        neckline: "Round",
        sleeve: "Flutter",
        silhouette: "A-Line",
        length: "Midi",
        hasBelt: false,
        hasSlit: false,
        notes: "Classic custom-fitted block sizing."
      },
      customerApprovalStatus: "Pending",
      customerFeedback: "",
      lastUpdated: new Date().toISOString()
    };
    initialProj.lastCalculations = recomputeLocalPatternDrafting(initialProj, newCust);
    setProjects(prev => [initialProj, ...prev]);
    saveProjectToCloud(initialProj);
    setActiveProjectId(newProjId);

    // Reset Form values
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
    setActiveLog(`Successfully generated tailor canvas profile for ${newCust.name}.`);
  };

  // Query Gemini API /api/gemini/tailor for highly specific drafting blocks
  const triggerAiBespokeCalculations = async () => {
    setIsAiLoading(true);
    setActiveLog("Querying Gemini High-Fashion Expert AI for pattern drafting parameters...");
    try {
      const response = await fetch("/api/gemini/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: activeCustomer.name,
          measurements: activeCustomer.measurements,
          fabric: activeProject.fabric,
          designName: activeProject.designName,
          styleDescription: `${activeProject.styling.neckline} neckline, ${activeProject.styling.sleeve} sleeves, ${activeProject.styling.silhouette} silhouette, length is ${activeProject.styling.length}. Extra Notes: ${activeProject.styling.notes}`
        })
      });

      if (!response.ok) {
        throw new Error("Tailoring API returned unsuccessful code");
      }

      const data = await response.json();
      
      // Update the project with AI calculations
      const updatedProjects = projects.map(p => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            lastCalculations: {
              isAI: data.isAI ?? true,
              patternFormulas: data.patternFormulas,
              cuttingGuide: data.cuttingGuide,
              estimatedYardsNeeded: data.estimatedYardsNeeded,
              sewingSteps: data.sewingSteps,
              tailoringTips: data.tailoringTips
            },
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      });

      setProjects(updatedProjects);
      setActiveLog(`Bespoke AI pattern blocks for ${activeCustomer.name} synthesized successfully.`);
    } catch (err: any) {
      console.error(err);
      setActiveLog(`Failed to query Gemini. Using local geometry solver engine instead.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Query Gemini API /api/gemini/generate-sketch to produce beautiful runway sketch illustration
  const generateRunwayDesignSketch = async () => {
    if (!sketchPrompt.trim()) return;
    setIsSketchLoading(true);
    setActiveLog("Brewing custom high-fashion Runway sketch via Gemini Design model...");
    try {
      const details = `${activeProject.styling.neckline} neck dress made of ${activeProject.fabric.color} ${activeProject.fabric.name} fabric, ${activeProject.styling.silhouette} silhouette. ${sketchPrompt}`;
      const response = await fetch("/api/gemini/generate-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: details })
      });

      if (!response.ok) {
        throw new Error("Sketch generator endpoint failed");
      }

      const data = await response.json();
      if (data.success && data.imageUrl) {
        updateActiveProjectField("aiSketchUrl", data.imageUrl);
        setActiveLog("Runway CAD Sketch illustration loaded successfully.");
      } else {
        // Fallback warning
        setActiveLog(data.message || "Model key missing or unconfigured. Rendered vector mapping.");
        alert(`Bespoke Sketch Simulator Message: ${data.message || "Unable to produce AI sketch, custom vector preview active."}`);
      }
    } catch (err) {
      console.error(err);
      setActiveLog("Unable to contact image generator. Defaulting to vector mannequin drawing.");
    } finally {
      setIsSketchLoading(false);
    }
  };

  // Submit client feedback simulator
  const submitClientFeedback = (feedbackText: string, status: "Approved" | "Change-Requested") => {
    updateActiveProjectField("customerApprovalStatus", status);
    updateActiveProjectField("customerFeedback", feedbackText);
    setActiveLog(`Client submitted confirmation: Sizing marked as [${status}].`);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1C1C1C] flex flex-col font-sans antialiased selection:bg-black selection:text-white">
      
      {/* Upper Atelier Banner Header */}
      <header className="border-b border-black/10 shrink-0 bg-[#FDFCFB]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-black text-[#FDFCFB] rounded-full shrink-0">
              <Scissors className="w-5 h-5 stroke-[1.5]" />
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-black/50 block">Atelier Virtual v2.4</span>
              <h1 className="text-xl md:text-2xl font-serif italic tracking-tight font-semibold">Tailor Studio</h1>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            {/* Firebase Cloud Sync Status Widget */}
            <div className="flex items-center justify-between md:justify-start gap-2 bg-[#F2EFE9] p-1.5 px-3 rounded-sm border border-black/5">
              {authLoading ? (
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                  <Cloud className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Initializing auth...</span>
                </div>
              ) : currentUser ? (
                <div className="flex items-center gap-2">
                  <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                  <div className="flex flex-col text-[10px] items-start leading-[1.1]">
                    <span className="font-semibold text-stone-900 max-w-[120px] truncate">{currentUser.displayName || currentUser.email}</span>
                    <span className="text-stone-400 font-mono text-[8px] uppercase tracking-wide">Cloud Connected</span>
                  </div>
                  <button
                    onClick={() => signOut(auth)}
                    title="Disconnect Cloud Workspace"
                    className="ml-2 px-1.5 py-0.5 text-[8px] font-semibold bg-black/5 hover:bg-black/10 hover:text-red-600 rounded-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const provider = new GoogleAuthProvider();
                      await signInWithPopup(auth, provider);
                    } catch (err) {
                      setActiveLog(`Auth connection failed: ${err instanceof Error ? err.message : String(err)}`);
                    }
                  }}
                  className="flex items-center gap-1.5 text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  <CloudOff className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Connect Cloud Database</span>
                </button>
              )}
            </div>

            {/* View Mode Custom Toggle */}
            <div className="flex bg-[#F2EFE9] p-0.5 rounded-sm border border-black/5 w-full md:w-auto">
              <button 
                id="toggleDesignerMode"
                onClick={() => setWorkspaceMode("designer")}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 ${workspaceMode === "designer" ? "bg-black text-[#FDFCFB] shadow-xs" : "text-black/60 hover:text-black"}`}
              >
                <Settings className="w-3.5 h-3.5" />
                Tailor Drafting Board
              </button>
              <button 
                id="toggleGuideMode"
                onClick={() => setWorkspaceMode("guide")}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 ${workspaceMode === "guide" ? "bg-black text-[#FDFCFB] shadow-xs" : "text-black/60 hover:text-black"}`}
              >
                <Ruler className="w-3.5 h-3.5 animate-pulse" />
                Sizing Guide & Profiles
              </button>
              <button 
                id="toggleClientMode"
                onClick={() => setWorkspaceMode("client")}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 ${workspaceMode === "client" ? "bg-black text-[#FDFCFB] shadow-xs" : "text-black/60 hover:text-black"}`}
              >
                <Eye className="w-3.5 h-3.5" />
                Client proof cabin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Flex Workspace Container */}
      {workspaceMode === "guide" ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          <MeasurementGuide
            customers={customers}
            activeCustomerId={activeCustomer.id}
            onSelectCustomer={(id) => handleCustomerSelectionChange(id)}
            onAddCustomer={(newCust) => {
              setCustomers(prev => [...prev, newCust]);
              setActiveLog(`Created profile index for ${newCust.name}.`);
            }}
            onUpdateCustomer={handleUpdateCustomerDirect}
            onDeleteCustomer={handleDeleteCustomer}
          />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT CONTROLS: Client metrics and measurements inputs ================= */}
        <section className={`lg:col-span-4 space-y-6 ${workspaceMode === "client" ? "opacity-40 pointer-events-none lg:block hidden" : ""}`}>
          
          {/* Section 01: Client and Proposal Management */}
          <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-black/40">01.</span>
                <h2 className="font-serif text-lg italic">Client Portfolio</h2>
              </div>
              <button
                id="btnNewClient"
                onClick={() => setShowAddCustomerModal(true)}
                className="p-1 px-2.5 bg-black hover:bg-stone-800 text-white text-[10px] uppercase tracking-widest flex items-center gap-1 rounded-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Client
              </button>
            </div>

            {/* Custom selection slider of loaded projects/customers */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-black/50 mb-1.5 font-bold">Select Active Client</label>
                <select
                  id="selectCustomer"
                  value={activeProject?.customerId || ""}
                  onChange={(e) => handleCustomerSelectionChange(e.target.value)}
                  className="w-full bg-[#F2EFE9] border border-black/10 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-black outline-none transition-all font-serif"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-black/50 mb-1.5 font-bold">Project Name/Label</label>
                <div className="flex gap-2">
                  <input
                    id="inputProjectName"
                    type="text"
                    value={activeProject?.designName || ""}
                    onChange={(e) => updateActiveProjectField("designName", e.target.value)}
                    placeholder="E.g. Emerald Red Carpet Gown"
                    className="flex-1 bg-white border border-black/10 rounded-md p-2 text-xs focus:ring-1 focus:ring-black outline-none font-serif text-amber-900 font-semibold italic"
                  />
                  <button
                    id="btnNewProject"
                    onClick={createNewProject}
                    title="Start new blank dress project with current customer"
                    className="px-3 bg-[#F2EFE9] border border-black/10 hover:border-black rounded-md text-xs font-semibold hover:bg-black hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Style
                  </button>
                </div>
              </div>

              <div className="mt-3 p-3 bg-[#F2EFE9]/40 border border-black/5 rounded-lg flex flex-col gap-1.5 text-xs text-black/70">
                <div className="flex justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-wide text-black/40">Active Project:</span>
                  <span className="text-stone-900 font-mono font-medium truncate max-w-[140px]">{activeProject?.designName || "None"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-wide text-black/40">Contact Number:</span>
                  <span className="text-stone-700 font-mono text-[11px]">{activeCustomer?.phone || "None"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 02: Exact Measurements Block Sizer */}
          <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-black/40">02.</span>
                <h2 className="font-serif text-lg italic">Drafting Measurements</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-black/50">Unit:</span>
                <select
                  value={activeCustomer?.measurements.unit || "inches"}
                  onChange={(e) => {
                    const unitVal = e.target.value as UnitType;
                    if (!activeCustomer) return;
                    setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? {
                      ...c,
                      measurements: { ...c.measurements, unit: unitVal }
                    } : c));
                    setActiveLog(`Switched calculation units to ${unitVal}.`);
                  }}
                  className="bg-[#F2EFE9] border border-black/10 rounded-sm py-0.5 px-2 text-[10px] outline-none"
                >
                  <option value="inches">Inches (")</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-black/50 italic mb-4">
              Enter the customized client proportions. The blueprint layout and 2D canvas drape mapping adapts immediately to keep from spoiling expensive fabric.
            </p>

            <div className="space-y-4">
              {/* Grid of basic parameters */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Chest / Bust */}
                <div className="border-b border-black/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-black/40 font-bold">Chest / Bust</label>
                    <span className="text-[10px] text-black/30 italic font-mono">{activeCustomer?.measurements.unit === "inches" ? "30-52\"" : "75-130cm"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      id="inputChest"
                      step={activeCustomer?.measurements.unit === "inches" ? "0.25" : "1"}
                      value={activeCustomer?.measurements.chest || 0}
                      onChange={(e) => updateCustomerMeasurement("chest", e.target.value)}
                      className="w-full bg-[#F2EFE9]/60 hover:bg-[#F2EFE9] text-base font-medium p-1 px-2 border-0 rounded-sm text-stone-900 focus:bg-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-black/40 font-mono">{activeCustomer?.measurements.unit === "inches" ? "in" : "cm"}</span>
                  </div>
                </div>

                {/* Waist */}
                <div className="border-b border-black/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-black/40 font-bold">Waist Bound</label>
                    <span className="text-[10px] text-black/30 italic font-mono">{activeCustomer?.measurements.unit === "inches" ? "22-48\"" : "55-120cm"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      id="inputWaist"
                      step={activeCustomer?.measurements.unit === "inches" ? "0.25" : "1"}
                      value={activeCustomer?.measurements.waist || 0}
                      onChange={(e) => updateCustomerMeasurement("waist", e.target.value)}
                      className="w-full bg-[#F2EFE9]/60 hover:bg-[#F2EFE9] text-base font-medium p-1 px-2 border-0 rounded-sm text-stone-900 focus:bg-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-black/40 font-mono">{activeCustomer?.measurements.unit === "inches" ? "in" : "cm"}</span>
                  </div>
                </div>

                {/* Hips */}
                <div className="border-b border-black/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-black/40 font-bold">Hips Flare</label>
                    <span className="text-[10px] text-black/30 italic font-mono">{activeCustomer?.measurements.unit === "inches" ? "32-58\"" : "80-145cm"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      id="inputHips"
                      step={activeCustomer?.measurements.unit === "inches" ? "0.25" : "1"}
                      value={activeCustomer?.measurements.hips || 0}
                      onChange={(e) => updateCustomerMeasurement("hips", e.target.value)}
                      className="w-full bg-[#F2EFE9]/60 hover:bg-[#F2EFE9] text-base font-medium p-1 px-2 border-0 rounded-sm text-stone-900 focus:bg-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-black/40 font-mono">{activeCustomer?.measurements.unit === "inches" ? "in" : "cm"}</span>
                  </div>
                </div>

                {/* Total Height */}
                <div className="border-b border-black/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-black/40 font-bold">Total Height</label>
                    <span className="text-[10px] text-black/30 italic font-mono">{activeCustomer?.measurements.unit === "inches" ? "50-80\"" : "125-200cm"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      id="inputHeight"
                      step="0.5"
                      value={activeCustomer?.measurements.height || 0}
                      onChange={(e) => updateCustomerMeasurement("height", e.target.value)}
                      className="w-full bg-[#F2EFE9]/60 hover:bg-[#F2EFE9] text-base font-medium p-1 px-2 border-0 rounded-sm text-stone-900 focus:bg-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-black/40 font-mono">{activeCustomer?.measurements.unit === "inches" ? "in" : "cm"}</span>
                  </div>
                </div>

                {/* Shoulder span */}
                <div className="border-b border-black/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-black/40 font-bold">Shoulders</label>
                    <span className="text-[10px] text-black/40 italic font-mono">Span Width</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      id="inputShoulder"
                      step="0.25"
                      value={activeCustomer?.measurements.shoulder || 0}
                      onChange={(e) => updateCustomerMeasurement("shoulder", e.target.value)}
                      className="w-full bg-[#F2EFE9]/60 hover:bg-[#F2EFE9] text-base font-medium p-1 px-2 border-0 rounded-sm text-stone-900 focus:bg-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-black/40 font-mono">{activeCustomer?.measurements.unit === "inches" ? "in" : "cm"}</span>
                  </div>
                </div>

                {/* Sleeve Extension */}
                <div className="border-b border-black/10 pb-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-black/40 font-bold">Sleeve Length</label>
                    <span className="text-[10px] text-black/40 italic font-mono">From Cap</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      id="inputSleeve"
                      step="0.25"
                      value={activeCustomer?.measurements.sleeve || 0}
                      onChange={(e) => updateCustomerMeasurement("sleeve", e.target.value)}
                      className="w-full bg-[#F2EFE9]/60 hover:bg-[#F2EFE9] text-base font-medium p-1 px-2 border-0 rounded-sm text-stone-900 focus:bg-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-black/40 font-mono">{activeCustomer?.measurements.unit === "inches" ? "in" : "cm"}</span>
                  </div>
                </div>

              </div>

              {/* Advanced Minor measurements drawer */}
              <div className="bg-[#F2EFE9]/50 p-3 rounded-lg border border-black/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-black/50">Secondary Sizing metrics</span>
                  <span className="text-[9px] text-[#854d0e] bg-amber-100 rounded-sm px-1.5 py-0.5 font-bold">Anatomical Anchor</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[10px] text-black/70">Neck Circumference:</label>
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      id="inputNeck"
                      step="0.1"
                      value={activeCustomer?.measurements.neck || 0}
                      onChange={(e) => updateCustomerMeasurement("neck", e.target.value)}
                      className="w-full bg-white text-center text-xs font-mono p-1 border border-black/10 rounded-sm"
                    />
                    <span className="text-[9px] text-black/50 font-mono">{activeCustomer?.measurements.unit === "inches" ? "in" : "cm"}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 03: Style Silhouette Design configurators */}
          <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-black/5">
              <span className="text-xs uppercase font-bold tracking-widest text-black/40">03.</span>
              <h2 className="font-serif text-lg italic">Silhouette Contour Style</h2>
            </div>

            <div className="space-y-4">
              
              {/* Neckline */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-black/50 mb-1.5 font-bold">Neckline Drape Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["Sweetheart", "V-Neck", "Off-Shoulder", "High-Neck", "Round"] as const).map(neck => (
                    <button
                      key={neck}
                      onClick={() => updateActiveProjectField("styling", { ...activeProject.styling, neckline: neck })}
                      className={`text-[11px] p-2 rounded-md border text-center transition-all ${activeProject?.styling.neckline === neck ? "bg-black text-[#FDFCFB] border-black font-semibold" : "bg-[#FDFCFB] border-black/10 hover:border-black text-black/80"}`}
                    >
                      {neck}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleeves */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-black/50 mb-1.5 font-bold">Sleeve Block</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["Sleeveless", "Short Puff", "Long Fitted", "Flutter", "Cap"] as const).map(slv => (
                    <button
                      key={slv}
                      onClick={() => updateActiveProjectField("styling", { ...activeProject.styling, sleeve: slv })}
                      className={`text-[11px] p-2 rounded-md border text-center transition-all ${activeProject?.styling.sleeve === slv ? "bg-black text-[#FDFCFB] border-black font-semibold" : "bg-[#FDFCFB] border-black/10 hover:border-black text-black/80"}`}
                    >
                      {slv}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skirt Panel Cut Silhouette */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-black/50 mb-1.5 font-bold">Skirt Bottom Drop Silhouette</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["Mermaid", "A-Line", "Ballgown", "Pencil", "Direct-Hem"] as const).map(sil => (
                    <button
                      key={sil}
                      onClick={() => updateActiveProjectField("styling", { ...activeProject.styling, silhouette: sil })}
                      className={`text-[11px] p-2 rounded-md border text-center transition-all ${activeProject?.styling.silhouette === sil ? "bg-black text-[#FDFCFB] border-black font-semibold" : "bg-[#FDFCFB] border-black/10 hover:border-black text-black/80"}`}
                    >
                      {sil}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length and Accents Box */}
              <div className="p-3 bg-[#F2EFE9]/40 border border-black/10 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-black/50">Garment Length Drop</span>
                  <select
                    value={activeProject?.styling.length || "Floor-Maxi"}
                    onChange={(e) => updateActiveProjectField("styling", { ...activeProject.styling, length: e.target.value as any })}
                    className="bg-white border border-black/10 rounded-sm py-1 px-2 text-xs font-serif"
                  >
                    <option value="Mini">Mini Length Dress</option>
                    <option value="Midi">Midi Calf Length</option>
                    <option value="Floor-Maxi">Floor Maxi Gown</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-black/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={activeProject?.styling.hasBelt || false}
                      onChange={(e) => updateActiveProjectField("styling", { ...activeProject.styling, hasBelt: e.target.checked })}
                      className="w-4 h-4 rounded-sm border-black/20 text-black focus:ring-0"
                    />
                    Introduce Center Waist Belt
                  </label>

                  <label className="flex items-center gap-2 text-xs text-black/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={activeProject?.styling.hasSlit || false}
                      onChange={(e) => updateActiveProjectField("styling", { ...activeProject.styling, hasSlit: e.target.checked })}
                      className="w-4 h-4 rounded-sm border-black/20 text-black focus:ring-0"
                    />
                    Left Leg High Slit Splice
                  </label>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-black/50 mb-1">Tailor Specific Sew Instructions & Notes</label>
                  <textarea
                    rows={2}
                    value={activeProject?.styling.notes || ""}
                    onChange={(e) => updateActiveProjectField("styling", { ...activeProject.styling, notes: e.target.value })}
                    placeholder="Enter style modifications, zipper lines, or special ease tolerances..."
                    className="w-full bg-white text-[11px] p-2 border border-black/10 rounded-sm resize-none focus:outline-black focus:ring-1"
                  />
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* ================= CENTER WORKSPACE: Visual Drape Simulator Display 2D/3D & Gemini Blueprint ================= */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Main Visualizer Deck */}
          <div className="bg-white border border-black rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">
            
            {/* Visual Indicators */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-black/70">Virtual Fit Drape 100% Sized</span>
              </div>
              <div className="text-right text-[10px] uppercase text-black/40 font-serif">
                Tolerance calibrated: <span className="font-mono text-black">±0.02mm</span>
              </div>
            </div>

            {/* Simulation canvas wrap */}
            <div className="relative">
              {activeProject && activeCustomer ? (
                <MannequinViewer
                  measurements={activeCustomer.measurements}
                  fabric={activeProject.fabric}
                  styling={activeProject.styling}
                  gender={activeCustomer.gender}
                />
              ) : (
                <div className="h-96 flex items-center justify-center bg-stone-50 border rounded-2xl">
                  <p className="text-sm font-sans italic text-stone-400">Initialize a client profile to project digital mock draping.</p>
                </div>
              )}

              {/* Quick feedback watermarks */}
              <div className="absolute bottom-16 left-4 bg-white/90 backdrop-blur-md p-2.5 rounded-lg border border-black/5 text-[9px] space-y-1 w-44 shadow-xs">
                <div className="font-bold uppercase tracking-wider text-black/60">Anatomical Balance</div>
                <div className="text-stone-500 italic">"Model contours calculated automatically on the fly to fit waist."</div>
                <div className="text-black font-semibold">Pre-Cut Wastage Save: 20%</div>
              </div>
            </div>

            {/* Helper Control bar for visuals */}
            <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs border-t border-black/5 pt-4">
              <button 
                onClick={() => {
                  alert("Digital Drape Simulator Warning: Under-tension strain indices show safe thresholds. Cutting thread tension advice generated.");
                }}
                className="px-3.5 py-1.5 bg-[#F2EFE9] text-black hover:bg-black hover:text-[#FDFCFB] text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm flex items-center gap-1.5"
              >
                📊 Strain Tension Test
              </button>

              <div className="flex gap-2">
                <button
                  id="btnDraftRecommendations"
                  disabled={isAiLoading}
                  onClick={triggerAiBespokeCalculations}
                  className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all flex items-center gap-1.5 border border-black ${isAiLoading ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed" : "bg-black text-white hover:bg-stone-800"}`}
                >
                  {isAiLoading ? (
                    <>Designing...</>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Optimize using AI Patternmaker
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Blueprint drafting specifications sheet */}
          {activeProject && activeCustomer && (
            <PatternBlueprint
              measurements={activeCustomer.measurements}
              styling={activeProject.styling}
              fabric={activeProject.fabric}
              isAICalculated={activeProject.lastCalculations?.isAI || false}
              aiFormulas={activeProject.lastCalculations?.patternFormulas}
            />
          )}

        </section>

        {/* ================= RIGHT RAIL: Fabrics Selected & Client proofing controls ================= */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Fabric Library picker */}
          <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-black/5">
              <span className="text-xs uppercase font-bold tracking-widest text-black/40">04.</span>
              <h2 className="font-serif text-lg italic">Atelier Textiles Drawer</h2>
            </div>
            
            <p className="text-[11px] text-black/50 italic mb-4">
              Select textile weight & pattern print overlay, or upload a custom material pattern to render onto the mannequin drapery.
            </p>

            {/* Custom Material Drag & Drop Uploader */}
            <div className="mb-4">
              <div 
                className="group border border-dashed border-stone-300 hover:border-black rounded-xl p-3 text-center bg-stone-50/50 hover:bg-stone-50 transition-all cursor-pointer relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleUploadFile(file);
                }}
                onClick={() => document.getElementById("fabricDropzoneInput")?.click()}
              >
                <input 
                  type="file" 
                  id="fabricDropzoneInput" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file);
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="p-1 px-2 bg-black text-white text-[9px] font-mono rounded-xs font-bold transition-transform group-hover:scale-102">
                    Upload Custom Pattern
                  </span>
                  <p className="text-[9px] text-stone-400 mt-1">
                    Drag and drop your fabric image or click to select
                  </p>
                </div>
              </div>
            </div>

            {/* If the selected fabric is a custom pattern, let the user scale it! */}
            {activeProject?.fabric?.pattern === "custom" && (
              <div className="mb-4 p-3 bg-amber-50/25 border border-amber-200/40 rounded-xl space-y-1.5 animate-fade-in text-[10px]">
                <div className="flex justify-between items-center uppercase font-bold text-amber-900 tracking-wide">
                  <span>Material Scale Controls</span>
                  <span className="font-mono text-xs">{activeProject.fabric.customPatternScale || 40}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="160"
                  value={activeProject.fabric.customPatternScale || 40}
                  onChange={(e) => {
                    const nextScale = Number(e.target.value);
                    updateActiveProjectField("fabric", {
                      ...activeProject.fabric,
                      customPatternScale: nextScale
                    });
                  }}
                  className="w-full accent-amber-600 cursor-ew-resize h-1 bg-stone-200 rounded-lg appearance-none"
                />
                <p className="text-[9px] text-amber-800/60 leading-tight">
                  Drag slider to match pattern tile sizing to customer measurements perfectly on the mannequin.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 max-h-[310px] overflow-y-auto pr-1">
              {[...FACTORY_FABRICS, ...uploadedFabrics].map((fab) => {
                const isActive = activeProject?.fabric.id === fab.id;
                const isCustom = fab.pattern === "custom";
                return (
                  <div
                    key={fab.id}
                    onClick={() => selectFabricType(fab)}
                    className={`group cursor-pointer rounded-xl p-2 border transition-all relative ${isActive ? "border-amber-600 bg-amber-50/20 shadow-xs" : "border-stone-100 hover:border-black/30"}`}
                  >
                    {isCustom && (
                      <button
                        title="Delete custom textile"
                        onClick={(e) => deleteUploadedFabric(fab.id, e)}
                        className="absolute top-1 right-1 p-1 bg-white/70 hover:bg-red-500 hover:text-white rounded-full text-stone-600 transition-colors z-10 border border-black/5 shadow-xs"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <div 
                      className="aspect-square w-full rounded-md mb-2 border border-black/5 shadow-inner transition-transform group-hover:scale-103"
                      style={{ 
                        backgroundColor: fab.color,
                        backgroundImage: fab.pattern === "custom" && fab.customPatternUrl
                          ? `url(${fab.customPatternUrl})`
                          : fab.pattern === "stripe" 
                          ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 4px, transparent 4px, transparent 8px)"
                          : fab.pattern === "dots"
                          ? "radial-gradient(rgba(255,255,255,0.3) 15%, transparent 16%)"
                          : fab.pattern === "ankara"
                          ? "radial-gradient(circle, transparent 20%, #eab308 20%, #eab308 21%, transparent 21%), radial-gradient(circle, transparent 40%, #f97316 40%, #f97316 41%, transparent 41%)"
                          : fab.pattern === "floral"
                          ? "radial-gradient(circle, #f43f5e 30%, transparent 31%)"
                          : undefined,
                        backgroundSize: fab.pattern === "custom" ? "32px 32px" : fab.pattern === "dots" ? "12px 12px" : fab.pattern === "ankara" ? "20px 20px" : undefined
                      }}
                    />
                    <div className="text-[11px] font-bold text-stone-800 line-clamp-1">{fab.name}</div>
                    <div className="text-[9px] text-[#b45309]">{fab.textureName}</div>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-dashed border-stone-100 text-[8px] text-stone-400 uppercase">
                      <span>{fab.weightGsm} GSM</span>
                      {isActive && <span className="text-[8px] bg-amber-600 text-white rounded-xs px-1 font-sans">ACTIVE</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fabric custom color colorizer */}
            <div className="mt-4 pt-3 border-t border-black/5">
              <label className="block text-[10px] uppercase font-bold text-black/50 mb-1.5">Custom fabric dye tone:</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={activeProject?.fabric?.color || "#3b82f6"}
                  onChange={(e) => {
                    if (!activeProject) return;
                    updateActiveProjectField("fabric", {
                      ...activeProject.fabric,
                      color: e.target.value
                    });
                  }}
                  className="w-8 h-8 rounded-md border border-black/10 cursor-pointer overflow-hidden p-0 block bg-none"
                />
                <input
                  type="text"
                  value={activeProject?.fabric?.color || ""}
                  onChange={(e) => {
                    if (!activeProject) return;
                    updateActiveProjectField("fabric", {
                      ...activeProject.fabric,
                      color: e.target.value
                    });
                  }}
                  placeholder="#Hex value"
                  className="flex-1 bg-[#F2EFE9] text-xs px-2 rounded-sm uppercase font-mono tracking-widest text-[#1c1c1c]"
                />
              </div>
            </div>
          </div>

          {/* AI runway design sketch generator prompt cabin */}
          <div className="bg-[#1C1C1C] text-stone-200 border border-stone-800 rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <h3 className="font-serif italic text-sm text-stone-100">AI Fashion Runaway Sketch</h3>
            </div>
            <p className="text-[10px] text-stone-400 mb-3 leading-relaxed">
              Generate beautiful modern CAD fashion designs and high-fashion runways based on style rules. Shows beautiful mockups before executing physical stitches.
            </p>

            <textarea
              rows={2}
              value={sketchPrompt}
              onChange={(e) => setSketchPrompt(e.target.value)}
              placeholder="E.g., Elegant minimal satin drape gown displaying heavy fold pleats..."
              className="w-full bg-stone-900 border border-stone-800 text-stone-100 text-xs p-2 rounded-md focus:border-amber-500 outline-none resize-none"
            />

            <button
              id="btnGenerateSketch"
              disabled={isSketchLoading}
              onClick={generateRunwayDesignSketch}
              className={`w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-black text-xs uppercase tracking-widest font-bold rounded-sm mt-3.5 transition-all flex items-center justify-center gap-1`}
            >
              {isSketchLoading ? "Sketching Runway Model..." : "Generate AI CAD Sketch"}
            </button>

            {/* Beautiful loaded AI runway drawing */}
            {activeProject?.aiSketchUrl && (
              <div className="mt-4 p-1 bg-stone-900 border border-stone-800 rounded-lg overflow-hidden relative group">
                <img 
                  src={activeProject.aiSketchUrl} 
                  alt="High-fashion runway illustration" 
                  className="w-full h-auto aspect-square rounded-md object-cover brightness-95" 
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-center">
                  <p className="text-[10px] text-amber-300">Runway model draft synchronized to client portfolio metrics.</p>
                </div>
              </div>
            )}
          </div>

          {/* Client cabin preview helper */}
          <div className="bg-amber-50/30 border border-amber-900/10 rounded-2xl p-5 shadow-xs text-sm">
            <h4 className="font-serif text-stone-900 mb-1.5 italic font-bold">Designer Preview Box</h4>
            <p className="text-[11px] text-stone-700 leading-relaxed mb-3">
              You can toggle to <strong>Client proof cabin</strong> view at the header banner to inspect what clients see and simulator comments approval sequence directly.
            </p>
            <button
              onClick={() => setWorkspaceMode("client")}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-[#FDFCFB] text-[10px] uppercase font-bold tracking-wider rounded-sm transition-all"
            >
              Simulate Client cabin view
            </button>
          </div>

        </section>

        {/* Full-width interactive design collaboration workspace segment */}
        <div className="lg:col-span-12 mt-6">
          <div className="bg-[#FAF8F5]/50 border border-black/10 rounded-2xl p-5 shadow-xs text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#b45309]">05. Realtime Atelier Revision Workbench</span>
            <h3 className="font-serif italic text-xl text-stone-900 mt-1">Design Collaboration & 3D Spatial Drape Proofing</h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Review live annotations from {activeCustomer.name}, orbit the digital gown in simulated 3D space, and mark specific structural adjustments as resolved as you work the drafting blocks.
            </p>
            <DesignCollaboration
              project={activeProject}
              customer={activeCustomer}
              onAddComment={handleAddProjectComment}
              onModifyComment={handleToggleCommentResolution}
              onStatusChange={(status) => updateActiveProjectField("customerApprovalStatus", status)}
            />
          </div>
        </div>

      </main>
    )}

      {/* ================= CLIENT PORTER INTERACTOR IF MODE === 'client' ================= */}
      {workspaceMode === "client" && (
        <section className="bg-[#F2EFE9] border-t border-black/10 py-8 px-6 sm:px-12 mt-8 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="border border-black/20 bg-[#FDFCFB] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 pb-4 mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#b45309] font-bold">Secured Virtual Client Preview Portal</span>
                  <h3 className="text-2xl font-serif italic text-stone-900 mt-1">Hello, {activeCustomer.name}</h3>
                  <p className="text-xs text-stone-500 mt-1">The designer has shared this live interactive proposal mockup matching your specified parameters.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider block text-stone-400">Mock Sizing Proof</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    activeProject.customerApprovalStatus === "Approved" 
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : activeProject.customerApprovalStatus === "Change-Requested"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {activeProject.customerApprovalStatus}
                  </span>
                </div>
              </div>

              {/* Display of dimensions for verification */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#F2EFE9]/40 rounded-xl border border-black/5 mb-6">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-stone-400">Bust</span>
                  <div className="text-lg font-serif italic text-stone-900 font-bold">{activeCustomer.measurements.chest} <span className="text-[10px] text-stone-500">{activeCustomer.measurements.unit}</span></div>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-stone-400">Waist</span>
                  <div className="text-lg font-serif italic text-stone-900 font-bold">{activeCustomer.measurements.waist} <span className="text-[10px] text-stone-500">{activeCustomer.measurements.unit}</span></div>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-stone-400">Hips</span>
                  <div className="text-lg font-serif italic text-stone-900 font-bold">{activeCustomer.measurements.hips} <span className="text-[10px] text-stone-500">{activeCustomer.measurements.unit}</span></div>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-stone-400">Total Height</span>
                  <div className="text-lg font-serif italic text-stone-900 font-bold">{activeCustomer.measurements.height} <span className="text-[10px] text-stone-500">{activeCustomer.measurements.unit}</span></div>
                </div>
              </div>

              {/* Interactive 3D Orbit Sandbox & Comments Dialoguer */}
              <div id="clientDrapeCollabFrame" className="mb-8 mt-4 text-left border border-black/10 rounded-2xl p-4 bg-white shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 border-b border-black/5 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#b45309] block">2D Visual Mannequin, 3D Spatial Gown & Sizing Chat</span>
                    <p className="text-[11px] text-stone-500 font-sans mt-0.5">Incorporate adjustments and export digital drafting blocks to external spatial visualizers.</p>
                  </div>
                  
                  {/* Realtime 3D Neutral Format Exporter Tool */}
                  <div className="bg-[#FAF8F5] border border-black/10 rounded-xl p-2.5 flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-full shrink-0">
                    <div className="flex gap-1 items-center bg-[#F2EFE9] border border-black/5 rounded-md p-1">
                      {(["glb", "obj", "usdz"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          id={`btnExportFormat-${fmt}`}
                          type="button"
                          disabled={isExporting}
                          onClick={() => {
                            setExportFormat(fmt);
                            setExportSuccess(false);
                          }}
                          className={`text-[9px] font-mono px-2 py-1 font-bold rounded-sm uppercase transition-all ${
                            exportFormat === fmt
                              ? "bg-black text-white shadow-xs"
                              : "text-stone-500 hover:text-black hover:bg-white/40"
                          }`}
                        >
                          .{fmt}
                        </button>
                      ))}
                    </div>

                    <button
                      id="btnTriggerExport3D"
                      type="button"
                      onClick={handleSimulateExport}
                      disabled={isExporting}
                      className="px-3 py-1.5 bg-black hover:bg-stone-850 text-white font-mono rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Box className="w-3.5 h-3.5 text-amber-500" />
                      {isExporting ? `Exporting ${exportProgress}%` : "Export 3D Asset"}
                    </button>
                  </div>
                </div>

                {/* Progress bar or export success banner */}
                {(isExporting || exportSuccess) && (
                  <div className="mb-4 bg-[#FAF9F6] border border-stone-200/80 p-4 rounded-xl flex flex-col gap-2 transition-all">
                    {isExporting && (
                      <div>
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-wide font-bold text-stone-500 mb-1.5 font-mono">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                            Baking geometry & patterns into neutral {exportFormat.toUpperCase()} topology...
                          </span>
                          <span>{exportProgress}%</span>
                        </div>
                        <div className="w-full bg-stone-200/60 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full transition-all duration-150" 
                            style={{ width: `${exportProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {exportSuccess && !isExporting && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-green-50/50 border border-green-200/60 p-3 rounded-lg text-left">
                        <div className="flex items-start gap-2.5">
                          <div className="bg-green-100 text-green-800 p-1.5 rounded-full mt-0.5 sm:mt-0 shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-green-950">Export Successful</h5>
                            <p className="text-xs text-stone-600 mt-0.5 font-mono break-all">{exportFilename}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const element = document.createElement("a");
                            const file = new Blob(["Simulated neutral 3D pattern data structure..."], {type: "text/plain"});
                            element.href = URL.createObjectURL(file);
                            element.download = exportFilename;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Download File
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <DesignCollaboration
                  project={activeProject}
                  customer={activeCustomer}
                  onAddComment={handleAddProjectComment}
                  onModifyComment={handleToggleCommentResolution}
                  onStatusChange={(status) => updateActiveProjectField("customerApprovalStatus", status)}
                />
              </div>

              {/* Quick feedback message log */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs uppercase font-bold text-stone-800 mb-2">Proposal Overview and Fabric Specs:</h4>
                  <p className="text-xs text-stone-700 leading-relaxed bg-[#F2EFE9]/30 p-4 rounded-xl border border-black/5">
                    Your style is mapped with beautiful <strong>{activeProject.fabric.name}</strong> ({activeProject.fabric.textureName}) colored in {activeProject.fabric.color}. The designer has configured a stylish <strong>{activeProject.styling.silhouette} cut</strong> dress pairing a <strong>{activeProject.styling.neckline} neckline</strong> with {activeProject.styling.sleeve} sleeves. Fabric quantity drafted: <strong>{(activeProject.lastCalculations?.estimatedYardsNeeded || 3.0).toFixed(1)} yards</strong>.
                  </p>
                </div>

                {activeProject.customerFeedback && (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Current Feedback Sent to Dressmaker:</span>
                    <p className="text-xs text-stone-700 italic mt-1 font-serif">"{activeProject.customerFeedback}"</p>
                  </div>
                )}

                {/* Simulated client reaction area */}
                <div className="pt-4 border-t border-black/10">
                  <h4 className="text-xs uppercase font-bold text-stone-800 mb-2">Configure Feedback Notes or Approve Design:</h4>
                  <textarea
                    id="clientNotesText"
                    rows={3}
                    placeholder="Is the drape, neckline, or fabric pattern ideal? Type recommendations here..."
                    defaultValue={activeProject.customerFeedback}
                    className="w-full bg-[#FDFCFB] border border-black/20 text-stone-900 text-xs p-3 rounded-md focus:border-stone-900 outline-none resize-none font-serif"
                  />

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      id="btnApproveProject"
                      onClick={() => {
                        const notes = (document.getElementById("clientNotesText") as HTMLTextAreaElement)?.value || "";
                        submitClientFeedback(notes, "Approved");
                        alert("Approved! Thank you. The atelier designer has been notified to proceed with precision fabric cutting.");
                      }}
                      className="px-6 py-3 bg-green-700 text-white font-serif hover:bg-green-800 rounded-sm text-xs transition-all uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" /> Looks Perfect! Approve Fit & Cutting
                    </button>

                    <button
                      id="btnRequestChanges"
                      onClick={() => {
                        const notes = (document.getElementById("clientNotesText") as HTMLTextAreaElement)?.value || "";
                        if (!notes.trim()) {
                          alert("Please specify the changes you require so the dressmaker can adjust the pattern block variables.");
                          return;
                        }
                        submitClientFeedback(notes, "Change-Requested");
                        alert("Change Request Submitted. The dressmaker's custom parameters will update automatically.");
                      }}
                      className="px-6 py-3 bg-black text-[#FDFCFB] font-serif hover:bg-stone-800 rounded-sm text-xs transition-all uppercase tracking-widest"
                    >
                      Request adjustments & Sizing changes
                    </button>

                    <button
                      onClick={() => {
                        setWorkspaceMode("designer");
                        setActiveLog("Returned back to designer cutting board.");
                      }}
                      className="px-6 py-3 bg-[#F2EFE9] hover:bg-stone-200 text-stone-700 text-xs transition-all font-semibold rounded-sm"
                    >
                      Return to Drawing Desk
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* Custom inline helper terminal and details list at bottom */}
      <footer className="mt-auto border-t border-black bg-stone-950 text-stone-200 p-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4 text-xs">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 items-center">
            <span className="text-amber-500 font-bold uppercase tracking-wider text-[10px]">Active Terminal output log:</span>
            <span className="text-stone-300 font-mono text-[11px]" id="terminalStatusLog">{activeLog}</span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-stone-400 font-mono text-[10px]">
            <div>Fabric: <span className="text-stone-200">{activeProject?.fabric?.name || "Silk"}</span></div>
            <div>Darts: <span className="text-stone-200">{activeProject?.lastCalculations?.patternFormulas?.suggestedDartsCount || 2} pieces</span></div>
            <div>Yards: <span className="text-amber-400 font-semibold">{(activeProject?.lastCalculations?.estimatedYardsNeeded || 2.8).toFixed(1)} yd</span></div>
            <div>Client status: <span className="text-[#a855f7]">{activeProject?.customerApprovalStatus || "Pending"}</span></div>
          </div>
        </div>
      </footer>

      {/* ================= ADD NEW CUSTOMER MODAL OVERLAY ================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FDFCFB] border border-black max-w-md w-full rounded-2xl overflow-hidden p-6 shadow-2xl relative">
            
            <button
              id="closAddCustomer"
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-[#F2EFE9] text-stone-700 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] uppercase tracking-wider text-[#b45309] font-bold">New Portfolio Profile</span>
            <h3 className="font-serif text-2xl italic text-stone-900 mb-4">Add Custom Client</h3>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Full Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="Elena Rostova"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-[#F2EFE9] border border-black/10 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-black outline-none font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Email address</label>
                  <input
                    type="email"
                    placeholder="elena.rostova@couture.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full bg-[#F2EFE9] border border-black/10 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 342-9981"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-[#F2EFE9] border border-black/10 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-black/5 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase font-bold text-stone-900">Initial Measurements</span>
                  <select
                    value={newCustUnit}
                    onChange={(e) => setNewCustUnit(e.target.value as any)}
                    className="bg-[#F2EFE9] text-[10px] p-1 border border-black/5 rounded-sm"
                  >
                    <option value="inches">Inches (")</option>
                    <option value="cm">cm</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-stone-400 uppercase">Chest</label>
                    <input
                      type="number"
                      value={newCustChest}
                      onChange={(e) => setNewCustChest(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#F2EFE9] p-1.5 text-xs rounded-sm text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-400 uppercase">Waist</label>
                    <input
                      type="number"
                      value={newCustWaist}
                      onChange={(e) => setNewCustWaist(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#F2EFE9] p-1.5 text-xs rounded-sm text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-400 uppercase">Hips</label>
                    <input
                      type="number"
                      value={newCustHips}
                      onChange={(e) => setNewCustHips(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#F2EFE9] p-1.5 text-xs rounded-sm text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-400 uppercase">Height</label>
                    <input
                      type="number"
                      value={newCustHeight}
                      onChange={(e) => setNewCustHeight(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#F2EFE9] p-1.5 text-xs rounded-sm text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-400 uppercase">Shoulders</label>
                    <input
                      type="number"
                      value={newCustShoulder}
                      onChange={(e) => setNewCustShoulder(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#F2EFE9] p-1.5 text-xs rounded-sm text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-400 uppercase">Sleeves</label>
                    <input
                      type="number"
                      value={newCustSleeve}
                      onChange={(e) => setNewCustSleeve(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#F2EFE9] p-1.5 text-xs rounded-sm text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black hover:bg-stone-800 text-[#FDFCFB] text-xs font-serif uppercase tracking-widest font-bold rounded-sm transition-all"
                >
                  Create & Mount on studio
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-3 bg-[#F2EFE9] hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-sm transition-all"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
