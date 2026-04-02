import cv2
import traceback
import activity_api
try:
    gen = activity_api.generate_activity_frames()
    print(next(gen))
    print("Success")
except Exception as e:
    traceback.print_exc()
