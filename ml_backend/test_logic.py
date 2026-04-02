import activity_api
from collections import namedtuple

NormalizedLandmark = namedtuple('NormalizedLandmark', ['x', 'y', 'z', 'visibility', 'presence'])
landmarks = [NormalizedLandmark(x=0.5, y=0.5, z=0, visibility=0.9, presence=0.9) for _ in range(33)]
landmarks[0] = NormalizedLandmark(x=0.5, y=0.1, z=0, visibility=0.9, presence=0.9) # nose
landmarks[24] = NormalizedLandmark(x=0.5, y=0.5, z=0, visibility=0.9, presence=0.9) # hip
landmarks[26] = NormalizedLandmark(x=0.5, y=0.7, z=0, visibility=0.9, presence=0.9) # knee
landmarks[28] = NormalizedLandmark(x=0.5, y=0.9, z=0, visibility=0.9, presence=0.9) # right ankle
landmarks[27] = NormalizedLandmark(x=0.6, y=0.9, z=0, visibility=0.9, presence=0.9) # left ankle

print(activity_api.classify_pose(landmarks))
