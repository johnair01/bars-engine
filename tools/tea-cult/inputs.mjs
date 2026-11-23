/* Joins the kneeling cultivation figure's dump (tools/tea-cult/dump.mjs) with the numbers of public/between/tea-pose.js for
   art/between/tea-drink/build.py. Prints JSON.   node tools/tea-cult/inputs.mjs /tmp/tea-cult-f.json > /tmp/tea-inputs-f.json */
import fs from 'node:fs';
import { KETTLE, CUP, kettleAt, cupSpot } from '../../public/between/tea-pose.js';
const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log(JSON.stringify({ ...D, KETTLE, CUP, kettle: kettleAt(), cupSpot: cupSpot() }));
