import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "inklink-api",
  version: "1.0.0",
});

server.registerTool(
  "createRequest",
  {
    title: "Proof request tool",
    description:
      "Creates an inklink proof request with the given title category and description",
    inputSchema: {
      title: z.string(),
      category: z.string(),
      description: z.string(),
      api_key: z.string(),
    },
  },
  async ({ title, category, description, api_key }) => {
    const response = await fetch("https://app.inklink.dev/api/request", {
      method: "POST",
      headers: {
        "x-api-key": api_key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proof_request_description: description,
        proof_title: title,
        category: category.toUpperCase(),
      }),
    });
    const data = await response.json();
    if (data.error) {
      return {
        content: [{ type: "text", text: String(data.error) }],
      };
    }
    return {
      content: [
        { type: "text", text: String(data.request_id) },
        { type: "text", text: String(data.request_url) },
      ],
    };
  }
);

server.registerTool(
  "createSessionId",
  {
    title: "Request session id tool",
    description:
      "Creates a session id for an inklink proof request and sets a return url. Used to track a specific user's request",
    inputSchema: {
      id: z.string(),
      url: z.string(),
      api_key: z.string(),
    },
  },
  async ({ id, url, api_key }) => {
    const response = await fetch(
      "https://app.inklink.dev/api/request-session-id",
      {
        method: "POST",
        headers: {
          "x-api-key": api_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: id,
          return_url: url,
        }),
      }
    );
    const data = await response.json();
    if (data.error) {
      return {
        content: [{ type: "text", text: String(data.error) }],
      };
    }
    return {
      content: [
        { type: "text", text: String(data.session_id) },
        { type: "text", text: String(data.request_url) },
      ],
    };
  }
);

server.registerTool(
  "retrieveResults",
  {
    title: "Retrieve request results tool",
    description: "Retrieves the results of an inklink proof request",
    inputSchema: {
      id: z.string(),
      api_key: z.string(),
    },
  },
  async ({ id, api_key }) => {
    try {
      const response = await fetch(
        `https://app.inklink.dev/api/request-result/${id}`,
        {
          method: "GET",
          headers: {
            "x-api-key": api_key,
          },
        }
      );
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text:
              "Proof was completed with a credibility level of:" +
              String(data.data[0].credibility_category),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: "Proof has not been completed" }],
      };
    }
  }
);

server.registerTool(
  "retrieveSessionResults",
  {
    title: "Retrieve request session results tool",
    description: "Retrieves the results of an inklink proof request session",
    inputSchema: {
      id: z.string(),
      sid: z.string(),
      api_key: z.string(),
    },
  },
  async ({ id, sid, api_key }) => {
    try {
      const response = await fetch(
        `https://app.inklink.dev/api/request-result/${id}?session_id${sid}`,
        {
          method: "GET",
          headers: {
            "x-api-key": api_key,
          },
        }
      );
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text:
              "Proof was completed with a credibility level of:" +
              String(data.data[0].credibility_category),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: "Proof has not been completed" }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
