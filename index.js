import mqtt from 'mqtt';
import 'dotenv/config';
import { getUserSetting } from './db.js';
import axios from 'axios';

const settings = {};
const client = mqtt.connect('mqtt://test.mosquitto.org');
let payload = {};
client.on('connect', function () {
  client.subscribe('weatherbender/start', function (err) {
    if (!err) {
      console.log('subscribed to weatherbender/start');
    }
  });

  setInterval(async () => {
    for (const account in settings) {
      let weatherCondition;

      if (!settings[account].apiCallCount) {
        settings[account].apiCallCount = 0;
      }
      if (settings[account].apiCallCount >= 40) {
        delete settings[account];
        console.log(
          `Api call limit for ??? is reached. Removing user from register`
        );
        continue;
      }

      settings[account].apiCallCount = settings[account].apiCallCount + 1;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${settings[account].lat}&lon=${settings[account].lon}&appid=${process.env.APPID}&units=metric`;
      const response = await axios.get(url);
      if (response) {
        const data = response.data;
        weatherCondition = data.weather[0].description;
        payload = {
          weather: weatherCondition,
          lat: data.coord.lat,
          lon: data.coord.lon,
          temp: data.main.temp,
          humidity: data.main.humidity,
        };
        console.log(
          `API call count for account ???: `,
          settings[account].apiCallCount
        );
        console.log(
          `Real weather: ${weatherCondition}, setting: ${settings[account].setting}`
        );
        console.log('=');
        if (settings[account].setting === 'default') {
          if (!weatherCondition.includes('rain')) {
            console.log(`Publishing Topic: weatherbender/???/desc`);
            payload.weather = 0;
            client.publish(
              `weatherbender/${account}/desc`,
              Buffer.from(JSON.stringify(payload))
            );
          }
        }
      }
      if (
        settings[account].setting === 'light rain' ||
        weatherCondition === 'light rain'
      ) {
        console.log(`Publishing Topic: weatherbender/???/desc`);
        payload.weather = 1;
        client.publish(
          `weatherbender/${account}/desc`,
          Buffer.from(JSON.stringify(payload))
        );
      }
      if (
        settings[account].setting === 'moderate rain' ||
        weatherCondition === 'moderate rain'
      ) {
        console.log(`Publishing Topic: weatherbender/???/desc`);
        payload.weather = 2;
        client.publish(
          `weatherbender/${account}/desc`,
          Buffer.from(JSON.stringify(payload))
        );
      }
      if (
        settings[account].setting === 'heavy intensity rain' ||
        weatherCondition === 'heavy intensity rain'
      ) {
        console.log(`Publishing Topic: weatherbender/{???}/desc`);
        payload.weather = 3;
        client.publish(
          `weatherbender/${account}/desc`,
          Buffer.from(JSON.stringify(payload))
        );
      }
    }
    console.log('waiting for 15s before next publish');
    console.log('========================================');
  }, 15000);
});

// 0(not raining)
// 1(light rain)
// 2(moderate rain)
// 3(heavy intensity rain)
client.on('message', async function (topic, message) {
  // message is Buffer
  if (topic === 'weatherbender/start') {
    console.log(`New topic is upserted!`);
    const email = message.toString();

    const userSetting = await getUserSetting(email);

    const setting = userSetting.setting;
    const lat = userSetting.lat;
    const lon = userSetting.lon;
    // const tbToken = userSetting.tbToken;
    const userName = email.split('@')[0];

    if (userName && lat && lon && setting) {
      settings[userName] = {
        setting,
        lat,
        lon,
        // tbToken,
      };
    }
  }
  // client.end();
});
