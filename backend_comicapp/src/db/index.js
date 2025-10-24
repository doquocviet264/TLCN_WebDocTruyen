const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, dialect: "mysql", logging: false }
);

// GỌI models/index.js 
const buildModels = require("../models");
const models = buildModels(sequelize, DataTypes);

async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync(); // hoặc { alter:false }
  console.log("✅ Database connected & synced");
}

module.exports = { sequelize, models, initDb };