import { MongoClient } from 'mongodb';
import 'dotenv/config';

const url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.u5gnt.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;

export async function connectToDatabase() {
  const client = await MongoClient.connect(url);
  return client;
}

export async function getUserSetting(email) {
  const client = await connectToDatabase();
  const usersCollection = client.db().collection('users');
  const existingUser = await usersCollection.findOne({ email });
  if (!existingUser) {
    client.close();
    throw new Error('Cannot find user!');
  }
  client.close();
  const result = {
    setting: existingUser.setting,
    lat: existingUser.lat,
    lon: existingUser.lon,
  };
  return result;
}
