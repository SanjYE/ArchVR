import cv2
import numpy as np
import ezdxf
from sklearn.cluster import KMeans
import sys

def convert_image_to_dxf(input_image_path, output_path):
    # ---- params you can tweak ----
    scale_percent = 50
    num_colors = 5
    walls_k = 1  # how many darkest clusters count as WALLS

    # ---- load & resize ----
    img = cv2.imread(input_image_path)
    if img is None:
        raise ValueError(f"Could not read image: {input_image_path}")
    
    width = int(img.shape[1] * scale_percent / 100)
    height = int(img.shape[0] * scale_percent / 100)
    resized_img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)

    # ---- KMeans (unchanged) ----
    pixels = resized_img.reshape((-1, 3)).astype(np.float32)
    kmeans = KMeans(n_clusters=num_colors, random_state=0, n_init=10)
    labels = kmeans.fit_predict(pixels)
    clustered_img = kmeans.cluster_centers_[labels].reshape(resized_img.shape).astype(np.uint8)

    # ---- brightness (HSV-V) per cluster ----
    hsv_img = cv2.cvtColor(clustered_img, cv2.COLOR_BGR2HSV)
    label_map = labels.reshape(resized_img.shape[:2])

    avg_v_per_label = []
    for lab in range(num_colors):
        mask_bool = (label_map == lab)
        avg_v = float(np.mean(hsv_img[..., 2][mask_bool])) if np.any(mask_bool) else 255.0
        avg_v_per_label.append((lab, avg_v))

    avg_v_per_label.sort(key=lambda x: x[1])  # darkest first
    wall_labels = set([lab for lab, _ in avg_v_per_label[:walls_k]])

    # ---- DXF setup (minimal changes) ----
    doc = ezdxf.new(setup=True)  # ensure tables/linetypes present
    doc.header['$LWDISPLAY'] = 1  # show lineweights in CAD viewers

    # add layers explicitly
    if "WALLS" not in doc.layers:
        doc.layers.new("WALLS", dxfattribs=dict(color=7, lineweight=70))      # 0.70 mm
    if "INTERIOR" not in doc.layers:
        doc.layers.new("INTERIOR", dxfattribs=dict(color=8, lineweight=15))   # 0.15 mm

    msp = doc.modelspace()

    # ---- contours (same flow; assign to layer) ----
    unique_labels = np.unique(label_map)
    for label in unique_labels:
        mask = (label_map == label).astype(np.uint8) * 255
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            points = [tuple(pt[0]) for pt in contour]
            if len(points) > 2:
                layer_name = "WALLS" if label in wall_labels else "INTERIOR"
                e = msp.add_lwpolyline(points, close=True, dxfattribs={"layer": layer_name})
                # redundant but safe on some viewers/versions:
                e.dxf.layer = layer_name

    doc.saveas(output_path)
    print(f"DXF file saved at {output_path}")
    print("Wall clusters (darkest first):", [lab for lab, _ in avg_v_per_label[:walls_k]])

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python img_dxf2.py <input_image> <output_dxf>")
        sys.exit(1)
    
    input_image = sys.argv[1]
    output_dxf = sys.argv[2]
    
    try:
        convert_image_to_dxf(input_image, output_dxf)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)