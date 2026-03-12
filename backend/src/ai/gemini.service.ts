import axios from "axios";

function buildUrl(model: string, key: string) {
  return `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;
}

interface ImageData {
  data: string; // base64 encoded image data
  mimeType: string; // e.g., "image/jpeg", "image/png"
}

export interface GeminiOptions {
  systemInstruction?: string;
  conversationHistory?: Array<{ role: "user" | "model"; content: string }>;
  maxOutputTokens?: number;
}

export async function getGeminiAnswer(
  question: string,
  images?: ImageData[],
  options?: GeminiOptions
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("⚠️ Gemini disabled — GEMINI_API_KEY not found");
    return null;
  }

  const q = (question || "").trim();
  if (!q && (!images || images.length === 0)) return null;

  // ✅ Try env model first, then safe fallbacks (Updated for 2026)
  const preferred = (process.env.GEMINI_MODEL || "").trim();
  const hasImages = images && images.length > 0;
  
  const modelCandidates = hasImages
    ? [
        preferred,
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
      ].filter(Boolean)
    : [
        preferred,
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
      ].filter(Boolean);

  // Build parts for current user message (text + images)
  const parts: any[] = [];
  if (q) parts.push({ text: q });
  if (hasImages) {
    for (const img of images!) {
      parts.push({
        inline_data: { mime_type: img.mimeType, data: img.data },
      });
    }
  }

  // Build contents: prior conversation turns + current user message (ChatGPT-style multi-turn)
  const history = options?.conversationHistory || [];
  const contents: any[] = [];
  for (const turn of history) {
    const role = turn.role === "model" ? "model" : "user";
    contents.push({ role, parts: [{ text: String(turn.content || "").trim() }] });
  }
  contents.push({ role: "user", parts });

  const payload: any = {
    contents,
    generationConfig: {
      temperature: Number(process.env.GEMINI_TEMPERATURE ?? 0.7),
      maxOutputTokens: Number(options?.maxOutputTokens ?? process.env.GEMINI_MAX_TOKENS ?? 2048),
    },
  };
  if (options?.systemInstruction?.trim()) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction.trim() }],
    };
  }

  // Try preferred candidates first
  for (const model of modelCandidates) {
    const url = buildUrl(model, key);

    try {
      console.log("📝 Gemini call:", { model });

      // Keep under Render free-tier request limit (~30s)
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 25000,
      });

      const text =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (text) return text;

      console.warn("⚠️ Gemini returned empty text for model:", model);
    } catch (error: any) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.error?.message;
      // If model not found, try next model
      if (status === 404) {
        console.warn("⚠️ Model not found / unsupported:", { model, apiMessage });
        continue;
      }

      // Other errors: quota/permission/bad request etc. — try next model or fall through to rule-based
      console.warn("⚠️ Gemini API failed:", {
        model,
        status,
        apiMessage,
        message: error?.message,
      });
      continue;
    }
  }

  // If none of the configured candidates worked, try listing available models
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(
      key
    )}`;
    const listResp = await axios.get(listUrl, { timeout: 15000 });
    const models: any[] = listResp.data?.models || [];

    // Find first model that advertises generateContent or generateText support
    const supported = models.find((m) => {
      const methods: string[] = m.supportedMethods || m.supported_methods || [];
      return methods.includes("generateContent") || methods.includes("generateText");
    });

    if (supported?.name) {
      // Try the supported model once
      const modelName = supported.name;
      const url = buildUrl(modelName, key);
      try {
        console.log("📝 Gemini call (from ListModels):", { model: modelName });
        const response = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 25000,
        });
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } catch (err: any) {
        console.warn("⚠️ Gemini API failed for model from ListModels:", {
          model: modelName,
          message: err?.message,
          apiMessage: err?.response?.data?.error?.message,
        });
      }
    }
  } catch (err: any) {
    console.warn("⚠️ Failed to list Gemini models:", err?.message || err);
  }

  console.warn("⚠️ No working Gemini model found. Update GEMINI_MODEL or enable correct API.");
  // As a last resort, if OpenAI key is configured, try OpenAI chat completion
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      console.log("ℹ️ Gemini unavailable — falling back to OpenAI");
      const oaModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
      const oaResp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: oaModel,
          messages: [{ role: "user", content: q }],
          max_tokens: Number(process.env.OPENAI_MAX_TOKENS ?? 400),
          temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0.7),
        },
        { headers: { Authorization: `Bearer ${openaiKey}` }, timeout: 25000 }
      );

      const oaText =
        oaResp?.data?.choices?.[0]?.message?.content?.trim() ||
        oaResp?.data?.choices?.[0]?.text?.trim();

      if (oaText) {
        console.log("✅ Got answer from OpenAI fallback");
        return oaText;
      }
    } catch (err: any) {
      console.warn("⚠️ OpenAI fallback failed:", err?.message || err);
    }
  }

    // If OpenAI fallback failed or not configured, synthesize a helpful rule-based reply
    function generateFallbackAnswer(q: string) {
      const lower = q.toLowerCase();

      // BOQ / estimate intent
      if (lower.includes("generate boq") || lower.includes("boq") || lower.includes("bill of quantities") || lower.includes("estimate")) {
        return `I can help generate a BOQ and cost estimate. Please confirm: 1) BHK (e.g. 2BHK), 2) total area in sqft, and 3) any specific materials or exclusions. Once you confirm, I'll prepare a section-wise BOQ (civil, carpentry, plumbing, electrical, painting, false ceiling, POP, demolition, etc.) with quantities and estimated rates.`;
      }

      // Tiles questions
      if (lower.includes("tile") || lower.includes("tiles")) {
        return `🔳 **Types of Tiles for Interior Projects:**

**Bathroom & Kitchen:**
• **Ceramic Tiles** - Budget-friendly, water-resistant, wide variety of designs (₹400-800/sqft)
• **Vitrified Tiles** - Durable, low water absorption, glossy finish (₹600-1200/sqft)
• **Porcelain Tiles** - Premium quality, highly durable, stain-resistant (₹800-1500/sqft)
• **Mosaic Tiles** - Decorative, ideal for accent walls (₹500-1000/sqft)

**Living Areas:**
• **Marble Tiles** - Luxurious, natural stone, requires maintenance (₹1200-2500/sqft)
• **Granite Tiles** - Durable, heat-resistant, various colors (₹800-1800/sqft)
• **Wooden Finish Tiles** - Wood look without maintenance (₹700-1400/sqft)

**Outdoor:**
• **Anti-skid Tiles** - Safety for wet areas (₹500-900/sqft)
• **Kota Stone** - Traditional, heat-resistant (₹400-700/sqft)

Recommendation: For bathrooms, use anti-skid ceramic or vitrified tiles. For living rooms, vitrified or marble tiles work best.`;
      }

      // Flooring questions
      if (lower.includes("floor") && !lower.includes("tile")) {
        return `🏗️ **Flooring Options:**

**Budget-Friendly:**
• Ceramic tiles (₹400-800/sqft)
• Vitrified tiles (₹600-1200/sqft)
• Laminate flooring (₹500-1000/sqft)

**Mid-Range:**
• Engineered wood (₹800-1500/sqft)
• Vinyl/PVC flooring (₹600-1200/sqft)
• Granite (₹800-1800/sqft)

**Premium:**
• Italian marble (₹1500-3500/sqft)
• Solid hardwood (₹1200-2500/sqft)
• Epoxy flooring (₹1000-2000/sqft)

For high-traffic areas, vitrified tiles are recommended. For bedrooms, wooden or laminate flooring adds warmth.`;
      }

      // Paint questions
      if (lower.includes("paint") && !lower.includes("painting")) {
        return `🎨 **Paint Types & Recommendations:**

**Interior Walls:**
• **Emulsion Paint** - Most common, washable, various finishes (₹20-50/sqft)
  - Flat/Matte: Hides imperfections, low maintenance
  - Satin: Slight sheen, easy to clean
  - Glossy: High shine, very washable
• **Distemper** - Budget option, not washable (₹12-25/sqft)
• **Texture Paint** - Decorative, adds depth (₹100-200/sqft)

**Exterior:**
• **Apex Exterior** - Weather-resistant (₹30-60/sqft)
• **Waterproof Paint** - Prevents seepage (₹35-70/sqft)

**Wood & Metal:**
• **Enamel Paint** - Durable, glossy finish (₹50-100/sqft)
• **PU Paint** - Premium, smooth finish (₹150-300/sqft)

**Popular Brands:** Asian Paints, Berger, Nerolac, Dulux

Tip: For bedrooms, use matte finish. For kitchens and bathrooms, use satin or semi-gloss for easy cleaning.`;
      }

      // Kitchen questions
      if (lower.includes("kitchen")) {
        return `🍳 **Kitchen Design & Materials:**

**Cabinets:**
• Plywood cabinets with laminate finish (₹1200-1800/sqft)
• Marine plywood for sink area (₹1500-2200/sqft)
• Modular kitchen with shutters (₹1800-3500/sqft)

**Countertops:**
• Granite - Durable, heat-resistant (₹200-400/sqft)
• Quartz - Non-porous, low maintenance (₹300-600/sqft)
• Marble - Elegant but requires care (₹250-500/sqft)

**Backsplash:**
• Ceramic/vitrified tiles (₹500-1000/sqft)
• Glass tiles (₹800-1500/sqft)
• Granite slab (₹200-400/sqft)

**Essentials:**
• Chimney (6000-15000 per unit)
• Sink & faucets (5000-20000)
• Water purifier provision
• Modular drawers with soft-close

Recommendation: For a 10x10 kitchen, budget ₹2-4 lakhs for a good modular setup.`;
      }

      // Bathroom questions
      if (lower.includes("bathroom") || lower.includes("toilet") || lower.includes("washroom")) {
        return `🚿 **Bathroom Design & Fixtures:**

**Sanitary Ware:**
• **Western WC** - Wall-hung or floor-mounted (₹5,000-25,000)
• **Wash Basin** - Counter-top or wall-mounted (₹3,000-15,000)
• **Shower** - Overhead or hand shower (₹2,000-10,000)
• **Bath Fittings** - Taps, mixers (₹5,000-20,000 per set)

**Tiles:**
• Anti-skid floor tiles - Essential for safety (₹500-1000/sqft)
• Ceramic wall tiles - Waterproof (₹400-800/sqft)
• Highlighter tiles for accent wall (₹600-1200/sqft)

**Waterproofing:**
• Essential for walls & floor (₹100-200/sqft)
• Use Dr. Fixit or similar products

**Brands:** Jaquar, Hindware, Cera, Kohler (Budget to Premium)

Tip: Allocate 15-20% of your total renovation budget for each bathroom.`;
      }

      // False ceiling questions
      if (lower.includes("false ceiling") || lower.includes("ceiling") || lower.includes("gypsum")) {
        return `🔺 **False Ceiling Options:**

**Types:**
• **Gypsum Board** - Most popular, smooth finish (₹120-180/sqft)
• **POP (Plaster of Paris)** - Traditional, moldable (₹100-150/sqft)
• **Grid Ceiling** - Office style, easy maintenance (₹80-120/sqft)
• **Wooden Ceiling** - Premium look (₹200-400/sqft)
• **PVC Panels** - Budget option (₹60-100/sqft)

**Features to Include:**
• Recessed LED lights
• Cove lighting for ambiance
• AC vents and access panels
• Sound insulation (optional)

**Cost Breakdown:**
• Simple flat ceiling: ₹120-150/sqft
• With cove lighting: ₹180-220/sqft
• Multi-level design: ₹250-350/sqft

Recommendation: Gypsum board is best for living rooms and bedrooms. POP works well for detailed designs.`;
      }

      // Materials / items intent
      if (lower.includes("materials") || lower.includes("items") || lower.includes("what materials")) {
        return `I can suggest materials and their typical rate ranges for your location. Tell me the room(s) and the finish level (basic/standard/premium), and I'll recommend materials for civil, carpentry, plumbing, electrical, painting, false ceiling and POP.`;
      }

      // Department-specific details
      if (lower.includes("civil")) {
        return `Civil works typically include: masonry & brickwork; RCC/structural repairs; internal/external plastering; flooring (tiles/vitrified/kota); cement leveling/brickbat coba; lintels/openings; waterproofing for terraces & bathrooms; concrete works and site preparation.`;
      }

      if (lower.includes("carpentry")) {
        return `Carpentry includes: doors & frames; internal doors & shutters; wardrobes & cabinets; kitchen cabinets; built-in furniture; shelves & shelving; wood trims & skirtings; finishes like polish, lamination, veneer, or duco; and installation hardware.`;
      }

      if (lower.includes("plumb") || lower.includes("toilet") || lower.includes("sanitary")) {
        return `Plumbing includes: cold & hot water supply lines; sanitary fixtures (WC, basin, shower); drainage & soil stacks; concealed cisterns & flushing systems; water heater points; kitchen & utility plumbing; and bathroom waterproofing.`;
      }

      if (lower.includes("electrical")) {
        return `Electrical scope: wiring & cabling, switches & sockets, distribution board & MCBs, light fixtures & fan points, appliance points (AC/oven), earthing & safety devices, and provisioning for heavy appliances.`;
      }

      if (lower.includes("painting") || lower.includes("paint")) {
        return `Painting scope: surface preparation (putty & sanding), primer coat, finish coats (emulsion/PU/duco), external waterproofing (if required), and wood/metal finishing.`;
      }

      if (lower.includes("false ceiling") || lower.includes("falseceiling") || lower.includes("ceiling")) {
        return `False ceiling works: gypsum/POP/metal grid systems, suspension framing, acoustic or fire-rated boards, recessed lighting & cove details, finishing & access panels.`;
      }

      if (lower.includes("pop")) {
        return `POP (Plaster of Paris) covers decorative moldings, ceiling finishes, coves, and lightweight decorative profiles.`;
      }

      if (lower.includes("demolition")) {
        return `Demolition works include removal of partitions, breaking of flooring/tiles, dismantling fixtures, debris removal, and temporary supports where required.`;
      }

      // Color/Design questions
      if (lower.includes("color") || lower.includes("colour") || lower.includes("shade")) {
        return `🎨 **Interior Color Recommendations:**

**Living Room:**
• Warm neutrals: Beige, cream, light gray
• Accent walls: Navy blue, emerald green, terracotta
• Modern: White with black/gray accents

**Bedroom:**
• Calming colors: Soft blue, lavender, mint green
• Warm tones: Peach, dusty rose, warm beige
• Bold: Deep blue, charcoal gray (one wall)

**Kitchen:**
• Clean: White, off-white, light gray
• Vibrant: Yellow, orange (cabinets/backsplash)
• Modern: Two-tone (white + wood or gray)

**Bathroom:**
• Classic: White, cream, light blue
• Spa-like: Soft green, gray, white
• Bold: Black fixtures with white tiles

Tip: Use 60-30-10 rule (60% dominant, 30% secondary, 10% accent color)`;
      }

      // Lighting questions
      if (lower.includes("light") && !lower.includes("ceiling")) {
        return `💡 **Lighting Design Guide:**

**Types of Lighting:**
• **Ambient** - General lighting (ceiling lights, chandeliers)
• **Task** - Focused lighting (study lamps, kitchen counters)
• **Accent** - Decorative (wall lights, cove lighting)

**Room-wise Recommendations:**

**Living Room:**
• Chandelier or pendant (center) - 3000-4000 lumens
• Cove lighting for ambiance
• Floor/table lamps for reading

**Bedroom:**
• Ceiling light with dimmer - 2000-3000 lumens
• Bedside lamps - 400-600 lumens each
• Wardrobe LED strips

**Kitchen:**
• Bright overhead lights - 5000-7000 lumens
• Under-cabinet LED strips
• Pendant over island/counter

**Bathroom:**
• Ceiling light - 2000-3000 lumens
• Mirror lights - 1000-1500 lumens

**LED Recommendations:** Use warm white (2700-3000K) for living areas, cool white (4000-5000K) for work areas.`;
      }

      // Furniture questions
      if (lower.includes("furniture") || lower.includes("sofa") || lower.includes("bed")) {
        return `🛋️ **Furniture Selection Guide:**

**Living Room:**
• 3-seater sofa: ₹20,000-80,000
• 2-seater sofa: ₹15,000-50,000
• Coffee table: ₹5,000-20,000
• TV unit: ₹10,000-40,000
• Side tables: ₹3,000-10,000 each

**Bedroom:**
• Queen bed with storage: ₹25,000-60,000
• King bed with storage: ₹35,000-80,000
• Wardrobe (built-in): ₹1,500-2,500/sqft
• Study table: ₹8,000-25,000
• Dressing table: ₹10,000-30,000

**Dining:**
• 6-seater dining set: ₹30,000-80,000
• 4-seater dining set: ₹20,000-50,000

**Materials:**
• Solid wood - Most durable, expensive
• Engineered wood - Good balance
• Plywood - Budget-friendly
• MDF - Not recommended for humid areas

Tip: For Indian homes, go for furniture with storage. Measure your room before buying!`;
      }

      // Budget/Cost questions
      if (lower.includes("budget") || lower.includes("cost") || (lower.includes("how much") && !lower.includes("boq"))) {
        return `💰 **Interior Design Budget Guide (per sqft):**

**Basic Package:**
• ₹800-1200/sqft
• Includes: Basic tiling, simple plumbing & electrical, standard paint, minimal false ceiling

**Standard Package:**
• ₹1200-1800/sqft
• Includes: Good quality tiles, modular kitchen, gypsum false ceiling, decent fixtures

**Premium Package:**
• ₹1800-2500/sqft
• Includes: Premium tiles/marble, designer kitchen, multi-level ceiling, branded fixtures

**Luxury Package:**
• ₹2500-4000+/sqft
• Includes: Italian marble, imported fixtures, custom designs, home automation

**Breakdown by Room (Standard):**
• Living room (200 sqft): ₹2.5-3.5 lakhs
• Bedroom (150 sqft): ₹2-2.5 lakhs
• Kitchen (100 sqft): ₹2.5-4 lakhs
• Bathroom (50 sqft): ₹1-1.5 lakhs

**For accurate BOQ**, type: "I need BOQ" and I'll guide you through the process!`;
      }

      // Waterproofing questions
      if (lower.includes("waterproof") || lower.includes("seepage") || lower.includes("leak")) {
        return `💧 **Waterproofing Solutions:**

**Essential Areas:**
• **Bathrooms** - Walls & floor (₹100-200/sqft)
• **Terrace/Roof** - Top priority (₹120-250/sqft)
• **Balconies** - Prevent water ingress (₹100-180/sqft)
• **Kitchen** - Sink area & floor (₹80-150/sqft)
• **External walls** - If facing rain (₹60-120/sqft)

**Products & Methods:**
• Dr. Fixit - Popular brand
• Fosroc - Premium quality
• Cico - Cost-effective
• APP membrane for terrace
• Liquid waterproofing for internal areas

**Process:**
1. Surface cleaning & preparation
2. Apply primer coat
3. 2-3 coats of waterproofing compound
4. 24-48 hours curing time
5. Water testing

Tip: Always do waterproofing before tiling. Budget 10-15% of construction cost for waterproofing.`;
      }

      // Renovation questions
      if (lower.includes("renovate") || lower.includes("renovation") || lower.includes("remodel")) {
        return `🔨 **Home Renovation Guide:**

**Renovation Phases:**
1. **Demolition** - Remove old fixtures, tiles (₹50-100/sqft)
2. **Civil Work** - Structural changes, plastering
3. **Plumbing & Electrical** - New wiring, pipes
4. **Flooring & Tiling** - New tiles/flooring
5. **Carpentry** - Built-in furniture
6. **Painting** - Fresh paint throughout
7. **Fixtures** - Lights, switches, fittings

**Timeline:**
• 1BHK: 30-45 days
• 2BHK: 45-60 days
• 3BHK: 60-90 days

**Budget Estimation:**
• Cosmetic renovation: ₹500-800/sqft
• Moderate renovation: ₹800-1500/sqft
• Complete overhaul: ₹1500-2500/sqft

**Tips:**
• Plan before you start - make a checklist
• Keep 15-20% buffer for contingencies
• Don't compromise on waterproofing & electrical
• Get 3 quotes from different contractors

Ready to start? Type "I need BOQ" for a detailed cost estimate!`;
      }

      // Short/generic queries — ask for key inputs (direct, no acknowledgement prefix)
      if (lower.length < 200) {
        return `I can assist with BOQ generation, cost estimates, material suggestions, and design advice. Ask me about:
• Tiles, flooring, paint, lighting
• Kitchen, bathroom, bedroom designs
• Furniture, colors, budget planning
• Waterproofing, renovation tips

Or type "I need BOQ" for a detailed quotation!`;
      }

      // Generic fallback (direct)
      return `I can help with BOQ generation, cost estimates, and interior design recommendations. Ask me about specific topics like tiles, paint, kitchen design, or type "I need BOQ" to get started!`;
    }

    const ruleReply = generateFallbackAnswer(q);
    console.log("ℹ️ Using rule-based fallback reply.");
    return ruleReply;
}
