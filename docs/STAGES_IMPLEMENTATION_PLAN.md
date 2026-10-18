# FloodGuard AI — Master Stages Implementation Plan
**Comprehensive Architecture Blueprint & Execution Roadmap for Nepal Terai Flood Disaster Management**  
*Aligned with National Emergency Operations Center (NEOC), Ministry of Home Affairs (MoHA), and Disaster Management Authorities*

---

## 📋 Table of Contents
1. [User Vision & Core 11-Point Alignment Matrix](#1-user-vision--core-11-point-alignment-matrix)
2. [Geographic Scope: Nepal Terai Lowlands (21 Districts)](#2-geographic-scope-nepal-terai-lowlands-21-districts)
3. [System Architecture Flowchart](#3-system-architecture-flowchart)
4. [Completed Stages Deep-Dive](#4-completed-stages-deep-dive)
   - [Stage 5.1: Satellite Before-After Comparison (GEE Sentinel-1 SAR)](#stage-51-satellite-before-after-comparison-gee-sentinel-1-sar---point-1-done)
   - [Stage 5.2: Google Maps Platform Integration](#stage-52-google-maps-platform-integration---point-2-done)
5. [Upcoming Stages Implementation Roadmap](#5-upcoming-stages-implementation-roadmap)
   - [Stage 5.3: Flood Extent & City/Village Inundation Overlay](#stage-53-flood-extent--cityvillage-inundation-overlay---point-3-next)
   - [Stage 5.4: Road Network Inundation & Disruption Analysis](#stage-54-road-network-inundation--disruption-analysis---point-4)
   - [Stage 5.5: AI Demographic & Healthcare Intelligence via Gemini API](#stage-55-ai-demographic--healthcare-intelligence-via-gemini-api---points-5--6)
   - [Stage 5.6: Emergency Routing & Evacuation Navigator](#stage-56-emergency-routing--evacuation-navigator---points-7--9)
   - [Stage 5.7: Safe Haven & Refugee Camp Proximity Detector](#stage-57-safe-haven--refugee-camp-proximity-detector---point-8)
   - [Stage 5.8: Official Government Situation Report (SitRep) PDF Export](#stage-58-official-government-situation-report-sitrep-pdf-export---point-10)
   - [Stage 5.9: Real-Time River Gauge Telemetry & Vernacular SOS Alerts](#stage-59-real-time-river-gauge-telemetry--vernacular-sos-alerts---point-11-innovation)
6. [Technology Stack & API Credentials](#6-technology-stack--api-credentials)
7. [Governance, Testing & Verification Protocols](#7-governance-testing--verification-protocols)

---

## 1. User Vision & Core 11-Point Alignment Matrix

Here is the exact mapping of your proposed 11 points to the technical implementation stages:

| # | Your Original Requirement (User Proposal) | Technical Stage | Implementation Module | Status |
|:-:|:---|:---|:---|:---:|
| **1** | *"jo sabse pahle before and after image ko compare kare then bataye flood kaha hai."* | **Stage 5.1** | Sentinel-1 SAR GEE backscatter change detection, Otsu bimodal thresholding, dual-layer swipe comparison slider (`BeforeAfterSlider.tsx`) | ✅ **COMPLETED** |
| **2** | *"then google map ki api key use karte hai or google map ko apni website pe lagate hai."* | **Stage 5.2** | Google Maps JS API v3 integration with API key (`AIzaSy...`), camera clamping to Nepal Terai, Leaflet fallback (`GoogleMapsViewer.tsx`) | ✅ **COMPLETED** |
| **3** | *"google map pe highlight karke batayega kaha kaha flood aya hai or kis village mai or city mai flood hai hum yaha problem statement mai bataye hue particular area pe hi project banayenge."* | **Stage 5.3** | Semi-transparent illuminated flood polygon vector overlays for 11 Terai river corridors, 21 district hub color points, village/town popup directory (`teraiCitiesData.ts`, `teraiFloodCorridors.ts`, `CityVillagesModal.tsx`) | ✅ **COMPLETED** |
| **4** | *"google map pe ye batayega konsi road affect hui hai konsa area pe jyada affect hua hai."* | **Stage 5.4** | Inundated highway & road polyline layer (Mahendra Highway H01, Postal Highway H12, feeder corridors), impassable road cut-offs, bridge & barrage vulnerability monitor, isolated cut-off community analysis (`teraiRoadNetwork.ts`, `Stage54RoadsPage.tsx`, `GoogleMapsViewer.tsx`) | ✅ **COMPLETED & VERIFIED** |
| **5** | *"then hum internet pe available data ke basis pe ye bhi batayenge kis gaon , city or town mai kitne log hai or kitne hospitals hai ye hum gemini ki api key ki help se karenge."* | **Stage 5.5** | Google Gemini 1.5 API web-grounded research service for real-time village population census, vulnerable demographic counts, and live hospital bed/ICU status | 🚀 **NEXT TO EXECUTE** |
| **6** | *"iske liye alag section banayenge or sath hi google map pe city or village tap karke bhi ye batay ja sakega."* | **Stage 5.5 / 5.6** | Dedicated "Demographic & Health Intelligence" dashboard tab + interactive tap-to-inspect settlement modal on both Google Maps & Leaflet | ⏳ **PLANNED** |
| **7** | *"relief or medical support pahuchane ke liye best route define karega ya kaha se konsa route leke relief or medical support pahuchaya ja sakega."* | **Stage 5.6** | Emergency Convoy Route Engine avoiding inundated roads from regional logistics hubs (Biratnagar, Bharatpur, Nepalgunj) to cut-off villages | ⏳ **PLANNED** |
| **8** | *"flooded area ke nearby safe area detect karke batayega kaha pe refugees ke liye shelter bana sakte hai."* | **Stage 5.7** | Safe Haven $k$-NN proximity detector identifying dry elevated ground (>150m ASL, non-inundated schools, high ridges) for refugee camps | ⏳ **PLANNED** |
| **9** | *"jo logo ko uss area mai jana hai ya kahi or jana hai unke liye alternate route define karenege map pe"* | **Stage 5.6** | Civilian Evacuation Navigator providing turn-by-turn safe alternate routes bypassing flooded road choke-points | ⏳ **PLANNED** |
| **10**| *"in sabki report pdf form mai download ka option diya jayega so that its easy for government ki kaise kya karna hai"* | **Stage 5.8** | One-click Official Government Situation Report (SitRep) PDF generator with casualty estimates, submerged road lists, and relief dispatch directives | ⏳ **PLANNED** |
| **11**| *"if you want to add any point or any feature then please add it also"* | **Stage 5.9** | **Innovation Add-ons**: Real-time river hydro-telemetry gauges (DHM Nepal for Koshi/Narayani/Karnali), vernacular Nepali SMS/WhatsApp alert formatter, and English/Nepali bilingual toggle | ⏳ **PLANNED** |

---

## 2. Geographic Scope: Nepal Terai Lowlands (21 Districts)

As requested, FloodGuard AI strictly isolates the **Nepal Terai Lowlands** (Southern flat plains). The Himalayan mountain range is locked out to keep the focus sharp and prevent distraction.

### Covered 21 Terai Districts (East to West):
1. **Eastern Terai (Koshi & Madhesh):** Jhapa, Morang, Sunsari, Saptari, Siraha, Dhanusha, Mahottari, Sarlahi.
2. **Central Terai (Bagmati & Gandaki lowlands):** Rautahat, Bara, Parsa, Chitwan (lowland river valleys), Nawalpur (Nawalparasi East).
3. **Mid-Western Terai (Lumbini):** Parasi (Nawalparasi West), Rupandehi, Kapilvastu, Dang (lowland valleys), Banke, Bardiya.
4. **Far-Western Terai (Sudurpashchim):** Kailali, Kanchanpur.

### Camera & Spatial Clamping:
- **Latitude Bounds:** `26.20° N` to `28.35° N`
- **Longitude Bounds:** `79.95° E` to `88.25° E`
- **Elevation Ceiling:** `< 300 meters` ASL (all high mountain peaks locked out).

---

## 3. System Architecture Flowchart

```mermaid
graph TD
    subgraph DataIngestion ["1. Data & Intelligence Ingestion"]
        S1["Copernicus Sentinel-1 SAR (10m GRD)"]
        GEE["Google Earth Engine"]
        GMaps["Google Maps Platform v3"]
        Gemini["Google Gemini 1.5 Pro/Flash"]
        DHM["Nepal DHM River Telemetry"]
        OSM["Nepal Road Network (OSM)"]
    end

    subgraph FloodDetection ["2. Satellite Deluge Processing (Stage 5.1)"]
        PrePost["Pre-Flood vs Crisis SAR Pair"]
        LeeFilter["Speckle Noise Reduction"]
        Otsu["Otsu Bimodal Inundation Cutoff (-15.2 dB)"]
        JRCMask["Permanent Water Mask Exclusion"]
        FloodVectors["Flood Inundation Polygons (642.8 km²)"]
    end

    subgraph SpatialAnalysis ["3. Impact & Infrastructure Engine (Stages 5.3 & 5.4)"]
        TeraiCities["21 Terai District Hubs + Color Points"]
        VillageDir["Wards & Villages Inundation Directory"]
        RoadCutoffs["Highway & Road Inundation (Mahendra/Postal)"]
        BridgeMonitor["Critical Bridge Vulnerability"]
    end

    subgraph IntelligenceLayer ["4. AI & Humanitarian Logistics (Stages 5.5, 5.6, 5.7)"]
        GeminiPop["Gemini Demographics & Hospital Intelligence"]
        Routing["Emergency Convoy & Civilian Route Navigator"]
        SafeHaven["Refugee Camp Safe Ground Detector"]
    end

    subgraph UserInterface ["5. Decision Command Console"]
        Dashboard["Executive Command Dashboard"]
        Slider["Before/After Satellite Swipe Slider"]
        MapViewer["Google Maps & Leaflet Interactive Viewers"]
        ModalInspector["City & Village Interactive Dossier Modal"]
        PDFGen["Official Government SitRep PDF Export (Stage 5.8)"]
    end

    S1 --> GEE --> PrePost --> LeeFilter --> Otsu --> JRCMask --> FloodVectors
    FloodVectors --> VillageDir
    FloodVectors --> RoadCutoffs
    OSM --> RoadCutoffs --> Routing
    GMaps --> MapViewer
    TeraiCities --> MapViewer
    VillageDir --> ModalInspector
    Gemini --> GeminiPop --> ModalInspector
    DHM --> Dashboard
    SafeHaven --> Routing
    RoadCutoffs --> Routing --> MapViewer
    Dashboard --> PDFGen
    ModalInspector --> PDFGen
```

---

## 4. Completed Stages Deep-Dive

### Stage 5.1: Satellite Before-After Comparison (GEE Sentinel-1 SAR) — Point 1 [DONE]
- **Files Implemented:**
  - `frontend/src/components/comparison/BeforeAfterSlider.tsx`
  - `frontend/src/components/modals/EarthEngineScriptModal.tsx`
  - `frontend/src/data/teraiCitiesData.ts`
- **Capabilities Delivered:**
  - Synchronized dual-pane swipe slider comparing baseline dry imagery vs peak flood radar imagery.
  - Copernicus Sentinel-1 C-band SAR processing: cloud, haze, and rain penetrating.
  - Otsu automated bimodal thresholding at `-15.2 dB`.
  - JRC permanent surface water exclusion mask.
  - Complete, exportable Google Earth Engine JavaScript and Python script generator.
- **Verification:** Unit tested in Vitest (`BeforeAfterSlider.test.tsx`), 0 TypeScript errors.

### Stage 5.2: Google Maps Platform Integration — Point 2 [DONE]
- **Files Implemented:**
  - `frontend/src/components/map/GoogleMapsViewer.tsx`
  - `frontend/src/pages/dashboard/ExecutiveDashboard.tsx`
  - `frontend/src/components/map/CityVillagesModal.tsx`
- **Capabilities Delivered:**
  - Google Maps JavaScript API v3 integration with API key (`AIzaSy...`).
  - Clamped camera bounds to southern Nepal Terai (Jhapa to Kanchanpur).
  - High-performance Leaflet fallback if API key quota limits or offline.
  - Basemap switchers: Hybrid, Satellite, Terrain, and Tactical Dark Mode.
  - Sovereign Nepal boundary and Terai plain boundary polylines.
  - 21 Terai district quick-jump selectors and river basin filter pills.
- **Verification:** Unit tested in Vitest (`GoogleMapsViewer.test.tsx`, `ExecutiveDashboard.test.tsx`), 0 build errors.

---

### Stage 5.3: Flood Extent & City/Village Inundation Overlay — Point 3 [COMPLETED & VERIFIED]
- **Objective:** Render accurate flood extent polygons directly onto the Google Map and connect them to every Terai city and village.
- **Completed Components & Deliverables:**
  - `teraiFloodCorridors.ts`: Delineated Sentinel-1 SAR flood corridors across all 11 major river basins (Saptakoshi, Bagmati/Lalbakeya, Keshalya, Narayani/Madi, West Rapti, Babai, Karnali Delta, Mahakali, Kamala, Tinau, Kankai) with water depth ranges (`1.2m – 3.2m`) and bimodal Otsu threshold `-15.2 dB`.
  - `GoogleMapsViewer.tsx`:
    - Illuminated vector flood polygons with hover glow and detailed interactive InfoWindows.
    - All 21 Terai district hubs rendered with color hazard points (Crimson, Orange, Cyan, Green).
    - Constituent village hazard markers with water depth tags (`2.4m`, `1.8m`) and nearest shelter directions.
    - Fast Village Navigator search bar and settlement hazard filter tabs (`All`, `🌊 Flooded Only`, `🛡️ Safe Only`).
    - Bi-directional pinpointing across Google Maps JS API v3 and high-speed Leaflet fallback.
- **Verification:** 15 unit tests passing in Vitest (`npm test -- --run`), 0 errors in Vite production build (`npm run build`).

---

## 5. Upcoming Stages Implementation Roadmap

### Stage 5.4: Road Network Inundation & Disruption Analysis — Point 4 [NEXT TO EXECUTE]
- **Objective:** Highlight which highways and feeder roads are cut off or submerged, pinpointing severe impact zones.
- **Key Deliverables:**
  1. **Primary Highway Spatial Network:**
     - **Mahendra Highway (H01 / East-West Highway):** Full vector polyline spanning Jhapa to Kanchanpur.
     - **Postal Highway (Hulaki Rajmarg):** Southern arterial corridor closest to the Indian border, highly vulnerable to embankment breaches.
     - **North-South Feeder Links:** Birgunj-Pathlaiya, Bhairahawa-Butwal, Nepalgunj-Kohalpur, Koshi Barrage-Dharan, Janakpur-Dhalkebar.
  2. **Dynamic Inundation Road Segmentation:**
     - Spatial intersection between Stage 5.3 flood polygons and road polylines.
     - Color-coded highway segments:
       - 🔴 **IMPASSABLE / SUBMERGED** (Water depth > 0.5m, heavy currents — light vehicles & trucks blocked).
       - 🟠 **RESTRICTED / HIGH CLEARANCE** (Water depth 0.2m – 0.5m — only 4x4 army trucks/tractors).
       - 🟢 **OPEN / DRY PASSABLE** (Clear transit route).
  3. **Bridge Vulnerability Status Monitor:**
     - Real-time monitoring indicators for critical river crossings:
       - Koshi Barrage (Sunsari/Saptari) — Sluice gate status & water discharge.
       - Bagmati Bridge (Karmaiya, Sarlahi/Rautahat).
       - Lalbakeya Embankment Bridge (Gaur, Rautahat).
       - Narayani Bridge (Narayangarh, Chitwan/Nawalpur).
       - Karnali Chisapani Bridge (Kailali/Bardiya).
  4. **High-Impact Isolation Heatmap:**
     - Highlights clusters where entire communities are cut off by road disruptions, calculating estimated isolation duration.

---

### Stage 5.5: AI Demographic & Healthcare Intelligence via Gemini API — Points 5 & 6
- **Objective:** Dynamically fetch and display population headcounts, vulnerable groups, and live hospital statuses for every Terai city, village, and town using the Gemini API.
- **Key Deliverables:**
  1. **Google Gemini API Integration:**
     - Backend microservice / frontend utility utilizing `GEMINI_API_KEY`.
     - Structured prompt schema instructing Gemini to act as a humanitarian intelligence researcher:
       - Extracts total population, female/male ratios, elderly (>60), infants (<5), pregnant women.
       - Lists all hospitals, primary health centers (PHCs), bed capacities, ICU/ventilator availability, snakebite antivenom stocks, and waterborne disease risks.
  2. **Settlement Dossier Section:**
     - Dedicated "Demographics & Hospital Intelligence" navigation tab.
     - Live search bar for all 21 districts and over 100 constituent villages.
     - Real-time data caching to minimize API latency and quota consumption.
  3. **Tap-to-Inspect Integration:**
     - Clicking any city or village pin on Google Maps or Leaflet displays the Gemini-enriched demographic & medical card directly in the popup drawer.

---

### Stage 5.6: Emergency Routing & Evacuation Navigator — Points 7 & 9
- **Objective:** Calculate safe routes for emergency relief delivery and civilian evacuation that strictly avoid submerged roads.
- **Key Deliverables:**
  1. **Relief & Medical Supply Convoy Router (Point 7):**
     - Calculates optimal path from regional emergency depots (e.g., Bharatpur Army Base, Nepalgunj Airport, Duhabi Warehouse) to isolated villages.
     - Strict avoidance cost penalty: submerged road segments are completely blocked from routing graph ($cost = \infty$).
     - Displays estimated transit time, required vehicle type (Army 6x6, boat convoy, tractor), and safe river bridge crossings.
  2. **Civilian Evacuation Alternate Route Navigator (Point 9):**
     - Provides clear, step-by-step alternate egress routes directing stranded villagers to the nearest designated high-ground refuge.
     - Alerts for hazard zones (e.g., *"Avoid Postal Highway km 42 due to 1.8m raging flood waters; divert via North Feeder Canal Rd"*).
  3. **Interactive Route Overlay on Google Maps:**
     - Rendered with luminous directional polylines (Cyan/Green for Safe Relief Route; Amber for Civilian Evacuation).
     - Turn-by-turn waypoint cues with elevation profiles.

---

### Stage 5.7: Safe Haven & Refugee Camp Proximity Detector — Point 8
- **Objective:** Automatically detect elevated, flood-resistant land near inundated zones suitable for setting up refugee camps and relief logistics.
- **Key Deliverables:**
  1. **Geospatial $k$-NN Proximity Engine:**
     - Scans a 3km to 15km radius around flooded settlement centroids to locate dry, elevated grounds.
  2. **Site Suitability Multi-Criteria Scoring:**
     - **Elevation:** High ridges, hillock foothills, or embankments (>150m ASL).
     - **Infrastructure:** Schools, colleges, stadiums, and government compounds with concrete roofing.
     - **Water & Sanitation:** Availability of functioning tube wells and dry sanitation grounds.
     - **Aviation Access:** Helicopter Landing Zones (HLZ) suitable for Nepal Army Mi-17 or Bell-206 helicopters.
  3. **Shelter Profile Cards:**
     - Maximum evacuee capacity (e.g., Barahachhetra Ridge: 8,500 people; Chandranigahapur Stadium: 6,200 people).
     - Direct contact coordinates for local shelter wardens (Armed Police Force / Nepal Red Cross).

---

### Stage 5.8: Official Government Situation Report (SitRep) PDF Export — Point 10
- **Objective:** Generate a comprehensive, executive disaster response PDF report for government ministers, army generals, and international relief agencies.
- **Key Deliverables:**
  1. **One-Click Export Action:**
     - Prominent "📥 Export Official SitRep (PDF)" button in the top navigation bar and executive dashboard.
  2. **Standardized NDRRMA / UN-SPIDER SitRep Template:**
     - **Section 1: Executive Overview:** National Disaster Alert Level (Red/Amber), affected population headcount, confirmed casualties, missing persons.
     - **Section 2: Satellite Radar Deluge Quantification:** Total km² flooded per district, percentage of agricultural paddy destroyed, water recession rate.
     - **Section 3: Transportation & Infrastructure Disruptions:** Cut-off highways, damaged bridges, isolated ward numbers.
     - **Section 4: Medical Triage & Hospital Readiness:** Submerged health posts, bed availability, urgent medical supply shortages (IV fluids, antivenom, water purification tablets).
     - **Section 5: Recommended Action Directives:** Armed Police Force (APF) and Nepal Army rescue boat deployment coordinates, air-drop drop zones, relief warehouse dispatch priorities.
  3. **High-Resolution Embedded Map Snapshot:**
     - Renders a crisp vector/canvas capture of the flooded Terai region directly onto Page 2 of the PDF.

---

### Stage 5.9: Real-Time River Gauge Telemetry & Vernacular SOS Alerts — Point 11 (Innovation)
- **Objective:** Proactive early warning and automated vernacular emergency broadcasts.
- **Key Deliverables:**
  1. **Nepal DHM Real-Time River Telemetry:**
     - Live water level status for primary Terai rivers: Koshi (Chatara), Bagmati (Karmaiya/Pandhredovan), Narayani (Devghat/Narayangarh), West Rapti (Kusum), Karnali (Chisapani), Babai (Chepang), and Kamala (Ranibas).
     - Visual water gauge bars displaying: Normal Level, Warning Level, and Danger/Evacuation Level.
  2. **Vernacular Nepali SOS Alert Generator:**
     - One-click copy/broadcast for Nepali SMS & WhatsApp alerts:
       > *"🚨 बाढी संकटकालीन सूचना (बाढी गार्ड एआई): नारायणी नदीले खतराको विन्दु (८.४ मिटर) पार गरेको छ। नवलपुर र चितवनका तटीय बासिन्दाहरू तुरुन्त तोकिएको उच्च आश्रयस्थल (कावासोती उच्च मावि) तर्फ लाग्नुहोस्।"*
  3. **Bilingual Switcher:**
     - Complete interface switch between English and Nepali (`नेपाली`).

---

## 6. Technology Stack & API Credentials

| Subsystem | Technology | Configuration / Credentials |
|:---|:---|:---|
| **Frontend Framework** | React 19 + TypeScript + Vite | Clean ESM, zero compilation errors, responsive dark mode |
| **Mapping Engines** | Google Maps JavaScript API v3 & React-Leaflet | API Key: `AIzaSyCYKKkl1C613n508xjv25SNSDFKO9Og0rw` |
| **Earth Observation** | Copernicus Sentinel-1 C-SAR & GEE | Google Earth Engine Python/JS API (`ee.ImageCollection`) |
| **Artificial Intelligence**| Google Gemini 1.5 Pro / Flash | Configured via `GEMINI_API_KEY` (demographics & hospital triage) |
| **Geospatial Processing** | Turf.js & GeoPandas / Shapely | Spatial polygon intersection, road clipping, $k$-NN proximity |
| **Report Generation** | jsPDF & html2canvas | Vector PDF styling, multi-page layout, executive typography |
| **Styling & Icons** | Custom Vanilla CSS + Lucide React | Emergency Command Dark Theme, glassmorphism, responsive |

---

## 7. Governance, Testing & Verification Protocols

1. **Git Protection Rule:** 
   - **NEVER execute `git push` or modify remote repositories.** The user personally inspects, adds, commits, and pushes all code (`git add`, `git commit`, `git push origin main`).
2. **Geographic Integrity:** 
   - Strict Nepal Terai isolation (Lat `26.20°N – 28.35°N`). No Himalayan mountains or outside regions.
3. **Automated Continuous Verification:**
   - Run Vitest after every stage: `npm test -- --run`
   - Run TypeScript & Vite production build: `npm run build`
   - Both must succeed with **0 errors** before any stage is considered complete.
4. **Zero Authentication Friction:**
   - Public/Officer immediate access — no login walls or blockers to hinder emergency disaster response.

---
*FloodGuard AI Master Plan &bull; Version 1.1.0 &bull; Preserved in Project Repository &bull; Certified for Stage Execution*
