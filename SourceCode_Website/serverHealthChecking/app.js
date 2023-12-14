require('dotenv').config();
require("colors");
const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const infoSensor = require('./models/model.js');
const mqtt = require('mqtt'); // Thêm dòng này để import thư viện mqtt

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.set('view engine', 'html'); // Sử dụng ejs làm view engine
app.engine('html', require('ejs').renderFile);

//connect MongoDB
const DBConnection = require("./config/db");
DBConnection();

//Socket io
const http = require('http');
const server = http.createServer(app);
const {Server} = require ('socket.io')
let end = 0;
let currentIndex = 0;
const io = new Server(server)

let sp02Data = [];
let heartbeatData = [];

io.on('connection', (socket) => {
    console.log ("A client connected".yellow);
    // Lắng nghe sự kiện 'updateEndCurrent' từ client
    socket.on('updateEndCurrent', (data) => {
        end = data.end;
        currentIndex = data.currentIndex;

        let startIndex = currentIndex;
        let endIndex = end;
    
        let selectedSp02Data = sp02Data.slice(startIndex, endIndex + 1);
        console.log(selectedSp02Data);
        
        let selectedHeartbeatData = heartbeatData.slice(startIndex, endIndex + 1);
        console.log(selectedHeartbeatData);
        let sp02Average = calculateAverage(selectedSp02Data);
        let heartbeatAverage = calculateAverage(selectedHeartbeatData);
        console.log("TB_SP02:= "+sp02Average);
        console.log("TB_HEARTBEAT: =" +heartbeatAverage);
        let prediction = predict('21', heartbeatAverage, sp02Average);
        console.log(prediction);
        io.emit('prediction',{prediction});            
    });
});

// MQTT
const host = 'broker.emqx.io';
const port = '1883';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`;

const clientMqtt = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: '',
    password: '',
    reconnectPeriod: 1000,
});

const topic = 'CE232_PUB';

clientMqtt.on('connect', () => {
    console.log('MQTT Connected'.cyan.bold.underline);

    clientMqtt.subscribe([topic], () => {
        console.log(`Subscribe to topic '${topic}'`.blue.bold.underline);
    });
});

clientMqtt.on('message', (topic, message) => {
    //message is a Buffer
    let strMessage = message.toString();
    console.log("********".cyan.bold);
    console.log(strMessage.cyan.bold);

    //Split messsage
    let dataArray = strMessage.split("\n");

    // Lấy giá trị Heart beat rate từ phần tử thứ nhất trong mảng
    let heartbeatString = dataArray[0].split(":")[1].trim();
    let heartbeat = parseFloat(heartbeatString);
    
    // Lấy giá trị SpO2 từ phần tử thứ hai trong mảng
    let sp02String = dataArray[1].split(":")[1].trim();
    let sp02 = parseFloat(sp02String);

    //Thời gian hiện tại
    const currentTime = moment();
    const currentTimeUTC7 = currentTime.utcOffset(7);
    const timing = currentTimeUTC7.format('YYYY-MM-DD HH:mm:ss');
    console.log(`Timing: ${timing}`.cyan.bold);

    const data = new infoSensor({
      age: "21",
      sp02: sp02,
      heartbeat: heartbeat,
      timing: timing
  })
    data.save()
        .then(() => {
            console.log('Data saved to MongoDB'.green.bold);
            sp02Data.push(data.sp02);
            heartbeatData.push(data.heartbeat);

            io.emit('newData', data);
        })
        .catch((error) => {
            console.error(error);
        });
})

//AI
function calculateAverage(data) {
    const sum = data.reduce((total, value) => total + value, 0);
    const average = sum / data.length;
    return average;
}
let predict = (in1, in2, in3) => {
    const coefficients = [0.08548920334542164, 0.10159895551625349, -0.9682936444948846];
    const intercept = 79.32097643456484;
  
    let prediction = intercept;
    prediction += coefficients[0] * in1;
    prediction += coefficients[1] * in2;
    prediction += coefficients[2] * in3;
    let P = 1 / (1 + Math.exp(-prediction));
    return P;
  };

//Web app
app.get('/', async (req, res) => 
{
    try
    {
    const data = await infoSensor.find().exec();
    sp02Data = data.map(item => item.sp02);
    heartbeatData = data.map(item => item.heartbeat);
    res.render('home', { data });
    } 
    
    catch(error) 
    {
        console.error('Error retrieving data from MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
);

app.get('/api/getall', async (req, res) => {
    try{
        const data = await infoSensor.find();
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

