import cv2
import sys
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Cannot open camera 0")
    cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        print("Cannot open camera 1")
    else:
        print("Opened camera 1")
else:
    print("Opened camera 0")
    ret, frame = cap.read()
    print("Read success:", ret)
