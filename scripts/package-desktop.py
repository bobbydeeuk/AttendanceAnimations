"""Optional desktop download package. Run after npm run build."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
instructions = """ATTENDANCE ANIMATIONS — DESKTOP APP

1. Extract this ZIP into a folder on your desktop computer.
2. Open Administrator/attendance-animations.html in Chrome or Microsoft Edge.
   If needed, right-click the file and choose Open with > your browser.
3. Choose a year group to try the demo presentation.
4. Use the settings cog to set your password and import attendance data.
5. Export your updated administrator master and a separate staff presentation.

Staff/attendance-animations.html is a presentation-only DEMO copy.
After importing real attendance data, distribute your new staff export instead.

The HTML files work offline. Do not open them in a chat attachment preview,
Teams preview, text editor or file viewer. Such viewers may disable JavaScript.
The app now shows instructions rather than an empty screen in those viewers.

Keep your administrator master private. Student names are not stored in exports.
See the repository README for the full workflow:
https://github.com/bobbydeeuk/AttendanceAnimations
"""
with ZipFile(root / "dist/AttendanceAnimations-desktop.zip", "w", ZIP_DEFLATED) as archive:
    archive.write(root / "dist/attendance-animations.html", "Administrator/attendance-animations.html")
    archive.write(root / "dist/presentation/attendance-animations.html", "Staff/attendance-animations.html")
    archive.writestr("START-HERE.txt", instructions)
    for path in sorted((root / "docs/licenses").glob("*.txt")):
        archive.write(path, "Licenses/" + path.name)
    archive.write(root / "docs/Plus-Jakarta-Sans-LICENSE.txt", "Licenses/Plus-Jakarta-Sans-LICENSE.txt")
print("Created dist/AttendanceAnimations-desktop.zip")
