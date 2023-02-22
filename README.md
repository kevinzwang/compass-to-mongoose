# compass-to-mongoose

A tool to convert MongoDB schemas generated with [MongoDB Compass](https://www.mongodb.com/products/compass) to the [mongoose](https://mongoosejs.com/) `Schema` format.

## Instructions

1. Connect to your MongoDB database with Compass
1. Copy the schema for a collection with `Collection -> Share Schema as JSON`
1. Paste schema into a JSON file
1. Run `node convert.js <schema.json>` to print a converted schema, or `node convert.js <schema.json> <output.js>` to create a new file and write the converted schema to that file.
