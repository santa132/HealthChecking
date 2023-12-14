/// <reference types="chart.js" />
let globalData;
const labelH = [];
const dataH = {
  labels: labelH,
  datasets: [
    {
      label: 'Nhịp tim',
      data: [],
      backgroundColor: 'rgba(255, 0, 0, 0.9)',
      borderColor: '#f82323',
      pointRadius: 15,
      tension: 0.4
    }
  ]
};
const labelS = [];
const dataS = {
  labels: labelS,
  datasets: [
    {
      label: 'SpO2',
      backgroundColor: 'rgba(134, 205, 13, 0.9)',
      borderColor: '#86cd0d',
      pointRadius: 15,
      data: [],
      tension: 0.4,
    }
  ]
};
const configH = {
  type: 'line',
  data: dataH,
  options: {
    scales: {
      x: {
        ticks: {
          display: true,
          pointRadius: 4,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      y: {
        ticks: {
          display: true,
          pointRadius: 4,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
    },
  },
};

const configS = {
  type: 'line',
  data: dataS,
  options: {
    scales: {
      x: {
        ticks: {
          display: true,
          pointRadius: 4,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      y: {
        ticks: {
          display: true,
          pointRadius: 4,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
    },
  },
};

Chart.defaults.color = '#484459';
Chart.defaults.borderColor = '#484459';

const canvasH = document.getElementById('canvasH');
const canvasS = document.getElementById('canvasS');
const chartH = new Chart(canvasH, configH);
const chartS = new Chart(canvasS, configS);

let currentIndex = 0;
let end = 0;
let lastTimestamp = null;

function updateChart() {
  chartH.update();
  chartS.update();
}

function updateData(index) {
  dataH.datasets[0].data.push(globalData[index].heartbeat);
  dataS.datasets[0].data.push(globalData[index].sp02);
  updateChart();
}

function fetchDataAndInitializeChart() {
  fetch('/api/getall')
    .then(response => response.json())
    .then(data => {
      globalData = data;
      labelH.push(...data.map(item => item.timing.substring(11, 19)));
      labelS.push(...data.map(item => item.timing.substring(11, 19)));
      lastTimestamp = data[data.length - 1].timing;
      currentIndex = globalData.length - 5;
      end = globalData.length - 1;
      updateChartConfiguration();

    })
    .catch(error => {
      console.error('Lỗi khi lấy dữ liệu từ server:', error);
    });
}

const socket = io();

socket.on('newData', function (data) {
  globalData.push(data);
  currentIndex = globalData.length - 5;
  end = globalData.length - 1;
  labelH.push(data.timing.substring(11, 19));
  labelS.push(data.timing.substring(11, 19));
  updateData(globalData.length - 1);
  lastTimestamp = data.timing;
  updateChartConfiguration();
});

fetchDataAndInitializeChart();

const btnBack = document.getElementById('btnBack');
btnBack.addEventListener('click', () => {
  if (currentIndex > 0 && (end - currentIndex == 4)) {
    currentIndex--;
    end--;
  }
  else if (currentIndex > 0) currentIndex--;
  updateChartConfiguration();
  updateChart();

});

const btnNext = document.getElementById('btnNext');
btnNext.addEventListener('click', () => {
  if (currentIndex < globalData.length - 5) {
    currentIndex++;
    end++;
    updateChartConfiguration();
    updateChart();
  }
});
// Xử lý sự kiện khi người dùng chọn một ngày trong lịch
function handleDayClick(day) {
  const selectedDate = $("#dob").datepicker("getDate");
  const selectedDateFormatted = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  let startIndex = -1;
  let endIndex = -1;
  console.log(globalData[10].timing.substring(0, 10));
  let i = 0;
  for (i; i < globalData.length; i++) {
    if (globalData[i].timing.substring(0, 10) === selectedDateFormatted) {
      startIndex = i;
      endIndex = i + 4;
      break;
    }
  }
  currentIndex = startIndex;
  end = endIndex;
  updateChartConfiguration();
  updateChart();
}

let predict = 0;
function updateChartConfiguration() {
  const displayedLabelH = labelH.slice(currentIndex, end + 1);
  const displayedLabelS = labelS.slice(currentIndex, end + 1);

  console.log('Displayed labels H:', displayedLabelH);
  console.log('Displayed labels S:', displayedLabelS);

  chartH.config.options.scales.x.max = displayedLabelH.length - 1;
  chartS.config.options.scales.x.max = displayedLabelS.length - 1;
  chartH.config.data.labels = displayedLabelH;
  chartS.config.data.labels = displayedLabelS;

  const heartbeatData = globalData
    .slice(currentIndex, end + 1)
    .map(item => item.heartbeat);
  const sp02Data = globalData
    .slice(currentIndex, end + 1)
    .map(item => item.sp02);

  chartH.config.data.datasets[0].data = heartbeatData;
  chartS.config.data.datasets[0].data = sp02Data;

  const selectedDate = new Date(globalData[end].timing.substring(0, 10));
  const formattedDate = $.datepicker.formatDate("yy-mm-dd", selectedDate);
  $("#dob").datepicker("setDate", formattedDate);

  console.log("end: " + end + "current: " + currentIndex);
  socket.emit('updateEndCurrent', { end, currentIndex });
  socket.on('prediction', function (data) {
    predict = data.prediction;
    document.dispatchEvent(new Event('dataUpdated'));
  });
  chartH.update();
  chartS.update();
  updateBPM(heartbeatData, sp02Data);
}



