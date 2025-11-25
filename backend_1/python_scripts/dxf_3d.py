import ezdxf
import trimesh
import numpy as np
import sys

WALL_HEIGHT = 23
INTERIOR_HEIGHT = 5.0

def extract_polylines_by_layer(dxf_file):

    doc = ezdxf.readfile(dxf_file)
    msp = doc.modelspace()

    walls, interior = [], []
    for e in msp.query('LWPOLYLINE'):
        pts = [(p[0], p[1]) for p in e.get_points()]
        if len(pts) < 3:
            continue
        if (e.dxf.layer or "").upper() == "WALLS":
            walls.append(pts)
        else:
            interior.append(pts)
    return walls, interior

def extrude_polygons_to_3d(polylines, height=3.0):
    
    extruded_meshes = []
    for polyline in polylines:
        if len(polyline) < 3:
            continue
        bottom = np.array(polyline + [polyline[0]], dtype=float)
        bottom = np.hstack([bottom, np.zeros((bottom.shape[0], 1))])  # z=0
        top = bottom + np.array([0, 0, height], dtype=float)

        faces = []
        for i in range(len(bottom) - 1):
            faces.append([i, i+1, len(bottom) + i])
            faces.append([len(bottom) + i, i+1, len(bottom) + i + 1])

        vertices = np.vstack([bottom, top])
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
        extruded_meshes.append(mesh)

    return trimesh.util.concatenate(extruded_meshes) if extruded_meshes else None

def convert_dxf_to_stl(input_dxf_path, output_stl_path):
    walls_polys, interior_polys = extract_polylines_by_layer(input_dxf_path)

    meshes = []
    if interior_polys:
        m_int = extrude_polygons_to_3d(interior_polys, height=INTERIOR_HEIGHT)
        if m_int is not None:
            meshes.append(m_int)
    if walls_polys:
        m_wall = extrude_polygons_to_3d(walls_polys, height=WALL_HEIGHT)
        if m_wall is not None:
            meshes.append(m_wall)

    if not meshes:
        raise ValueError("No valid polygons found in DXF file.")

    mesh = trimesh.util.concatenate(meshes)
    mesh.export(output_stl_path)
    print(f"3D model saved as {output_stl_path}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python dxf_3d.py <input_dxf> <output_stl>")
        sys.exit(1)
    
    input_dxf = sys.argv[1]
    output_stl = sys.argv[2]
    
    try:
        convert_dxf_to_stl(input_dxf, output_stl)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)