if (process.argv.length == 3) {
  var in_file = process.argv[2]
  var out_file = null
} else if (process.argv.length == 4) {
  var in_file = process.argv[2]
  var out_file = process.argv[3]
} else {
  console.log("Usage: node convert.js <input.json> [optional-output.js]")
  return
}

try {
  var compass = require(`./${in_file}`)
} catch {
  console.log(`${in_file} is not a valid JSON file.`)
  return 
}

var mongoose = ''

const get_field_type = (field) => {
  const type_map = {
    "ObjectID": "Schema.Types.ObjectId",
    "Mixed": "Schema.Types.Mixed",
    "Int32": "Number",
    "Double": "Number"
  }

  if (field.types.length == 0)
    return ""

  const types = field.types
    .map(t => t.name)
    .filter(t => t != "Undefined")
    .map(t => (t in type_map) ? type_map[t] : t)

  return (new Set(types)).size > 1 ? "Schema.Types.Mixed": types[0]
}
const recurse = (schema, depth) => {
  const indent = "\n" + "\t".repeat(depth)
  for (const field of schema.fields) {
    const type = get_field_type(field)
    const present_in = field.probability < 1 ? ` // coverage: ${(field.probability * 100).toFixed(1)}%` : ""

    if (type == "Array") {
      let type_obj = field
      let arr_type = type
      let arr_depth = 0
      
      while (arr_type == "Array") {
        type_obj = type_obj.types.find(t => t.name == "Array")
        arr_type = get_field_type(type_obj)
        arr_depth++
      }

      const left_brackets = "[".repeat(arr_depth)
      const right_brackets = "]".repeat(arr_depth)

      if (field.name == "type") {
        if (arr_type == "Document") {
          mongoose += `${indent}${field.name}: { type: ${left_brackets}{${present_in}`
          
          const doc_schema = type_obj.types.find(t => t.name == "Document")
          recurse(doc_schema, depth + 1)

          mongoose += `${indent}}${right_brackets}},`
        } else {
          mongoose += `${indent}${field.name}: { type: ${left_brackets}${arr_type}${right_brackets} },${present_in}`
        }
      } else {
        if (arr_type == "Document") {
          mongoose += `${indent}${field.name}: ${left_brackets}{${present_in}`

          const doc_schema = type_obj.types.find(t => t.name == "Document")
          recurse(doc_schema, depth + 1)

          mongoose += `${indent}}${right_brackets},`
        } else {
          mongoose += `${indent}${field.name}: ${left_brackets}${arr_type}${right_brackets},${present_in}`
        }
      }
    } else if (type == "Document") {
      mongoose += `${indent}${field.name}: {${present_in}`

      const doc_schema = field.types.find(t => t.name == "Document")
      recurse(doc_schema, depth + 1)

      mongoose += `${indent}},`
    } else {
      if (field.name == "type")
        mongoose += `${indent}${field.name}: { type: ${type} },${present_in}`
      else
        mongoose += `${indent}${field.name}: ${type},${present_in}`
    }
  }
}

recurse(compass, 1)

var output = `import mongoose, { Schema } from 'mongoose';\n\nconst schema = new Schema({${mongoose}\n})`

if (out_file == null) {
  console.log(output)
} else {
  const fs = require("fs")
  try {
    fs.writeFileSync(out_file, output)			
    console.log(`Output successfully written to ${out_file}`)
  } catch (err) {
    console.log(`Error while writing output to ${out_file}`)
  }
}
