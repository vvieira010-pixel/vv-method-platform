import type { LoadedSkill } from "./types.js";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export function buildSkillToolDefinition(skill: LoadedSkill): McpToolDefinition {
  const { metadata, description, toolName } = skill;
  const properties: Record<string, { type: string; description: string }> = {};
  const required: string[] = [];

  for (const field of metadata.input_schema.required) {
    properties[field.field] = {
      type: field.type === "array" ? "array" : "string",
      description: field.description,
    };
    required.push(field.field);
  }

  if (metadata.input_schema.optional) {
    for (const field of metadata.input_schema.optional) {
      properties[field.field] = {
        type: field.type === "array" ? "array" : "string",
        description: field.description,
      };
    }
  }

  const evidenceTag = metadata.evidence_strength ? ` [evidence: ${metadata.evidence_strength}]` : "";

  return {
    name: toolName,
    description: `${metadata.skill_name} — ${description}${evidenceTag}`,
    inputSchema: {
      type: "object",
      properties,
      required,
    },
  };
}

export function buildMetaToolDefinitions(): McpToolDefinition[] {
  return [
    {
      name: "list_skills",
      description:
        "List all available education skills grouped by domain. Returns skill ID, name, evidence strength, tags, and estimated teacher time for each.",
      inputSchema: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description:
              "Optional: filter to a specific domain (e.g. 'memory-learning-science'). Omit for all domains.",
          },
        },
        required: [],
      },
    },
    {
      name: "get_skill_details",
      description:
        "Get full metadata for a specific skill including evidence sources, input/output schemas, and chaining information.",
      inputSchema: {
        type: "object",
        properties: {
          skill_id: {
            type: "string",
            description: "The skill ID (e.g. 'memory-learning-science/cognitive-load-analyser')",
          },
        },
        required: ["skill_id"],
      },
    },
    {
      name: "find_skills",
      description:
        "Search skills by tag, domain, evidence strength, or free text across skill names and descriptions.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Free text search across skill names, descriptions, and tags",
          },
          domain: {
            type: "string",
            description: "Filter by domain",
          },
          evidence_strength: {
            type: "string",
            description: "Filter by evidence strength: strong | moderate | emerging | original | practitioner",
          },
          tag: {
            type: "string",
            description: "Filter by tag",
          },
        },
        required: [],
      },
    },
    {
      name: "suggest_skills",
      description:
        "Describe what you're trying to do in plain English and get 3-5 relevant skills recommended with explanations of why each is relevant. The entry point for users who don't know what skills exist.",
      inputSchema: {
        type: "object",
        properties: {
          problem_description: {
            type: "string",
            description:
              "Plain English description of what the teacher is trying to do (e.g. 'My Year 9 students keep forgetting content from earlier in the term')",
          },
        },
        required: ["problem_description"],
      },
    },
  ];
}
