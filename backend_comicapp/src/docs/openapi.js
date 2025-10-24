const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Comic App Backend API",
      version: "1.0.0",
      description: "Tài liệu API cho Comic App (Express + MySQL).",
    },
    servers: [
      { url: "http://localhost:3000/api", description: "Local" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, "../routes/**/*.js"),
    path.join(__dirname, "../controllers/**/*.js"),
    path.join(__dirname, "./**/*.yaml"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

function setupOpenAPI(app) {

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Comic App API Docs",
  }));

  app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));
}

module.exports = { setupOpenAPI, swaggerSpec };
