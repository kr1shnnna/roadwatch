const dotenv = require("dotenv");

const connectDB = require("../config/db");
const ServiceArea = require("../models/ServiceArea");

dotenv.config();

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const USER_AGENT =
  process.env.OSM_USER_AGENT ||
  "RoadWatch/1.0";

const CONTACT_EMAIL =
  process.env.OSM_CONTACT_EMAIL || null;


// Areas we want to import initially.
// legacyNames allows us to migrate our old demo
// "Knowledge Park" service area into "Knowledge Park I".
const serviceAreas = [
  {
    name: "Knowledge Park I",
    city: "Greater Noida",
    legacyNames: ["Knowledge Park"],
  },
  {
    name: "Knowledge Park II",
    city: "Greater Noida",
    legacyNames: [],
  },
  {
    name: "Knowledge Park III",
    city: "Greater Noida",
    legacyNames: [],
  },
  {
    name: "Alpha I",
    city: "Greater Noida",
    legacyNames: [],
  },
  {
    name: "Beta I",
    city: "Greater Noida",
    legacyNames: [],
  },
];


// Public Nominatim asks clients to keep usage
// light. We deliberately wait between requests.
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));


const isValidCoordinate = (coordinate) => {
  return (
    Array.isArray(coordinate) &&
    coordinate.length >= 2 &&
    Number.isFinite(coordinate[0]) &&
    Number.isFinite(coordinate[1])
  );
};


const isValidRing = (ring) => {
  if (!Array.isArray(ring) || ring.length < 4) {
    return false;
  }

  if (!ring.every(isValidCoordinate)) {
    return false;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  return (
    first[0] === last[0] &&
    first[1] === last[1]
  );
};


const isValidPolygonCoordinates = (coordinates) => {
  return (
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.every(isValidRing)
  );
};


const isValidMultiPolygonCoordinates = (coordinates) => {
  return (
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.every((polygon) =>
      Array.isArray(polygon) &&
      polygon.length > 0 &&
      polygon.every(isValidRing)
    )
  );
};


const validateGeoJSON = (geojson) => {
  if (!geojson || !geojson.type || !geojson.coordinates) {
    return false;
  }

  if (geojson.type === "Polygon") {
    return isValidPolygonCoordinates(
      geojson.coordinates
    );
  }

  if (geojson.type === "MultiPolygon") {
    return isValidMultiPolygonCoordinates(
      geojson.coordinates
    );
  }

  return false;
};


const searchOSMArea = async (area) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${area.name}, ${area.city}, Uttar Pradesh, India`,
    polygon_geojson: "1",
    addressdetails: "1",
    limit: "5",
    countrycodes: "in",

    // Focus results around Greater Noida.
    // Nominatim uses longitude,latitude ordering.
    viewbox: "77.30,28.55,77.50,28.35",
  });

  if (CONTACT_EMAIL) {
    params.set("email", CONTACT_EMAIL);
  }

  const response = await fetch(
    `${NOMINATIM_URL}?${params.toString()}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Nominatim request failed: ${response.status} ${response.statusText}`
    );
  }

  const results = await response.json();

  // We only accept results with an actual polygon geometry
  // and a Greater Noida match.
  const validResult = results.find((result) => {
    const displayName =
      result.display_name || "";

    return (
      /Greater Noida/i.test(displayName) &&
      validateGeoJSON(result.geojson)
    );
  });

  return validResult || null;
};


const importServiceAreas = async () => {
  try {
    await connectDB();

    console.log(
      "\nImporting real service-area boundaries from OpenStreetMap..."
    );
    console.log("----------------------------------------");

    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < serviceAreas.length; i++) {
      const area = serviceAreas[i];

      console.log(
        `\nSearching: ${area.name}, ${area.city}`
      );

      try {
        const result = await searchOSMArea(area);

        if (!result) {
          console.log(
            `⚠️ No usable polygon found for ${area.name}. Skipping.`
          );

          skippedCount++;

          // Respect public API request limits even after misses.
          if (i < serviceAreas.length - 1) {
            await sleep(1200);
          }

          continue;
        }

        const geometry = result.geojson;

        const osmUrl =
          result.osm_type && result.osm_id
            ? `https://www.openstreetmap.org/${result.osm_type}/${result.osm_id}`
            : null;

        const source = {
          provider: "openstreetmap",
          osmType: result.osm_type || null,
          osmId: result.osm_id
            ? String(result.osm_id)
            : null,
          displayName:
            result.display_name || null,
          url: osmUrl,
        };

        let serviceArea = await ServiceArea.findOne({
          name: area.name,
          city: area.city,
        });

        // Migrate the old demo service area without
        // breaking references from officers/assignments.
        if (!serviceArea && area.legacyNames.length > 0) {
          serviceArea = await ServiceArea.findOne({
            name: { $in: area.legacyNames },
            city: area.city,
          });

          if (serviceArea) {
            console.log(
              `Migrating legacy service area "${serviceArea.name}" → "${area.name}"`
            );
          }
        }

        if (serviceArea) {
          serviceArea.name = area.name;
          serviceArea.city = area.city;

          serviceArea.boundary = {
            type: geometry.type,
            coordinates: geometry.coordinates,
          };

          serviceArea.source = source;

          await serviceArea.save();

          console.log(
            `✅ Updated: ${area.name}`
          );
        } else {
          serviceArea = await ServiceArea.create({
            name: area.name,
            city: area.city,

            boundary: {
              type: geometry.type,
              coordinates: geometry.coordinates,
            },

            source,

            isActive: true,
          });

          console.log(
            `✅ Created: ${area.name}`
          );
        }

        console.log(
          `   OSM: ${result.osm_type}/${result.osm_id}`
        );

        console.log(
          `   Geometry: ${geometry.type}`
        );

        importedCount++;
      } catch (error) {
        console.error(
          `❌ Failed to import ${area.name}:`,
          error.message
        );

        skippedCount++;
      }

      // Maximum one request per second on the public
      // Nominatim service. We use 1.2 seconds.
      if (i < serviceAreas.length - 1) {
        await sleep(1200);
      }
    }

    console.log("\n----------------------------------------");
    console.log("Service-area import completed.");
    console.log("----------------------------------------");
    console.log(`Imported/updated: ${importedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log("----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error(
      "\nService-area import error:",
      error
    );

    process.exit(1);
  }
};

importServiceAreas();
