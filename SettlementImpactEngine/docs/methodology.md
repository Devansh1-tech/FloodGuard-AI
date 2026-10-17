# SettlementImpactEngine — Geospatial Methodology & Mathematics

## 1. Coordinate Systems & Planar Metric Accuracy

Disaster damage assessments must calculate physical surface areas ($km^2$, $m^2$) and linear distances ($km$, $m$) with sub-meter precision. Computing areas directly on unprojected geographic coordinates (WGS 84 / `EPSG:4326`) introduces severe spherical distortion in Nepal (where $1^\circ$ longitude $\approx 99.4\text{ km}$, while $1^\circ$ latitude $\approx 110.8\text{ km}$).

### Projection Strategy
- **Display & Interchange**: WGS 84 (`EPSG:4326`) for GeoJSON and Web Maps.
- **Metric Analytics**: UTM Zone 45N (`EPSG:32645`) for Central and Eastern Nepal (Koshi, Madhesh, Bagmati, Gandaki). Automatically shifts to UTM Zone 44N (`EPSG:32644`) if bounding longitudes lie west of $84^\circ\text{ E}$.

$$\text{Area}_{\text{km}^2} = \frac{\iint_{\mathcal{P}_{\text{UTM}}} dx\,dy}{10^6}, \quad \text{Length}_{\text{km}} = \frac{\int_{\mathcal{L}_{\text{UTM}}} ds}{10^3}$$

---

## 2. Preventing Double-Counting via Flood Footprint Dissolution

When multiple satellite scenes or overlapping Otsu detection tiles generate adjacent flood polygons, simple spatial intersections can count buildings, roads, or population multiple times.

The engine executes a **topological union** ($\bigcup \mathcal{F}_i$) prior to overlay:
$$\mathcal{F}_{\text{dissolved}} = \operatorname{make\_valid}\left(\bigcup_{i=1}^n \mathcal{F}_i\right)$$

All intersection operations (with administrative boundaries, roads, and buildings) operate strictly against $\mathcal{F}_{\text{dissolved}}$.

---

## 3. Proportional Human Exposure Estimation

When gridded population cells (from WorldPop or Census enumeration blocks) partially intersect the flood polygon, assigning 100% of the cell population to the flood would drastically overestimate casualties.

The engine uses **area-weighted areal interpolation**:
$$\text{Exposed Population}_j = P_j \times \min\left(1.0, \frac{\operatorname{Area}(\mathcal{C}_j \cap \mathcal{F})}{\operatorname{Area}(\mathcal{C}_j)}\right)$$

Where $P_j$ is the total population in cell $\mathcal{C}_j$, and $\operatorname{Area}(\cdot)$ is measured in planar UTM square meters.

### Vulnerability Stratification (Nepal Census Terai Demographic Ratios)
- **Displaced Households**: $\displaystyle \text{HH} = \frac{\text{Exposed Population}}{4.6}$ (average household size: 4.6 persons)
- **Children Under 5**: $11.5\%$ of exposed population
- **Elderly (65+)**: $7.0\%$ of exposed population
- **Female Population**: $51.5\%$ of exposed population

---

## 4. Road Network Topology & Graph Severance

### Graph Formulation
The transportation network is modeled as an undirected weighted multigraph $G = (V, E, W)$:
- **Vertices $V$**: Road intersections and dead-ends, snapped to nearest 1.0 m planar coordinates.
- **Edges $E$**: Road line segments connecting vertices $(u, v)$.
- **Weights $W$**: Segment length in meters, annotated with highway class and bridge flag.

### Severance Analysis
Flooded road segments $E_{\text{submerged}} \subset E$ are pruned from the network to construct the post-disaster topology $G_{\text{post}} = (V, E \setminus E_{\text{submerged}})$.

1. **Connected Components**: The number of isolated connected components $k(G)$ is computed using Tarjan's algorithm.
2. **Fragmentation Ratio**:
   $$\Phi = \frac{k(G_{\text{post}})}{\max(1, k(G_{\text{base}}))}$$
   If $\Phi > 1.0$, the flood has fractured the transport network into isolated road islands.
3. **Settlement Reachability**: For each settlement vertex $s \in V$, a shortest-path existence check is evaluated against the set of operational emergency hubs $H_{\text{safe}} \subset V$:
   $$\operatorname{Reachable}(s) = \exists h \in H_{\text{safe}} \text{ such that } \operatorname{path}(s, h) \in G_{\text{post}}$$
   Settlements where $\operatorname{Reachable}(s) = \text{False}$ are immediately tagged as **ISOLATED (Requiring Air/Boat Evacuation)**.

---

## 5. Nearest Safe Facility Proximity Search

For every submerged facility or affected village, the engine performs a high-speed metric 2D nearest-neighbor search against the subset of strictly **operational** facilities using Shapely's `STRtree` spatial index:
$$\operatorname{dist}_{\text{nearest}}(x) = \min_{y \in \mathcal{F}_{\text{operational}}} \|x - y\|_{\text{UTM}}$$
This enables automated emergency dispatch routing to alternate clinics, hospitals, and relief camps.

---

## 6. Multi-Criteria Disaster Severity Index (DSI)

To support rapid resource allocation by disaster authorities, the engine derives a composite index ($0.0 \le \text{DSI} \le 100.0$) for each municipality:

$$\text{DSI} = w_{\text{pop}} S_{\text{pop}} + w_{\text{area}} S_{\text{area}} + w_{\text{infra}} S_{\text{infra}} + w_{\text{trans}} S_{\text{trans}}$$

| Dimension | Weight | Formulation |
| :--- | :---: | :--- |
| **Population Exposure** ($S_{\text{pop}}$) | $0.35$ | Normalized affected population vs. maximum affected municipality. |
| **Physical Inundation** ($S_{\text{area}}$) | $0.25$ | $\min(100.0, \text{Flood Percentage} \times 2.5)$ (40% flood = 100 score). |
| **Infrastructure Loss** ($S_{\text{infra}}$) | $0.20$ | Normalized count of submerged hospitals, schools, and police posts. |
| **Transport Severance** ($S_{\text{trans}}$) | $0.20$ | Normalized submerged road kilometers within the municipality. |

### Intervention Tiers
- **Tier 1 (DSI $\ge 65.0$)**: **CRITICAL** — Immediate deployment of search-and-rescue teams, air relief, and emergency field hospitals.
- **Tier 2 ($40.0 \le \text{DSI} < 65.0$)**: **HIGH** — Urgent overland relief supply, water purification, and temporary shelters.
- **Tier 3 ($20.0 \le \text{DSI} < 40.0$)**: **MODERATE** — Medical surveillance, logistics monitoring, and road clearing.
- **Tier 4 ($\text{DSI} < 20.0$)**: **LOW** — Localized advisories and post-flood rehabilitation.
