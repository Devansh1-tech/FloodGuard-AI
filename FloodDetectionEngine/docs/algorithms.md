# FloodGuard-AI — Remote Sensing & Algorithmic Foundations

This document provides a comprehensive, mathematically rigorous explanation of the remote sensing physics, signal processing algorithms, and geospatial mathematics implemented in the `FloodDetectionEngine`.

---

## Table of Contents

1. [Synthetic Aperture Radar (SAR) Principles & Backscatter Physics](#1-synthetic-aperture-radar-sar-principles--backscatter-physics)
2. [Border Noise Removal & Radiometric Normalization](#2-border-noise-removal--radiometric-normalization)
3. [Speckle Filtering: Refined Lee vs. Mean Filter](#3-speckle-filtering-refined-lee-vs-mean-filter)
4. [SAR Change Detection Mathematics](#4-sar-change-detection-mathematics)
5. [Automatic Otsu Thresholding Derivation](#5-automatic-otsu-thresholding-derivation)
6. [Mathematical Morphology & Noise Cleaning](#6-mathematical-morphology--noise-cleaning)
7. [Vectorization & Geodesic Metric Computations](#7-vectorization--geodesic-metric-computations)

---

## 1. Synthetic Aperture Radar (SAR) Principles & Backscatter Physics

### 1.1 Why SAR for Flood Mapping?
Optical sensors (e.g., Sentinel-2, Landsat) cannot penetrate cloud cover, heavy rainfall, or operate during nighttime. Because extreme monsoon floods in the Nepal Terai occur during dense tropical cloud systems, optical imagery is rendered ineffective during critical crisis response windows.

Sentinel-1 operates a **C-band Synthetic Aperture Radar** ($\lambda \approx 5.546\text{ cm}$, frequency $\approx 5.405\text{ GHz}$). At this microwave frequency, radiation penetrates clouds, rain, haze, and atmospheric aerosols without significant attenuation, allowing 24/7 all-weather day-and-night observation.

### 1.2 Scattering Mechanisms
When microwave pulses encounter the Earth's surface, the backscattered intensity ($\sigma^0$) is determined by the surface roughness, dielectric constant ($\epsilon$), and local incidence angle:

1. **Specular Reflection (Open Water & Inundation):**
   Smooth water surfaces act as specular reflectors (Fresnel mirrors). When incident radar waves hit smooth standing water, almost all energy is reflected away from the sensor according to Snell's law ($\theta_r = \theta_i$). Consequently, the backscatter returned to the radar antenna is extremely low:
   $$\sigma^0_{\text{water}} \approx -22\text{ dB to } -16\text{ dB}$$

2. **Diffuse Scattering (Rough Bare Soil & Low Vegetation):**
   Surfaces with surface roughness comparable to the radar wavelength scatter energy isotropically in all directions. A moderate portion returns to the antenna:
   $$\sigma^0_{\text{soil/vegetation}} \approx -14\text{ dB to } -8\text{ dB}$$

3. **Double-Bounce Scattering (Urban Structures & Partially Submerged Stems):**
   Right angles formed by building walls and ground/water act as corner reflectors, bouncing energy twice and directing high intensity back to the sensor:
   $$\sigma^0_{\text{urban}} \approx -6\text{ dB to } +3\text{ dB}$$

### 1.3 Backscatter in Decibels (dB)
Raw radar intensity ($I$) spans multiple orders of magnitude. The backscatter coefficient $\sigma^0$ is represented on a logarithmic decibel scale:
$$\sigma^0_{\text{dB}} = 10 \cdot \log_{10}(\sigma^0_{\text{linear}})$$

A flood event causes a drastic drop in $\sigma^0$ from the pre-event level ($\sim -11\text{ dB}$) to post-event specular reflection ($\sim -20\text{ dB}$), yielding a characteristic drop of $\Delta \sigma^0 \ge 6\text{ dB}$ to $10\text{ dB}$.

---

## 2. Border Noise Removal & Radiometric Normalization

### 2.1 Border Noise Removal
Sentinel-1 Level-1 Ground Range Detected (GRD) products suffer from low-intensity border noise along the edges of the swath where azimuth and range compression filters exhibit edge effects. 

The `Preprocessor` applies:
1. Clipping to the exact valid AOI geometry.
2. Filtering out values below the instrument noise floor:
   $$\text{Mask}_{\text{valid}} = \sigma^0_{\text{VV}} > -30\text{ dB}$$
3. Eliminating anomalous high-intensity edge pixels caused by incomplete azimuth antenna pattern correction.

---

## 3. Speckle Filtering: Refined Lee vs. Mean Filter

### 3.1 Multiplicative Speckle Model
Radar imagery is fundamentally corrupted by **speckle**, a granular interference pattern resulting from coherent constructive and destructive interference of dephased backscatter waves within a resolution cell.

Speckle is strictly **multiplicative** (not additive):
$$I(x, y) = R(x, y) \cdot u(x, y)$$
where:
- $I(x, y)$ is the observed intensity.
- $R(x, y)$ is the true radar reflectivity (terrain backscatter).
- $u(x, y)$ is the speckle noise with mean $E[u] = 1$ and variance $\sigma_u^2 = \frac{1}{N_{\text{looks}}}$.

For Sentinel-1 IW GRD ($N_{\text{looks}} \approx 4.4$), $\sigma_u \approx 0.47$.

### 3.2 Why Simple Mean Filter (Boxcar) Fails
A simple moving-average / boxcar mean filter ($focal\_mean$) calculates:
$$\hat{R}(x, y) = \frac{1}{|W|} \sum_{(i,j) \in W} I(i, j)$$
**Fatal Flaws of the Mean Filter in Flood Mapping:**
1. **Severe Edge Blurring:** Averaging across sharp water-land boundaries smears the transition across multiple pixels ($30\text{ m} - 70\text{ m}$), falsely shifting the flood shoreline.
2. **Loss of Fine Linear Features:** Narrow flood channels, canals, levees, and embankments are completely obliterated.
3. **Point Target Suppression:** High-backscatter structures (e.g., isolated dwellings on elevated mounds) are diluted into surrounding floodwater.

### 3.3 The Refined Lee Filter (J.S. Lee, 1981)
The **Refined Lee filter** is an adaptive, edge-preserving spatial filter designed specifically for multiplicative noise. Rather than filtering across the entire window, it detects local gradients and selects one of **8 directional sub-windows** aligned with existing edges.

#### Step 1: Local Gradient & Sub-Window Selection
A $7 \times 7$ window is divided into 8 directional masks (Horizontal, Vertical, 45° Diagonal, 135° Diagonal, and nonsymmetrical variants). The algorithm computes the directional gradient across opposing sub-windows:
$$k^* = \arg\min_k \text{Var}(W_k)$$
The sub-window $W_{k^*}$ that exhibits the lowest variance is chosen because it lies entirely on one side of the edge and does not cross the boundary.

#### Step 2: Adaptive Weighting (Minimum Mean Square Error)
Within the selected sub-window, local mean $\bar{x}$ and local variance $var(x)$ are computed. The filter weight $W$ is:
$$W = 1 - \frac{C_u^2}{C_x^2}$$
where:
$$C_u = \frac{\sigma_u}{\mu_u} = \frac{1}{\sqrt{N_{\text{looks}}}}, \quad C_x = \frac{\sqrt{var(x)}}{\bar{x}}$$

The filtered estimate is:
$$\hat{R} = \bar{x} + W \cdot (I - \bar{x})$$

#### Behavior Analysis:
- In **homogeneous areas** ($var(x) \to \sigma_u^2 \bar{x}^2 \implies C_x \approx C_u$):
  $$W \to 0 \implies \hat{R} \to \bar{x}$$
  Maximum smoothing is applied to eliminate speckle.
- Along **sharp edges** ($var(x) \gg \sigma_u^2 \bar{x}^2 \implies C_x \gg C_u$):
  $$W \to 1 \implies \hat{R} \to I$$
  Filtering stops; the sharp boundary is preserved with zero edge displacement.

---

## 4. SAR Change Detection Mathematics

Given preprocessed pre-event image $I_{\text{before}}$ and post-event image $I_{\text{after}}$ in dB:

### 4.1 Simple Difference
$$D(x, y) = I_{\text{after}}(x, y) - I_{\text{before}}(x, y)$$
- **Limitation:** In dB scale, $-10\text{ dB} - (-5\text{ dB}) = -5\text{ dB}$, while $-25\text{ dB} - (-20\text{ dB}) = -5\text{ dB}$. In linear intensity, the first represents a massive drop of $0.21$, while the second is an imperceptible change of $0.007$. Simple difference lacks radiometric normalization.

### 4.2 Linear Ratio
$$R(x, y) = \frac{I_{\text{before\_lin}}(x, y)}{I_{\text{after\_lin}}(x, y)}$$
- **Limitation:** Strongly right-skewed; ratios range from $0$ to $+\infty$, making standard Gaussian-assumption thresholding unsuitable.

### 4.3 Scaled Log-Ratio (Recommended & Implemented)
$$LR(x, y) = \text{scale} \cdot \log_{10}\left(\frac{I_{\text{before\_lin}}(x, y)}{I_{\text{after\_lin}}(x, y)}\right)$$

Because $I_{\text{dB}} = 10 \cdot \log_{10}(I_{\text{lin}})$, substituting yields:
$$LR(x, y) = I_{\text{before}}^{(\text{dB})}(x, y) - I_{\text{after}}^{(\text{dB})}(x, y)$$

#### Mathematical Advantages:
1. **Transforms Multiplicative Speckle to Additive Noise:**
   $$\log(I) = \log(R \cdot u) = \log(R) + \log(u)$$
2. **Symmetric Distribution:** Unchanged background pixels center symmetrically around $0$. Flooded pixels form a distinct, well-separated positive secondary peak ($LR > 0$).
3. **Direct Physical Interpretation:** A value of $+6.0\text{ dB}$ corresponds to an exact 4-fold decrease in linear radar reflectivity.

---

## 5. Automatic Otsu Thresholding Derivation

Otsu's method (Otsu, 1979) selects the global optimal threshold $t^*$ directly from the gray-level histogram without subjective human tuning.

### 5.1 Formulation
Let the change image pixels be categorized into $L$ discrete bins $\{0, 1, \dots, L-1\}$ with total pixel count $N$:
$$p_i = \frac{n_i}{N}, \quad \sum_{i=0}^{L-1} p_i = 1$$

Pixels are partitioned into two classes by threshold $t$:
- **Class $C_0$ (Unchanged / Background):** bins $[0, \dots, t]$
- **Class $C_1$ (Inundated / Flood):** bins $[t+1, \dots, L-1]$

The cumulative class probabilities (zeroth-order cumulative moments) are:
$$\omega_0(t) = \sum_{i=0}^{t} p_i, \quad \omega_1(t) = \sum_{i=t+1}^{L-1} p_i = 1 - \omega_0(t)$$

The class means (first-order cumulative moments) are:
$$\mu_0(t) = \sum_{i=0}^{t} \frac{i \cdot p_i}{\omega_0(t)}, \quad \mu_1(t) = \sum_{i=t+1}^{L-1} \frac{i \cdot p_i}{\omega_1(t)}$$

The total mean $\mu_T$ across the entire image is:
$$\mu_T = \sum_{i=0}^{L-1} i \cdot p_i = \omega_0(t) \mu_0(t) + \omega_1(t) \mu_1(t)$$

### 5.2 Between-Class Variance Maximization
The between-class variance $\sigma_B^2(t)$ measures the separation between the background and flood classes:
$$\sigma_B^2(t) = \omega_0(t) [\mu_0(t) - \mu_T]^2 + \omega_1(t) [\mu_1(t) - \mu_T]^2$$

Algebraic simplification yields:
$$\sigma_B^2(t) = \omega_0(t) \omega_1(t) [\mu_0(t) - \mu_1(t)]^2 = \frac{[\mu_T \omega_0(t) - \mu(t)]^2}{\omega_0(t)(1 - \omega_0(t))}$$
where $\mu(t) = \sum_{i=0}^{t} i \cdot p_i$.

The optimal threshold $t^*$ maximizes the between-class variance:
$$t^* = \arg\max_{0 \le t < L-1} \sigma_B^2(t)$$

### 5.3 Server-Side Earth Engine Implementation
Instead of downloading millions of pixels to a local machine to calculate the threshold, `FloodDetectionEngine.detection.otsu` computes the 256-bin histogram server-side using `ee.Reducer.histogram()`. It extracts cumulative sums, means, and variances using vectorized `ee.Array` operations and extracts $t^*$ using `arrayArgmax()`:

$$\text{FloodMask}(x, y) = \begin{cases} 1 & \text{if } LR(x, y) \ge t^* \\ 0 & \text{otherwise} \end{cases}$$

---

## 6. Mathematical Morphology & Noise Cleaning

The raw binary mask from Otsu thresholding contains salt-and-pepper noise from residual radar speckle, wind-roughened open water patches, and small dry islands. This is rectified via mathematical morphology.

Let $A$ be the binary flood mask and $B$ a flat circular structuring element (disk kernel) of radius $r$:

### 6.1 Erosion ($\ominus$)
Shrinks foreground features; eliminates features smaller than kernel $B$:
$$A \ominus B = \{z \in \mathbb{Z}^2 \mid B_z \subseteq A\}$$

### 6.2 Dilation ($\oplus$)
Expands foreground features; fills small internal holes:
$$A \oplus B = \{z \in \mathbb{Z}^2 \mid (B^s)_z \cap A \neq \emptyset\}$$

### 6.3 Morphological Opening ($\circ$)
Erosion followed by dilation:
$$A \circ B = (A \ominus B) \oplus B$$
**Purpose:** Disconnects thin falsely detected bridges and eliminates isolated false-positive pixels without altering the geometric size of large flood bodies.

### 6.4 Morphological Closing ($\bullet$)
Dilation followed by erosion:
$$A \bullet B = (A \oplus B) \ominus B$$
**Purpose:** Fills small interior voids (missed flood pixels caused by localized surface roughness or emergent vegetation) and smooths ragged outer perimeters.

### 6.5 Connected Component Filtering & Minimum Mapping Unit (MMU)
Let $C_k \subset A$ denote the $k$-th 8-connected component:
$$A_{\text{clean}} = \bigcup \{C_k \mid \text{Area}(C_k) \ge \text{MMU}\}$$

By default, $\text{MMU} = 8\text{ pixels}$. At $10\text{ m}$ spatial resolution ($1\text{ pixel} = 100\text{ m}^2$):
$$\text{MMU}_{\text{metric}} = 8 \times 100\text{ m}^2 = 800\text{ m}^2 = 0.08\text{ ha}$$
Any isolated cluster smaller than $800\text{ m}^2$ is discarded as radar clutter.

---

## 7. Vectorization & Geodesic Metric Computations

### 7.1 Raster-to-Polygon Vectorization
Contiguous clusters of pixels with value $1$ are vectorized into polygon rings using topological boundary traversal (topological contour tracing via `rasterio.features.shapes` with 8-way connectivity).

### 7.2 Geodesic Metric Calculations
Because WGS84 geographic coordinates (longitude, latitude in degrees) distort area and length drastically away from the equator:
$$1^\circ \text{ Longitude at } 27^\circ\text{N} \approx 111.32 \cdot \cos(27^\circ) \approx 99.19\text{ km}$$
Computing Euclidean geometry directly in degrees produces errors exceeding $20\%$.

#### Auto-UTM Projection
The engine automatically detects the optimal Universal Transverse Mercator (UTM) projection from the centroid longitude $\lambda_c$:
$$\text{Zone} = \left\lfloor \frac{\lambda_c + 180^\circ}{6} \right\rfloor + 1$$
For Nepal Terai ($\lambda_c \approx 87^\circ\text{E}$):
$$\text{Zone} = \left\lfloor \frac{87 + 180}{6} \right\rfloor + 1 = 45\text{N} \implies \text{EPSG:32645}$$

#### Exact Metric Integration
All polygon vertices are reprojected to UTM (meters) via PyProj.
The planar area is computed via the Shoelace formula on projected coordinates $(x_i, y_i)$:
$$\text{Area}_{\text{km}^2} = \frac{1}{2 \times 10^6} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$

The perimeter is computed as:
$$\text{Perimeter}_{\text{km}} = \frac{1}{10^3} \sum_{i=0}^{n-1} \sqrt{(x_{i+1} - x_i)^2 + (y_{i+1} - y_i)^2}$$

This ensures that all outputs in `statistics.json`, `FloodPolygon.geojson`, and `FloodPolygon.shp` provide sub-meter accurate physical measurements for impact assessments.
