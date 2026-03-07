export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SpaceOps Public API",
    version: "1.0.0",
    description:
      "REST API for SpaceOps cleaning operations management. Requires an Enterprise plan and a valid API key passed via the `x-api-key` header.",
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || "https://app.spacops.io",
    },
  ],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey" as const,
        in: "header" as const,
        name: "x-api-key",
        description: "API key obtained from Settings > API Keys",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      Building: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          address: { type: "string" },
          status: { type: "string", enum: ["active", "inactive", "setup"] },
          client_id: { type: "string", format: "uuid", nullable: true },
          latitude: { type: "number", nullable: true },
          longitude: { type: "number", nullable: true },
          geofence_radius_m: { type: "integer", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      BuildingDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          address: { type: "string" },
          status: { type: "string" },
          floors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                floor_number: { type: "integer" },
                floor_name: { type: "string" },
              },
            },
          },
        },
      },
      Activity: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          status: { type: "string" },
          scheduled_date: { type: "string", format: "date" },
          window_start: { type: "string" },
          window_end: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ActivityDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          status: { type: "string" },
          scheduled_date: { type: "string", format: "date" },
          room_tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                status: { type: "string" },
                started_at: { type: "string", nullable: true },
                completed_at: { type: "string", nullable: true },
                score: { type: "number", nullable: true },
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          role: {
            type: "string",
            enum: ["admin", "supervisor", "janitor", "client"],
          },
          is_active: { type: "boolean" },
          avatar_url: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ReportSummary: {
        type: "object",
        properties: {
          totalTasks: { type: "integer" },
          passedTasks: { type: "integer" },
          failedTasks: { type: "integer" },
          completedTasks: { type: "integer" },
          passRate: { type: "integer", nullable: true },
          totalActivities: { type: "integer" },
          period: {
            type: "object",
            properties: {
              from: { type: "string", nullable: true },
              to: { type: "string", nullable: true },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        description: "Returns service status. No authentication required.",
        security: [],
        tags: ["System"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                    version: { type: "string", example: "1.0.0" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/buildings": {
      get: {
        summary: "List buildings",
        description: "Returns all buildings for the authenticated organisation.",
        tags: ["Buildings"],
        responses: {
          "200": {
            description: "List of buildings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Building" },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden — Enterprise plan required" },
        },
      },
    },
    "/api/v1/buildings/{id}": {
      get: {
        summary: "Get building",
        description: "Returns a single building with its floors.",
        tags: ["Buildings"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Building details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/BuildingDetail" },
                  },
                },
              },
            },
          },
          "404": { description: "Building not found" },
        },
      },
    },
    "/api/v1/activities": {
      get: {
        summary: "List activities",
        description: "Returns cleaning activities with pagination and filters.",
        tags: ["Activities"],
        parameters: [
          {
            name: "date_from",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter activities from this date",
          },
          {
            name: "date_to",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter activities up to this date",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string" },
            description: "Filter by activity status",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 100 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          "200": {
            description: "List of activities",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        activities: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Activity" },
                        },
                        total: { type: "integer" },
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/activities/{id}": {
      get: {
        summary: "Get activity",
        description:
          "Returns a single activity with its room tasks.",
        tags: ["Activities"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Activity details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ActivityDetail" },
                  },
                },
              },
            },
          },
          "404": { description: "Activity not found" },
        },
      },
    },
    "/api/v1/users": {
      get: {
        summary: "List users",
        description: "Returns users for the authenticated organisation.",
        tags: ["Users"],
        parameters: [
          {
            name: "role",
            in: "query",
            schema: {
              type: "string",
              enum: ["admin", "supervisor", "janitor", "client"],
            },
            description: "Filter by role",
          },
          {
            name: "active",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
            description:
              "Filter by active status. Defaults to true (active only).",
          },
        ],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/reports/summary": {
      get: {
        summary: "Reports summary",
        description:
          "Returns aggregate report statistics for the organisation.",
        tags: ["Reports"],
        parameters: [
          {
            name: "date_from",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          {
            name: "date_to",
            in: "query",
            schema: { type: "string", format: "date" },
          },
        ],
        responses: {
          "200": {
            description: "Report summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ReportSummary" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
