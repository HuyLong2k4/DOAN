const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const src = 'D:/Đồ án/Hinhve/Giaiphap/state_lifecycle.svg';
const out = 'D:/Đồ án/Hinhve/Giaiphap/state_lifecycle.png';
const resvg = new Resvg(fs.readFileSync(src), { fitTo: { mode: 'width', value: 2200 }, font: { loadSystemFonts: true }, background: 'white' });
fs.writeFileSync(out, resvg.render().asPng());
console.log('done');
