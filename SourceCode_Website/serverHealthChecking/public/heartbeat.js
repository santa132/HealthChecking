function updateBPM(heartbeatData, spo2Data) {
  const lastHeartbeat = heartbeatData[heartbeatData.length - 1];
  const lastSpO2 = spo2Data[spo2Data.length - 1];
  
  const bpmDisplay = document.getElementById('bpm-value');
  const spo2Display = document.getElementById('spo2-value');
  const bpmContainer = document.getElementById('bpm-display-container');

  bpmDisplay.textContent = lastHeartbeat;
  spo2Display.textContent = lastSpO2;

  bpmContainer.classList.remove('low-risk', 'normal-range', 'high-risk', 'pulse', 'low-spo2', 'normal-spo2', 'high-spo2');

  if (lastHeartbeat < 60) {
    bpmContainer.classList.add('low-risk', 'pulse');
  } else if (lastHeartbeat >= 60 && lastHeartbeat < 100) {
    bpmContainer.classList.add('normal-range');
  } else {
    bpmContainer.classList.add('high-risk', 'pulse');
  }

  if (lastSpO2 < 95) {
    bpmContainer.classList.add('low-spo2');
  } else if (lastSpO2 >= 95 && lastSpO2 <= 100) {
    bpmContainer.classList.add('normal-spo2');
  } else {
    bpmContainer.classList.add('high-spo2');
  }
}
