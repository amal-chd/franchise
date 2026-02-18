import shutil
import os

os.makedirs('public/avatars', exist_ok=True)

src_files = [
    '/Users/amalchand/.gemini/antigravity/brain/8fbcaf14-1037-441e-961d-e01c450dadea/partner_avatar_1_1771435857413.png',
    '/Users/amalchand/.gemini/antigravity/brain/8fbcaf14-1037-441e-961d-e01c450dadea/partner_avatar_2_1771435883719.png',
    '/Users/amalchand/.gemini/antigravity/brain/8fbcaf14-1037-441e-961d-e01c450dadea/partner_avatar_3_1771436010791.png',
    '/Users/amalchand/.gemini/antigravity/brain/8fbcaf14-1037-441e-961d-e01c450dadea/partner_avatar_4_1771436035360.png'
]

dst_files = [
    'public/avatars/avatar1.png',
    'public/avatars/avatar2.png',
    'public/avatars/avatar3.png',
    'public/avatars/avatar4.png'
]

for src, dst in zip(src_files, dst_files):
    try:
        shutil.copy(src, dst)
        print(f"Copied {src} to {dst}")
    except Exception as e:
        print(f"Error copying {src}: {e}")
