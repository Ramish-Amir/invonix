export const DrawingCalibrationsV1: Record<string, Record<string, number>> = {
  "48x36": {
    // Same as 36x48
    "20": 0.03052,
    "30": 0.04578,
    "50": 0.0763,
    "75": 0.11445,
    "100": 0.1526, // confirmed
    "125": 0.19075,
    "150": 0.2289,
    "200": 0.3052,
    "250": 0.3815,
    "300": 0.4578,
    "500": 0.763,
  },
  "36x24": {
    // Same as 24x36
    "20": 0.02294,
    "30": 0.03441,
    "50": 0.05735,
    "75": 0.086025,
    "100": 0.1147, // confirmed
    "125": 0.143375,
    "150": 0.17205,
    "200": 0.2294,
    "250": 0.28675,
    "300": 0.3441,
    "500": 0.5735,
  },
  "54x36": {
    // Same as 54x36
    "20": 0.0342, // 1:20
    "30": 0.0513, // 1:30
    "50": 0.0855, // 1:50 (Verified manually)
    "75": 0.12825, // 1:75
    "100": 0.171, // 1:100 (Verified manually)
    "125": 0.21375, // 1:125
    "150": 0.2565, // 1:150
    "200": 0.342, // 1:200
    "250": 0.4275, // 1:250
    "300": 0.513, // 1:300
    "500": 0.855, // 1:500
  },
};

export const DrawingCalibrations = {
  "125": 0.1661, // 1:125 scale => 1 px = 0.1661 m
  "100": 0.1526, // 1:100 scale => 1 px = 0.1526 m (This is confirmed)
  "75": 0.0933, // 1:75 scale => 1 px = 0.0933 m
};

export const DEFAULT_CALLIBRATION_VALUE = "100";

export const getDrawingCallibrations = (
  scale: string,
  viewportDimensions: { width: number; height: number }
) => {
  const calibrations =
    DrawingCalibrationsV1[
      Math.max(viewportDimensions.width, viewportDimensions.height) +
        "x" +
        Math.min(viewportDimensions.width, viewportDimensions.height)
    ];

  return calibrations?.[scale || DEFAULT_CALLIBRATION_VALUE];
};
