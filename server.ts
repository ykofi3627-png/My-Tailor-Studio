import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to prevent app crashes on startup if key is missing
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }
  return ai;
}

// REST helper to handle tailoring recommendations & dynamic pattern formulas
app.post("/api/gemini/tailor", async (req, res) => {
  const { customerName, measurements, fabric, designName, styleDescription } = req.body;

  if (!customerName || !measurements) {
    return res.status(400).json({ error: "Missing required customer data or measurements." });
  }

  // Exact fallback formulas in case AI is offline or key is missing
  const unit = measurements.unit || "inches";
  const chest = parseFloat(measurements.chest) || 36;
  const waist = parseFloat(measurements.waist) || 28;
  const hips = parseFloat(measurements.hips) || 38;
  const height = parseFloat(measurements.height) || 64;
  const shoulder = parseFloat(measurements.shoulder) || 15;
  const sleeve = parseFloat(measurements.sleeve) || 22;
  const neck = parseFloat(measurements.neck) || 12;

  // Smart calculations based on actual tailoring drafting blocks
  const fallbackFrontBodice = `${((chest / 4) + 1.25).toFixed(2)} ${unit}`;
  const fallbackBackBodice = `${((chest / 4) + 0.75).toFixed(2)} ${unit}`;
  const fallbackArmhole = `${((chest / 8) + 2.75).toFixed(2)} ${unit}`;
  const fallbackSkirtPanel = `${((hips / 4) + 2.50).toFixed(2)} ${unit}`;
  const fallbackDarts = waist < chest - 4 ? 4 : 2;
  const fallbackDartLength = `${height > 60 ? "5.0" : "4.0"} ${unit}`;

  const defaultYards = height > 65 ? 3.5 : 2.8;

  const fallbackResponse = {
    isAI: false,
    patternFormulas: {
      frontBodiceWidth: fallbackFrontBodice,
      backBodiceWidth: fallbackBackBodice,
      armholeDepth: fallbackArmhole,
      skirtPanelWidth: fallbackSkirtPanel,
      suggestedDartsCount: fallbackDarts,
      dartLength: fallbackDartLength,
    },
    cuttingGuide: [
      `1. Pre-shrink and iron the ${fabric?.color || "custom colored"} ${fabric?.name || "Material"} before drawing pattern marks.`,
      `2. Fold the fabric lengthwise, aligning the selvages perfectly.`,
      `3. Lay the Front Bodice pattern piece on the center fold (requires ${fallbackFrontBodice} layout block width).`,
      `4. Lay the Back Bodice patterns on the double raw edges, adding a 1-inch seam allowance for zipper installation.`,
      `5. Draw sleeve curves using your sleeve length (${sleeve} ${unit}) and armhole depth measurement.`,
      `6. Use high-quality tailor shears, avoiding lifting the fabric off the table while cutting to keep precise straight lines.`
    ],
    estimatedYardsNeeded: defaultYards,
    sewingSteps: [
      `1. Sew stay-stitching along the neckline curve to prevent stretching.`,
      `2. Transfer and sew the ${fallbackDarts} recommended standard vertical darts (Length: ${fallbackDartLength}) on back and front pieces to shape the waist line from ${chest} ${unit} chest down to ${waist} ${unit} waist.`,
      `3. Join front and back bodice sections at the shoulders, finishing with an overlock or French seam.`,
      `4. Prepare the neck lining or face-band based on preferred style silhouette.`,
      `5. Attach sleeves into armholes with ease-stitching at the cap.`,
      `6. Join the skirt panels to the bodice at the natural waistline seam.`,
      `7. Add back zipper and complete hemming.`
    ],
    tailoringTips: [
      `Fabric Handling: ${fabric?.name || "General Fabric"} requires medium-heat pressing. Avoid over-pressing the seams.`,
      `Tension suggestion: Adjust thread tension to 3.5 to prevent puckering on this material.`,
      `Sizing Adjustment: The waist-to-hip ratio is ${((waist / hips) || 0.75).toFixed(2)}. Darts are vital in the waist-curve transition to ensure a professional wrinkle-free silhouette.`
    ]
  };

  const client = getGeminiClient();

  if (!client) {
    // Return calculations gracefully
    return res.json(fallbackResponse);
  }

  try {
    const prompt = `You are an expert couture dress designer and master tailor patternmaker.
Analyze these custom client measurements, chosen fabric, and desired styling block:
- Name: ${customerName}
- Garment Design: ${designName || "Custom Gown"}
- Style description requested: ${styleDescription || "No specific details, design a signature elegant gown"}
- Fabric selection: ${fabric?.color || "chosen"} ${fabric?.name || "textile"} with ${fabric?.pattern || "solid"} pattern.
- Measurements: Chest: ${chest}${unit}, Waist: ${waist}${unit}, Hips: ${hips}${unit}, Height: ${height}${unit}, Shoulder Width: ${shoulder}${unit}, Sleeve: ${sleeve}${unit}, Neck: ${neck}${unit}.

Calculate precise dress pattern drafting dimensions (ease included), safety instructions, yardage layout metrics, and expert tailoring order of operations.
Ensure calculations match realistic mathematical patterns (e.g. waist line ease, chest partitioning). Get the output tailored exactly to this individual's sizing.
`;

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a bespoke fashion AI that returns strict pattern pieces, sequence sewing orders, and yardage estimates in structured JSON schemas.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patternFormulas: {
              type: Type.OBJECT,
              properties: {
                frontBodiceWidth: { type: Type.STRING, description: "Calculated width for front pattern block" },
                backBodiceWidth: { type: Type.STRING, description: "Calculated width for back pattern block" },
                armholeDepth: { type: Type.STRING, description: "Calculated sleeve cap armhole depth" },
                skirtPanelWidth: { type: Type.STRING, description: "Recommended layout width for skirt panels" },
                suggestedDartsCount: { type: Type.INTEGER, description: "Number of darts to insert" },
                dartLength: { type: Type.STRING, description: "Length of darts for matching back contour" },
              },
              required: ["frontBodiceWidth", "backBodiceWidth", "armholeDepth", "skirtPanelWidth", "suggestedDartsCount", "dartLength"]
            },
            cuttingGuide: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Instructions for slicing fabric blocks without wasting material"
            },
            estimatedYardsNeeded: {
              type: Type.NUMBER,
              description: "Calculated yardage needed (e.g., 3.25 depending on style detail)."
            },
            sewingSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Sewing progression sequence"
            },
            tailoringTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Fabric handling warnings and contour adjustments"
            }
          },
          required: ["patternFormulas", "cuttingGuide", "estimatedYardsNeeded", "sewingSteps", "tailoringTips"]
        }
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({
        isAI: true,
        ...parsed
      });
    } else {
      return res.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Gemini tailoring fetch failed, sending smart fallback data:", error);
    return res.json(fallbackResponse);
  }
});

// Image Generation API to produce high-fashion sketches
app.post("/api/gemini/generate-sketch", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "No image prompt supplied" });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.json({
      success: false,
      message: "Gemini API key is unconfigured. Showing visual design simulator instead."
    });
  }

  try {
    const fullPrompt = `${prompt}. High-quality professional fashion design sketch, elegant runway fashion CAD mockup drawing, highly detailed mannequin model displaying custom tailoring, neutral cream background.`;
    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "512px"
        }
      }
    });

    let foundImage = false;
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Image = part.inlineData.data;
          foundImage = true;
          return res.json({
            success: true,
            imageUrl: `data:image/png;base64,${base64Image}`
          });
        }
      }
    }

    if (!foundImage) {
      return res.json({
        success: false,
        message: "No image bytes returned in candidate payload."
      });
    }
  } catch (error: any) {
    console.error("Gemini studio image generator failed:", error);
    return res.json({
      success: false,
      message: error?.message || "Generation error. Using default digital illustration engine."
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Digital Tailoring Suite server running on http://localhost:${PORT}`);
  });
}

startServer();
