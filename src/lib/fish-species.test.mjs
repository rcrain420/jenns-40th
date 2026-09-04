import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_FISH_BREEDS,
  FISH_ESTIMATE_BREEDS,
  FISH_ESTIMATE_JSON_SCHEMA,
  FISH_ESTIMATE_SYSTEM_PROMPT,
  FISH_ESTIMATE_USER_PROMPT,
  fishEstimateChatBody,
  TOURNAMENT_FISH_BREEDS,
  UNKNOWN_FISH_BREED,
  normalizeFishBreed,
} from "./fish-species.ts";

describe("Livewell species lock", () => {
  it("allows exactly Aaron's Rockport five plus Unknown", () => {
    assert.deepEqual([...ALLOWED_FISH_BREEDS], [
      "Redfish",
      "Trout",
      "Black drum",
      "Hardhead catfish",
      "Gafftop",
    ]);
    assert.deepEqual([...FISH_ESTIMATE_BREEDS], [
      ...ALLOWED_FISH_BREEDS,
      "Unknown",
    ]);
    assert.deepEqual([...TOURNAMENT_FISH_BREEDS], ["Redfish", "Trout"]);
    assert.equal(UNKNOWN_FISH_BREED, "Unknown");
  });

  it("maps Texas-angler aliases to the display names", () => {
    assert.equal(normalizeFishBreed("Red drum"), "Redfish");
    assert.equal(normalizeFishBreed("redfish"), "Redfish");
    assert.equal(normalizeFishBreed("slot red"), "Redfish");
    assert.equal(normalizeFishBreed("Speckled trout"), "Trout");
    assert.equal(normalizeFishBreed("spotted seatrout"), "Trout");
    assert.equal(normalizeFishBreed("specks"), "Trout");
    assert.equal(normalizeFishBreed("Black drum"), "Black drum");
    assert.equal(normalizeFishBreed("hardhead"), "Hardhead catfish");
    assert.equal(normalizeFishBreed("Hardhead catfish"), "Hardhead catfish");
    assert.equal(normalizeFishBreed("gafftopsail catfish"), "Gafftop");
    assert.equal(normalizeFishBreed("Gafftop"), "Gafftop");
  });

  it("never returns unidentified gulf fish or other freeform labels", () => {
    assert.equal(normalizeFishBreed("unidentified gulf fish"), "Unknown");
    assert.equal(normalizeFishBreed("Unidentified Gulf fish"), "Unknown");
    assert.equal(normalizeFishBreed("Unidentified fish"), "Unknown");
    assert.equal(normalizeFishBreed("Flounder"), "Unknown");
    assert.equal(normalizeFishBreed("Sheepshead"), "Unknown");
    assert.equal(normalizeFishBreed("Spanish mackerel"), "Unknown");
    assert.equal(normalizeFishBreed(""), "Unknown");
    assert.equal(normalizeFishBreed(null), "Unknown");
    assert.equal(normalizeFishBreed("   "), "Unknown");
  });

  it("does not invent a tournament fish from a clear non-tournament name", () => {
    assert.equal(normalizeFishBreed("black drum"), "Black drum");
    assert.equal(normalizeFishBreed("hard head cat"), "Hardhead catfish");
    assert.equal(normalizeFishBreed("gaff topsail"), "Gafftop");
    assert.equal(normalizeFishBreed("maybe a sheepshead"), "Unknown");
  });

  it("keeps Redfish when the label is a gulf redfish, not a vague gulf fish", () => {
    assert.equal(normalizeFishBreed("Texas gulf redfish"), "Redfish");
  });
});

describe("vision prompt and JSON schema", () => {
  it("constrains breed to the allowed enum", () => {
    assert.deepEqual(
      [...FISH_ESTIMATE_JSON_SCHEMA.schema.properties.breed.enum],
      [...FISH_ESTIMATE_BREEDS],
    );
    assert.equal(FISH_ESTIMATE_JSON_SCHEMA.strict, true);
    assert.equal(FISH_ESTIMATE_JSON_SCHEMA.schema.additionalProperties, false);
  });

  it("tells the model the five names, Unknown, and no freeform gulf label", () => {
    for (const name of ALLOWED_FISH_BREEDS) {
      assert.match(FISH_ESTIMATE_SYSTEM_PROMPT, new RegExp(name));
      assert.match(FISH_ESTIMATE_USER_PROMPT, new RegExp(name));
    }
    assert.match(FISH_ESTIMATE_SYSTEM_PROMPT, /Unknown/);
    assert.match(FISH_ESTIMATE_SYSTEM_PROMPT, /unidentified gulf fish/);
    assert.match(FISH_ESTIMATE_SYSTEM_PROMPT, /Never output other species/);
    assert.match(FISH_ESTIMATE_SYSTEM_PROMPT, /prefer Redfish or Trout/i);
    assert.match(
      FISH_ESTIMATE_SYSTEM_PROMPT,
      /Do not invent Redfish or Trout/,
    );
  });

  it("sends the enum schema on the OpenAI chat body", () => {
    const body = fishEstimateChatBody("https://blob.example/catch.jpg", "gpt-4o-mini");
    assert.equal(body.response_format.type, "json_schema");
    assert.deepEqual(
      body.response_format.json_schema.schema.properties.breed.enum,
      [...FISH_ESTIMATE_BREEDS],
    );
    assert.equal(body.messages[0]?.content, FISH_ESTIMATE_SYSTEM_PROMPT);
    const userText = body.messages[1]?.content[0];
    assert.equal(userText?.type, "text");
    assert.equal(userText?.text, FISH_ESTIMATE_USER_PROMPT);
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes("unidentified gulf fish"), true);
    assert.equal(serialized.includes("Sheepshead"), false);
    assert.equal(serialized.includes("Spanish mackerel"), false);
  });
});
