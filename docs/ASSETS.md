# Asset provenance and licenses

## 3D Models

- File: `public/models/male-base-mesh.glb`
- Size: 4498248 bytes (~4.5 MB)
- Source: https://innerscene.com
- Author: Innerscene Corp
- License: CC0 1.0 Universal (Public Domain Dedication)
- Credit required: None ("Free to use, modify and redistribute for any purpose, with no credit required")
- Status: VERIFIED - CC0 1.0 Universal
- How it was inspected:
  - Git history: added in commit `3e0883367ca858858cf1da17c9ef755c0a10cf7c` by Alister82 with commit message `"Use detailed anatomical mesh in body hologram"`.
  - Binary inspection: GLB v2 header JSON chunk inspected at byte offset 20. The `asset` object explicitly contains:
    ```json
    {
      "asset": {
        "generator": "Khronos glTF Blender I/O v5.2.40",
        "version": "2.0",
        "copyright": "Authored by Innerscene Corp (innerscene.com). Public domain: dedicated under CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/. Free to use, modify and redistribute for any purpose, with no credit required."
      }
    }
    ```

